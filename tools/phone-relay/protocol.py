"""Shared input protocol from the verified local 1AGE controller."""
import math,secrets,time
from collections import deque
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
