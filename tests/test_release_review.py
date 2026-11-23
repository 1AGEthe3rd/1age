import importlib.util,tempfile,json,hashlib,unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('release_review',ROOT/'scripts/prepare-release-review.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class ReleaseReviewTests(unittest.TestCase):
 def test_invalid_kit_never_reaches_git(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);(root/'release.json').write_text(json.dumps({'sha256':{'missing.bundle':'not-a-hash'},'repositories':[]}))
   with patch.object(module.subprocess,'run') as git:
    with self.assertRaises(ValueError):module.prepare(root,root/'out')
    git.assert_not_called()
 def test_path_escape_is_rejected_before_git(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);kit=root/'kit';kit.mkdir();(root/'outside').write_text('fixture');(kit/'release.json').write_text(json.dumps({'sha256':{'../outside':hashlib.sha256(b'fixture').hexdigest()},'repositories':[]}))
   with patch.object(module.subprocess,'run') as git:
    with self.assertRaises(ValueError):module.prepare(kit,root/'out')
    git.assert_not_called()
 def test_actual_git_review_push_preserves_both_main_branches(self):
  import os,subprocess
  def run(*args):return subprocess.check_output(['git',*map(str,args)],text=True,stderr=subprocess.DEVNULL).strip()
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);kit=root/'kit';kit.mkdir();remotes=root/'remotes';remotes.mkdir();entries=[];checksums={};baselines={}
   for repo in ['1age','1age-space']:
    work=root/(repo+'-fixture');run('init','-b','main',work);run('-C',work,'config','user.name','Release fixture');run('-C',work,'config','user.email','fixture@example.invalid')
    (work/'keep.txt').write_text('original');run('-C',work,'add','.');run('-C',work,'commit','-m','Baseline');baselines[repo]=run('-C',work,'rev-parse','HEAD')
    run('clone','--bare',work,remotes/(repo+'.git'));run('-C',work,'switch','-c','feature/fixture');(work/'new.txt').write_text('candidate');run('-C',work,'add','.');run('-C',work,'commit','-m','Candidate')
    bundle=kit/(repo+'.bundle');run('-C',work,'bundle','create',bundle,'feature/fixture');head=run('-C',work,'rev-parse','HEAD')
    checksums[bundle.name]=hashlib.sha256(bundle.read_bytes()).hexdigest();entries.append({'repository':repo,'reviewBranch':'review/release-030','sourceRef':'refs/heads/feature/fixture','bundle':bundle.name,'head':head})
   (kit/'release.json').write_text(json.dumps({'repositories':entries,'sha256':checksums}))
   # Redirect only this test's GitHub-shaped origins to disposable local bare repos.
   env={'GIT_CONFIG_COUNT':'1','GIT_CONFIG_KEY_0':'url.'+remotes.as_uri()+'/.insteadOf','GIT_CONFIG_VALUE_0':'https://github.com/1AGEthe3rd/'}
   with patch.dict(os.environ,env):result=module.prepare(kit,root/'prepared',push=True)
   self.assertTrue(all(r['pushed'] for r in result))
   for entry in entries:
    bare=remotes/(entry['repository']+'.git');self.assertEqual(run('-C',bare,'rev-parse','main'),baselines[entry['repository']]);self.assertEqual(run('-C',bare,'rev-parse',entry['reviewBranch']),entry['head'])
