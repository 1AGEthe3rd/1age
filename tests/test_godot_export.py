import importlib.util
import json
from pathlib import Path
import struct
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("validator", Path(__file__).parents[1] / "scripts/validate-godot-export.py")
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class ExportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.files = {"index.wasm": b"\x00asm\x01\x00\x00\x00", "index.pck": b"GDPC" + struct.pack("<4I", 4, 4, 7, 2), "index.js": b"// engine"}
        for name, data in self.files.items():
            (self.root / name).write_bytes(data)
        self.config = {"executable": "index", "fileSizes": {name: len(data) for name, data in self.files.items() if not name.endswith(".js")}}
        self.html()

    def html(self, suffix=""):
        (self.root / "index.html").write_text("const GODOT_CONFIG = " + json.dumps(self.config) + ";\n" + suffix)

    def test_valid(self):
        self.assertTrue(validator.validate(self.root)["valid"])

    def test_missing_asset(self):
        (self.root / "index.js").unlink()
        self.assertIn("Missing asset: index.js", validator.validate(self.root)["errors"])

    def test_incomplete_package(self):
        (self.root / "index.pck").write_bytes(b"GDPC")
        self.assertFalse(validator.validate(self.root)["valid"])

    def test_lfs_pointer(self):
        (self.root / "index.pck").write_text("version https://git-lfs.github.com/spec/v1\n")
        self.assertTrue(any("LFS pointer" in e for e in validator.validate(self.root)["errors"]))

    def test_wrong_wasm(self):
        (self.root / "index.wasm").write_bytes(b"not wasm")
        self.assertTrue(any("WebAssembly" in e for e in validator.validate(self.root)["errors"]))

    def test_declared_size_mismatch(self):
        self.config["fileSizes"]["index.pck"] += 1
        self.html()
        self.assertTrue(any("Size mismatch" in e for e in validator.validate(self.root)["errors"]))

    def test_pages_limit(self):
        old_limit = validator.PAGES_LIMIT
        try:
            validator.PAGES_LIMIT = 10
            self.assertTrue(validator.validate(self.root)["valid"])
            self.assertFalse(validator.validate(self.root, "pages")["valid"])
        finally:
            validator.PAGES_LIMIT = old_limit

    def test_missing_html_reference(self):
        self.html('<script src="missing.js"></script>')
        self.assertFalse(validator.validate(self.root)["valid"])

    def test_runtime_audio_dependency(self):
        (self.root / "index.js").write_text('locate_file("godot.audio.worklet.js")')
        self.assertIn("Missing asset: index.audio.worklet.js", validator.validate(self.root)["errors"])

    def test_path_escape(self):
        self.html('<script src="../outside.js"></script>')
        self.assertTrue(any("escapes" in e for e in validator.validate(self.root)["errors"]))


if __name__ == "__main__":
    unittest.main()
