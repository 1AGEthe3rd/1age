"""1AGE Phone Controller: one host, one phone, expiring capability pairing."""
from __future__ import annotations

import argparse
import asyncio
from collections import defaultdict, deque
import hashlib
import io
import ipaddress
import json
import math
from pathlib import Path
import secrets
import socket
import subprocess
import os
import shutil
import time
import urllib.parse
import webbrowser

from aiohttp import web, WSMsgType
import qrcode

HERE = Path(__file__).resolve().parent
BUTTONS = frozenset(("A", "B", "X", "Y", "Menu", "Tool", "Save"))
ZERO = {"move": [0, 0], "look": [0, 0], "buttons": {}}


def clean_state(data):
    if not isinstance(data, dict):
        raise ValueError("state must be an object")
    result = {}
    for name in ("move", "look"):
        axis = data.get(name)
        if not isinstance(axis, list) or len(axis) != 2:
            raise ValueError("invalid axes")
        if any(type(v) not in (float, int) or not math.isfinite(v) for v in axis):
            raise ValueError("invalid axis value")
        length = math.hypot(*axis)
        result[name] = [v / max(1.0, length) for v in axis]
    buttons = data.get("buttons", {})
    if not isinstance(buttons, dict) or any(k not in BUTTONS or type(v) is not bool for k, v in buttons.items()):
        raise ValueError("invalid buttons")
    result["buttons"] = {k: bool(buttons.get(k)) for k in BUTTONS}
    return result


class Session:
    def __init__(self):
        self.id = secrets.token_urlsafe(18)
        self.pin = f"{secrets.randbelow(1_000_000):06d}"
        self.invitation = secrets.token_urlsafe(32)
        self.phone_token = None
        self.created = time.monotonic()
        self.expires = self.created + 120
        self.active_until = 0
        self.last_input = 0
        self.last_phone = 0
        self.state = dict(ZERO)
        self.events = deque(maxlen=64)
        self.seq = 0
        self.host = None
        self.phone = None
        self.rates = deque()
        self.text_ids = set()
        self.text_rate = deque()

    def pair(self):
        if time.monotonic() > self.expires or self.phone_token is not None:
            raise ValueError("Pairing expired or already used. Create a new code on the computer.")
        self.phone_token = secrets.token_urlsafe(32)
        self.active_until = time.monotonic() + 1800
        self.last_phone = time.monotonic()
        self.invitation = ""
        self.pin = ""
        return self.phone_token

    def input(self, data):
        now = time.monotonic()
        while self.rates and now - self.rates[0] > 1:
            self.rates.popleft()
        if len(self.rates) >= 90:
            raise ValueError("Input rate exceeded")
        self.rates.append(now)
        state = clean_state(data)
        for key in BUTTONS:
            if state["buttons"].get(key) and not self.state["buttons"].get(key):
                self.seq += 1
                self.events.append({"id": self.seq, "button": key})
        self.state = state
        self.last_input = self.last_phone = now

    def text_input(self, data):
        now = time.monotonic()
        text, identifier = data.get("text"), data.get("id")
        if not isinstance(text, str) or not text or len(text) > 1000 or len(text.encode("utf-8")) > 2000 or not isinstance(identifier, str) or not 1 <= len(identifier) <= 80:
            raise ValueError("Invalid text message")
        if identifier in self.text_ids:
            return
        while self.text_rate and now - self.text_rate[0] > 1:
            self.text_rate.popleft()
        if len(self.text_rate) >= 5 or len(self.text_ids) >= 500:
            raise ValueError("Text limit reached")
        self.text_rate.append(now)
        self.text_ids.add(identifier)
        self.seq += 1
        self.events.append({"id": self.seq, "type": "text", "text": text})

    def sample(self):
        now = time.monotonic()
        active = self.phone is not None and now < self.active_until and now - self.last_input <= .35
        # Losing input cancels motion immediately and never replays stale button taps.
        if not active:
            self.state = dict(ZERO)
            self.events.clear()
        return {"type": "state", "paired": self.phone_token is not None,
                "connected": active, "state": self.state,
                "events": list(self.events)}


class ControllerServer:
    def __init__(self, origin, nlc_root, native_root=None):
        self.origin = origin.rstrip("/")
        self.admin = secrets.token_urlsafe(32)
        self.session = None
        self.attempts = defaultdict(deque)
        self.global_attempts = deque()
        self.nlc_root = Path(nlc_root).resolve()
        self.hosts = {urllib.parse.urlsplit(self.origin).netloc}
        self.native_root = Path(native_root).resolve() if native_root else None
        self.native_process = None
        self.native_log = None

    def native_running(self):
        return self.native_process is not None and self.native_process.poll() is None

    async def native_open(self, request):
        if not self.authorized(request):
            raise web.HTTPUnauthorized()
        root = self.native_root
        if root is None or not (root / "design/phone_input.gd").is_file():
            raise web.HTTPConflict(text="Install this package's desktop update on this computer first.")
        if not self.session or not self.session.phone_token:
            raise web.HTTPConflict(text="Pair a phone first.")
        if self.native_running():
            return web.json_response({"ok": True})
        # Reuse the installed engine and world; this endpoint cannot choose commands or files.
        home = Path.home()
        candidates = [home / "Applications/Godot4/Godot_v4.7.2-stable_linux.x86_64",
                      home / "1AGE/Tools/Godot4/Godot_v4.7.2-stable_linux.x86_64",
                      home / "1AGE/Tools/Godot/Godot_v4.7.2-stable_linux.x86_64"]
        binary = next((str(p) for p in candidates if p.is_file() and os.access(p, os.X_OK)), None)
        binary = binary or shutil.which("godot4") or shutil.which("godot")
        if not binary:
            raise web.HTTPConflict(text="Existing Godot installation not found.")
        if self.native_log:
            self.native_log.close()
        state = Path.home() / ".local/state/1age"
        state.mkdir(parents=True, exist_ok=True)
        self.native_log = (state / "phone-world.log").open("w")
        env = dict(os.environ, ONEAGE_PHONE_URL=self.origin, ONEAGE_PHONE_TOKEN=self.admin)
        command = [binary, "--path", str(root), "--fullscreen", "--rendering-method", "gl_compatibility",
                   "res://design/builder_entry.tscn", "--", "--builder=world"]
        self.native_process = subprocess.Popen(command, cwd=root, env=env, stdout=self.native_log, stderr=subprocess.STDOUT)
        self.session.events.clear()
        if self.session.phone is not None:
            await self.session.phone.send_json({"type": "context", "native": True})
        return web.json_response({"ok": True})

    async def native_state(self, request):
        if not self.authorized(request):
            raise web.HTTPUnauthorized()
        s = self.session
        if not s or not self.native_running():
            return web.json_response({"connected": False, "state": ZERO, "events": []})
        try:
            ack = int(request.query.get("ack", "0"))
        except ValueError:
            raise web.HTTPBadRequest()
        while request.query.get("session") == s.id and s.events and s.events[0]["id"] <= ack:
            s.events.popleft()
        return web.json_response({**s.sample(), "session": s.id})

    def authorized(self, request):
        return secrets.compare_digest(request.headers.get("Authorization", ""), "Bearer " + self.admin)

    @web.middleware
    async def guard(self, request, handler):
        # Host validation also blocks DNS rebinding against the LAN listener.
        if request.host not in self.hosts:
            raise web.HTTPForbidden(text="Unknown host")
        origin = request.headers.get("Origin")
        if origin and origin != self.origin:
            raise web.HTTPForbidden(text="Cross-origin access refused")
        response = await handler(request)
        response.headers.update({"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
                                 "Referrer-Policy": "no-referrer", "X-Frame-Options": "SAMEORIGIN"})
        return response

    async def page(self, request):
        name = "host.html" if request.path == "/" else "controller.html"
        return web.FileResponse(HERE / "static" / name)

    async def create(self, request):
        if not self.authorized(request):
            raise web.HTTPUnauthorized()
        await self.close_session()
        self.session = Session()
        s = self.session
        return web.json_response({"id": s.id, "pin": s.pin, "expiresIn": 120,
            "controllerUrl": self.origin + "/controller",
            "qrUrl": self.origin + "/controller#invite=" + s.invitation})

    async def close_session(self):
        s = self.session
        self.session = None
        if s:
            for ws in (s.host, s.phone):
                if ws is not None:
                    await ws.close(code=1000, message=b"Session ended")

    async def pair(self, request):
        now = time.monotonic()
        bucket = self.attempts[request.remote or "unknown"]
        for queue in (bucket, self.global_attempts):
            while queue and now - queue[0] > 60:
                queue.popleft()
        if len(bucket) >= 8 or len(self.global_attempts) >= 24:
            raise web.HTTPTooManyRequests(text="Wait a minute before trying another code.")
        bucket.append(now)
        self.global_attempts.append(now)
        try:
            data = await request.json()
            s = self.session
            if not s or not isinstance(data, dict):
                raise ValueError("No pairing session")
            invite, pin = data.get("invite", ""), data.get("pin", "")
            valid = (isinstance(invite, str) and bool(invite) and secrets.compare_digest(invite, s.invitation)) or (
                isinstance(pin, str) and bool(pin) and secrets.compare_digest(pin, s.pin))
            if not valid:
                raise ValueError("Invalid or expired pairing code")
            token = s.pair()
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            raise web.HTTPBadRequest(text=str(exc))
        return web.json_response({"id": s.id, "token": token, "expiresIn": 1800})

    async def qr(self, request):
        if not self.authorized(request) or not self.session:
            raise web.HTTPUnauthorized()
        s = self.session
        if not s.invitation or time.monotonic() > s.expires:
            raise web.HTTPGone()
        image = qrcode.make(self.origin + "/controller#invite=" + s.invitation)
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return web.Response(body=buffer.getvalue(), content_type="image/png")

    async def websocket(self, request):
        ws = web.WebSocketResponse(heartbeat=5, max_msg_size=4096, receive_timeout=10)
        await ws.prepare(request)
        session, role = None, None
        try:
            first = await asyncio.wait_for(ws.receive_json(), timeout=5)
            s = self.session
            if not s or first.get("id") != s.id:
                raise ValueError("Unknown session")
            role = first.get("role")
            token = first.get("token", "")
            if not isinstance(token, str):
                raise ValueError("Invalid token")
            if role == "host":
                valid = secrets.compare_digest(token, self.admin)
            elif role == "phone":
                valid = bool(s.phone_token) and time.monotonic() < s.active_until and secrets.compare_digest(token, s.phone_token)
            else:
                valid = False
            if not valid or getattr(s, role) is not None:
                raise ValueError("Unauthorized or already connected")
            session = s
            setattr(s, role, ws)
            await ws.send_json({"type": "ready"})
            async for message in ws:
                if self.session is not s or (role == "phone" and time.monotonic() >= s.active_until):
                    break
                if message.type == WSMsgType.TEXT:
                    data = json.loads(message.data)
                    if role == "phone":
                        if isinstance(data, dict) and data.get("type") == "text":
                            if not self.native_running():
                                s.text_input(data)
                        else:
                            s.input(data)
                    elif isinstance(data, dict) and type(data.get("ack")) is int and not self.native_running():
                        while s.events and s.events[0]["id"] <= data["ack"]:
                            s.events.popleft()
                elif message.type == WSMsgType.ERROR:
                    break
        except (ValueError, TypeError, KeyError, AttributeError, asyncio.TimeoutError):
            await ws.close(code=1008, message=b"Invalid or expired session")
        finally:
            if session is not None and getattr(session, role, None) is ws:
                setattr(session, role, None)
                if role == "host":
                    # A departed host revokes the phone capability as well.
                    session.active_until = 0
                    if session.phone is not None:
                        await session.phone.close()
                session.state = dict(ZERO)
                session.events.clear()
        return ws

    async def cafe(self, request):
        index = (HERE / "nlc-build004.html").read_text()
        # This local adapter adds one input source; all original controls stay intact.
        index = index.replace("function nlcReadControls(dt){", "function nlcReadControls(dt){\n    const remote=window.OneAGEPhone?.sample() || {move:[0,0],look:[0,0],buttons:{}};\n    const taps=window.OneAGEPhone?.consume() || [];\n    if(taps.includes('Menu'))nlcMenuButton.click();\n    if(taps.includes('B')&&panelOpen)document.getElementById('close').click();\n    if(taps.some(k=>k==='A'||k==='X')&&!panelOpen)nlcInteractNow();")
        index = index.replace("let mx=nlcPad.move.x;", "let mx=nlcPad.move.x+remote.move[0];")
        index = index.replace("let my=nlcPad.move.y;", "let my=nlcPad.move.y+remote.move[1];")
        index = index.replace("let lx=nlcPad.look.x;", "let lx=nlcPad.look.x+remote.look[0];")
        index = index.replace("let ly=nlcPad.look.y;", "let ly=nlcPad.look.y+remote.look[1];")
        index = index.replace("let sprint=!!nlcPad.buttons.B;", "let sprint=!!nlcPad.buttons.B||!!remote.buttons.B;")
        index = index.replace("</head>", '<script src="/static/receiver.js"></script></head>')
        index = index.replace("const statusText=pad", "const statusText=window.OneAGEPhone?.connected() ? '📱 Phone connected' : pad")
        # The thin desktop lies below eye height. Add a transparent interaction
        # volume around the Beat Machine without changing the visible workstation.
        index = index.replace("// Equipment labels", """// Local Build 005: reachable Beat Machine interaction volume.
const beatInteractionMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
target(box(4.5,1.65,-2.2,2.3,1.2,1.3,beatInteractionMaterial),
       'Beat Machine','Open the touchscreen beat workstation.','studio');
// Equipment labels""")
        index = index.replace("return hits.length && hits[0].distance<6\n        ? hits[0].object.userData : null;", """if(!hits.length||hits[0].distance>=6)return null;
    const hit=hits[0];
    if(camera.position.x*hit.point.x<0){
        const zAtWall=camera.position.z+(hit.point.z-camera.position.z)*(-camera.position.x)/(hit.point.x-camera.position.x);
        if(!nlcDoorOpen||Math.abs(zAtWall)>1.05)return null;
    }
    return hit.object.userData;""")
        index = index.replace("label:t.action==='studio'?'🎹 MAKE BEATS':", "label:t.name==='Beat Machine'?'🎹 USE BEAT MACHINE':t.action==='studio'?'🎹 MAKE BEATS':")
        return web.Response(text=index, content_type="text/html")

    async def tick(self, app):
        async def loop():
            while True:
                s = self.session
                if s and s.host is not None and not s.host.closed:
                    try:
                        payload = s.sample()
                        if self.native_running():
                            payload = {**payload, "state": ZERO, "events": [], "connected": False, "native": True}
                        await asyncio.wait_for(s.host.send_json(payload), .2)
                    except (ConnectionError, RuntimeError, asyncio.TimeoutError):
                        await s.host.close()
                await asyncio.sleep(1 / 30)
        task = asyncio.create_task(loop())
        yield
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
        await self.close_session()
        if self.native_log:
            self.native_log.close()

    def app(self):
        app = web.Application(middlewares=[self.guard], client_max_size=4096)
        app.router.add_get("/", self.page)
        app.router.add_get("/controller", self.page)
        app.router.add_post("/api/session", self.create)
        app.router.add_post("/api/pair", self.pair)
        app.router.add_get("/api/qr", self.qr)
        app.router.add_post("/api/native/open", self.native_open)
        app.router.add_get("/api/native/state", self.native_state)
        app.router.add_get("/ws", self.websocket)
        app.router.add_get("/cafe/", self.cafe)
        app.router.add_static("/static", HERE / "static")
        # The pinned snapshot supplies Three.js and the existing studio pages.
        for folder in ("vendor", "studio-007", "studio-008"):
            path = self.nlc_root / folder
            if path.is_dir():
                app.router.add_static("/" + folder, path, show_index=False)
        vendor = self.nlc_root / "vendor"
        if vendor.is_dir():
            app.router.add_static("/cafe/vendor", vendor, show_index=False)
        app.cleanup_ctx.append(self.tick)
        return app


def lan_ip():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        try:
            sock.connect(("192.0.2.1", 80))
            return sock.getsockname()[0]
        except OSError:
            return "127.0.0.1"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--nlc-root", type=Path, required=True)
    parser.add_argument("--port", type=int, default=18765)
    parser.add_argument("--ip", default=lan_ip())
    parser.add_argument("--public-origin", help="HTTPS origin of a separately configured reverse proxy")
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument("--native-root", type=Path, default=Path.home() / "1AGE/World/world-room-001")
    args = parser.parse_args()
    ipaddress.ip_address(args.ip)
    if not args.public_origin:
        for candidate in range(args.port, args.port + 12):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
                try:
                    probe.bind((args.ip, candidate))
                except OSError:
                    continue
                args.port = candidate
                break
        else:
            parser.error("No free controller port. Close an old controller service and try again.")
    origin = args.public_origin or f"http://{args.ip}:{args.port}"
    parsed = urllib.parse.urlsplit(origin)
    if parsed.scheme not in ("http", "https") or parsed.path not in ("", "/") or parsed.query or parsed.fragment or parsed.username:
        parser.error("Use an origin only")
    if args.public_origin and parsed.scheme != "https":
        parser.error("Internet pairing requires HTTPS")
    if not (args.nlc_root / "vendor/three.module.js").is_file():
        parser.error("Pinned NorthLeftChef vendor files not found")
    server = ControllerServer(origin, args.nlc_root, args.native_root)
    async def run():
        runner = web.AppRunner(server.app(), access_log=None)
        await runner.setup()
        try:
            site = web.TCPSite(runner, "127.0.0.1" if args.public_origin else args.ip, args.port)
            await site.start()
            print("1AGE Phone Controller — local Build 007 · Gamepad + Keyboard", flush=True)
            print("Open on this computer:", origin + "/#token=" + server.admin, flush=True)
            print("Phone and computer must share a reachable Wi-Fi network. Keep this terminal open.", flush=True)
            if not args.no_browser:
                await asyncio.to_thread(webbrowser.open, origin + "/#token=" + server.admin)
            await asyncio.Event().wait()
        finally:
            await runner.cleanup()
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        pass



if __name__ == "__main__":
    main()
