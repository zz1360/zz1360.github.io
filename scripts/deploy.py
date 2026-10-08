"""Build and normally push GitHub Pages output; keep a recovery tag before changes."""
from pathlib import Path
from datetime import datetime
import argparse, subprocess, os, tempfile, shutil, json

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--expected-base', help='Abort if main changed since the reviewed migration snapshot')
parser.add_argument('--prepare-only', action='store_true', help='Build and inspect without pushing')
parser.add_argument('--retire-legacy-blogs', action='store_true', help='Retire only the archived legacy blogs/ and posts/ output directories')
args = parser.parse_args()

def run(*argv, cwd=root, capture=False):
    result = subprocess.run(argv, cwd=cwd, check=True, text=True, stdout=subprocess.PIPE if capture else None)
    return result.stdout.strip() if capture else None

def git(*argv, cwd=root, capture=False):
    prefix = ['git']
    if 'BLOG_GIT_PROXY' in os.environ:
        prefix += ['-c', 'http.proxy='+os.environ['BLOG_GIT_PROXY']]
    return run(*prefix, *argv, cwd=cwd, capture=capture)

if git('status', '--porcelain', capture=True):
    raise SystemExit('Commit the source changes before deploying so the release can identify its source commit.')
source_commit = git('rev-parse', 'HEAD', capture=True)
run('npm', 'run', 'check')
run('npm', 'run', 'build')
dist = root/'dist'
for file in ['index.html', 'blog/index.html', 'explore/dnd/index.html', 'dnd/index.html', 'dnd/works/yinhun/index.html', 'privacy/index.html', 'support/index.html', 'CNAME', '.nojekyll']:
    if not (dist/file).is_file(): raise SystemExit('Missing release file: '+file)
if '视觉预览' in (dist/'index.html').read_text() or '排版样例' in (dist/'blog/index.html').read_text():
    raise SystemExit('Preview-only content must not enter the public site.')
(dist/'release.json').write_text(json.dumps({'site':'0101 比特酒馆','sourceCommit':source_commit,'builtAt':datetime.now().astimezone().isoformat(),'framework':'Astro'}, ensure_ascii=False, indent=2)+'\n')

with tempfile.TemporaryDirectory(prefix='bit-tavern-release-') as temporary:
    release = Path(temporary)/'site'
    git('clone', '--depth', '1', '--branch', 'main', 'https://github.com/zz1360/zz1360.github.io.git', str(release))
    baseline = git('rev-parse', 'HEAD', cwd=release, capture=True)
    if args.expected_base and baseline != args.expected_base:
        raise SystemExit('The published branch changed; refresh and verify before retrying. Current: '+baseline)
    # Unrelated app policy/support routes must survive this portal migration.
    for path in ['privacy', 'support']:
        old = {p.relative_to(release/path):p.read_bytes() for p in (release/path).rglob('*') if p.is_file()}
        new = {p.relative_to(dist/path):p.read_bytes() for p in (dist/path).rglob('*') if p.is_file()}
        if old != new: raise SystemExit('Protected route changed: '+path+'. Sync the approved version before publishing.')
    tag = 'before-tavern-'+datetime.now().strftime('%Y%m%d-%H%M%S')
    git('tag', tag, baseline, cwd=release)
    # Only previously owned generated files can be removed on later releases.
    # Keep all unrelated/unknown paths from the published repository.
    managed_path = release/'.tavern-managed.json'
    previous = json.loads(managed_path.read_text()) if managed_path.is_file() else []
    current = [str(p.relative_to(dist)) for p in dist.rglob('*') if p.is_file()]
    for item in previous:
        relative = Path(item)
        if relative.is_absolute() or '..' in relative.parts or '.git' in relative.parts:
            raise SystemExit('Unsafe managed path: '+item)
        if item not in current and (release/relative).is_file():
            (release/relative).unlink()
    if args.retire_legacy_blogs:
        if not args.expected_base:
            raise SystemExit('Retiring the legacy blog requires a verified --expected-base snapshot.')
        for name in ['blogs', 'posts']:
            legacy = release/name
            if legacy.is_dir(): shutil.rmtree(legacy)
    shutil.copytree(dist, release, dirs_exist_ok=True)
    managed_path.write_text(json.dumps(sorted(current), indent=2)+'\n')
    git('add', '-A', cwd=release)
    git('commit', '-m', 'Publish 0101 Bit Tavern from '+source_commit[:12], cwd=release)
    commit = git('rev-parse', 'HEAD', cwd=release, capture=True)
    print(json.dumps({'publishedCommit':commit,'previousCommit':baseline,'recoveryTag':tag,'sourceCommit':source_commit,'prepareOnly':args.prepare_only}, ensure_ascii=False), flush=True)
    if not args.prepare_only:
        git('push', 'origin', 'refs/tags/'+tag, cwd=release)
        git('push', 'origin', 'HEAD:main', cwd=release)
        (root/'verification/last-release.json').write_text(json.dumps({'publishedCommit':commit,'previousCommit':baseline,'recoveryTag':tag,'sourceCommit':source_commit}, indent=2)+'\n')
        print('Published: https://blog.luckydogs.top/')
