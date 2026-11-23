"""Optional real Chromium smoke test; no external destinations are opened."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import subprocess
import tempfile
from threading import Thread

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = b'''<!doctype html><link rel="stylesheet" href="/search-orbit.css"><script type="module">
import {openEntityOrbit} from '/search-orbit.mjs';
try {
const records=Array.from({length:33},(_,i)=>({id:'r'+i,name:'Resource '+i,type:i%2?'community':'documentation',official_links:{website:'https://example.com/'+i},relationships:[{target:'center',status:'source_checked',source:'https://example.com/source'}]}));
await openEntityOrbit({id:'center',name:'Fixture center',description:'Browser-only test',official_links:{website:'https://example.com'}},records);
const dialog=document.querySelector('dialog');
if(!dialog.querySelector('.orbit-status').textContent.startsWith('3D ready'))throw Error('WebGL not ready');
if(!dialog.querySelector('canvas'))throw Error('Canvas missing');
const buttons=[...dialog.querySelectorAll('button')];
const next=buttons.find(b=>b.textContent==='Next destinations');
next.click();next.click();
if(!next.disabled||dialog.querySelectorAll('.orbit-destinations button').length!==2)throw Error('Page transition failed');
const select=dialog.querySelector('select');select.value='community';select.dispatchEvent(new Event('change'));
if(dialog.querySelectorAll('.orbit-destinations button').length!==16)throw Error('Category scene failed');
if(dialog.querySelector('.orbit-selection a').href!=='https://example.com/1')throw Error('Selection mismatch');
buttons.find(b=>b.textContent==='Zoom in').click();
buttons.find(b=>b.textContent==='Rotate right').click();
buttons.find(b=>b.textContent==='Close').click();
if(document.querySelector('dialog'))throw Error('Dialog cleanup failed');
document.body.dataset.orbitTest='passed';
}catch(e){document.body.dataset.orbitTest='failed';document.body.dataset.error=e.message;}
</script>'''


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        if self.path == '/__orbit-fixture.html':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(FIXTURE)
        else:
            super().do_GET()


if __name__ == '__main__':
    browser = shutil.which('chromium')
    if not browser:
        raise SystemExit('Chromium missing; browser smoke test not run.')
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with tempfile.TemporaryDirectory() as profile:
            result = subprocess.run([browser, '--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--user-data-dir='+profile, '--dump-dom', '--virtual-time-budget=6000', f'http://127.0.0.1:{server.server_port}/__orbit-fixture.html'], capture_output=True, text=True, timeout=35)
            if result.returncode or 'data-orbit-test="passed"' not in result.stdout:
                print(result.stdout[-2500:])
                print(result.stderr[-1200:])
                raise SystemExit('Real Chromium orbit smoke test failed.')
            print('Chromium software-WebGL passed: scene creation, paging, filter, selection, camera controls and cleanup.')
    finally:
        server.shutdown()
        server.server_close()
        thread.join()
