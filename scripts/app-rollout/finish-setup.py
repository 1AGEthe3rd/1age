#!/usr/bin/env python3
"""Install the reviewed World preview and optionally prepare the website PR branch."""
from pathlib import Path
import argparse,os,subprocess,sys
HERE=Path(__file__).resolve().parent
WORLD_SHA='4fbede9072fe4b4eac2ea1f7855f31269327ea01'
REMOTE='https://github.com/1AGEthe3rd/1age-world.git'
GENERATED={'data/sol_road_properties.'+name+'.translation' for name in ['business','category','notes','street','verification']}
def git(root,*args):return subprocess.run(['git','-C',str(root),*args],check=True,capture_output=True,text=True).stdout.strip()
def validate(command,cwd):
    result=subprocess.run(command,cwd=cwd,capture_output=True,text=True,timeout=90)
    output=result.stdout+result.stderr
    if result.returncode or 'SCRIPT ERROR' in output or '\nERROR:' in output:
        print(output);raise RuntimeError('Validation failed; no link-handler change was made.')
    print(output[-1200:].strip(),flush=True)
def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish-web',action='store_true',help='Push the reviewed website feature branch after native checks; never merge')
    parser.add_argument('--usb',action='store_true',help='Also prepare a new copy on the single mounted jump drive')
    args=parser.parse_args();home=Path.home();target=home/'1AGE/World/world-domes-preview'
    binary=home/'1AGE/Tools/Godot/Godot_v4.7.2-stable_linux.x86_64'
    if not binary.is_file() or not os.access(binary,os.X_OK):raise RuntimeError('Run this first on the Chuwi where Godot 4.7.2 is already installed. No engine download was started.')
    if not target.exists():
        target.parent.mkdir(parents=True,exist_ok=True)
        candidates=[home/'1AGE/World'/name for name in ['world-orbital-test','world-room-001','1age-world']]
        source=next((p for p in candidates if (p/'.git').exists() and git(p,'remote','get-url','origin').removesuffix('.git') in [REMOTE.removesuffix('.git'),'git@github.com:1AGEthe3rd/1age-world']),None)
        if source:
            print('Fetching the reviewed branch; existing source files remain untouched.',flush=True)
            git(source,'fetch','origin',WORLD_SHA)
            git(source,'worktree','add','-b','dev/world-domes-preview',str(target),WORLD_SHA)
        else:
            subprocess.run(['git','clone',REMOTE,str(target)],check=True)
            git(target,'fetch','origin',WORLD_SHA)
            git(target,'switch','-c','dev/world-domes-preview',WORLD_SHA)
    if git(target,'remote','get-url','origin').removesuffix('.git') not in [REMOTE.removesuffix('.git'),'git@github.com:1AGEthe3rd/1age-world']:
        raise RuntimeError('Unexpected origin in the preview folder; preserved without changes.')
    if git(target,'rev-parse','HEAD')!=WORLD_SHA:raise RuntimeError('Preview folder contains another revision; preserved. Send the output to update safely.')
    if set(git(target,'diff','HEAD','--name-only').splitlines())-GENERATED:
        raise RuntimeError('Preview source has local edits; preserved. No overwrite or reset performed.')
    print('Importing the reviewed World project…',flush=True)
    validate([str(binary),'--headless','--editor','--path',str(target),'--import','--quit'],target)
    validate([sys.executable,'-m','unittest','discover','-s','launcher','-p','test_*.py'],target)
    validate([str(binary),'--headless','--path',str(target),'--script','res://orbital/smoke_test.gd'],target)
    for destination in ['world','games','page','space','exchange','quest','cash','design']:
        validate([str(binary),'--headless','--path',str(target),'--script','res://launcher/entry_smoke_test.gd','--','--destination='+destination],target)
    subprocess.run([sys.executable,str(target/'launcher/install_links.py'),'--project',str(target),'--godot',str(binary)],check=True)
    print('\nWorld runtime is ready. Open 1AGE World from the application menu or use the homepage Enter link.',flush=True)
    print('Development checkout:',target,flush=True)
    if args.usb:subprocess.run([sys.executable,str(target/'launcher/usb_transfer.py'),'prepare'],check=True)
    if args.publish_web:subprocess.run([sys.executable,str(HERE/'publish-app-updates.py'),'--group','core','--push'],check=True)
    else:print('Next: python3 publish-app-updates.py --group core --push')
if __name__=='__main__':
    try:main()
    except (RuntimeError,OSError,subprocess.SubprocessError) as error:print('\nStopped safely:',error,file=sys.stderr);sys.exit(1)
