"""Compare the released archive pages and every illustration size with dist."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib,json,subprocess,time,urllib.request

ROOT=Path(__file__).resolve().parents[1]
ORIGIN='https://blog.luckydogs.top'
release=json.loads((ROOT/'verification/last-release.json').read_text())
proxy=subprocess.run(['git','config','--get','http.proxy'],cwd=ROOT,text=True,stdout=subprocess.PIPE).stdout.strip()
opener=urllib.request.build_opener(urllib.request.ProxyHandler({'http':proxy,'https':proxy}) if proxy else urllib.request.ProxyHandler())
def fetch(path):
    request=urllib.request.Request(ORIGIN+path,headers={'User-Agent':'BitTavernArchiveVerification/1.0'})
    for attempt in range(3):
        try:
            with opener.open(request,timeout=30) as response:
                assert response.status==200,path
                return response.read()
        except Exception:
            if attempt==2:raise
            time.sleep(1+attempt)

live_release=json.loads(fetch('/release.json?archive-check='+release['sourceCommit'][:12]))
assert live_release['sourceCommit']==release['sourceCommit'],'Pages is still serving an earlier release'
manifest=json.loads((ROOT/'dist/dnd/manifest.json').read_text())
paths=['/','/blog/','/explore/dnd/','/dnd/','/dnd/settings/eberron/','/dnd/settings/planescape/',
       '/dnd/works/yinhun/','/privacy/','/support/','/dnd/manifest.json']
def check_page(path):
    file=ROOT/'dist'/path.lstrip('/')
    if path.endswith('/'):file=file/'index.html'
    expected=hashlib.sha256(file.read_bytes()).hexdigest()
    assert hashlib.sha256(fetch(path+'?archive-check='+release['sourceCommit'][:12])).hexdigest()==expected,path
    return dict(path=path,sha256=expected)
with ThreadPoolExecutor(max_workers=6) as pool:pages=list(pool.map(check_page,paths))
assets={v['url']:v for entry in manifest['archiveArt']['entries'] for v in entry['variants']}
def check_asset(item):
    path,expected=item;blob=fetch(path)
    assert hashlib.sha256(blob).hexdigest()==expected['sha256'],path
    assert len(blob)==expected['bytes'],path
    return len(blob)
with ThreadPoolExecutor(max_workers=8) as pool:total=sum(pool.map(check_asset,assets.items()))
report=dict(passed=True,origin=ORIGIN,sourceCommit=release['sourceCommit'],publishedCommit=release['publishedCommit'],
            newIllustrations=manifest['archiveArt']['newIllustrations'],entityArchives=len(manifest['archiveArt']['entries']),
            coverage=manifest['archiveArt']['coverage'],pages=pages,uniqueIllustrationFiles=len(assets),verifiedBytes=total)
(ROOT/'verification/archive-art-online-file-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='pages'},ensure_ascii=False))
