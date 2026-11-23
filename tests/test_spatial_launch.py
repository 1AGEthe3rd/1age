import importlib.util,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('virtual_apps',ROOT/'scripts/build-virtual-apps.py');builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
class SpatialLaunchTests(unittest.TestCase):
 def test_foundation_exports_do_not_ship_a_workspace_as_their_entry_page(self):
  with tempfile.TemporaryDirectory() as tmp:
   out=Path(tmp)/'apps';builder.build(out)
   for slug in ['quest','design','shop','app']:
    html=(out/('1age-'+slug)/'index.html').read_text()
    self.assertIn('data-app="'+slug+'"',html);self.assertIn('virtual-entry.mjs',html)
    for legacy in ['suite.js','app-home.js','Create objectives','id="workspace"','<form','<main']:
     self.assertNotIn(legacy,html,slug)
