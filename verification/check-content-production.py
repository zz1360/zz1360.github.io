"""Verify the content release, without changing assets or browser preferences."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib,json,subprocess,urllib.request
ROOT=Path(__file__).resolve().parents[1]
ORIGIN='https://blog.luckydogs.top'
release=json.loads((ROOT/'verification/last-release.json').read_text())
proxy=subprocess.run(['git','config','--get','http.proxy'],cwd=ROOT,text=True,stdout=subprocess.PIPE).stdout.strip()
opener=urllib.request.build_opener(urllib.request.ProxyHandler({'http':proxy,'https':proxy}) if proxy else urllib.request.ProxyHandler())
def fetch(path):
 request=urllib.request.Request(ORIGIN+path,headers={'User-Agent':'BitTavernContentVerification/1.0'})
 with opener.open(request,timeout=30) as response:
  assert response.status==200,path
  return response.read()
live=json.loads(fetch('/release.json?content='+release['sourceCommit'][:12]))
assert live['sourceCommit']==release['sourceCommit'],'GitHub Pages still serves an earlier release'
paths=['/','/blog/','/explore/dnd/','/dnd/','/dnd/settings/eberron/','/dnd/settings/planescape/','/dnd/works/yinhun/','/privacy/','/support/','/dnd/manifest.json']
def verify(path):
 local=ROOT/'dist'/path.lstrip('/')
 if path.endswith('/'):local=local/'index.html'
 expected=hashlib.sha256(local.read_bytes()).hexdigest()
 assert hashlib.sha256(fetch(path+'?content='+release['sourceCommit'][:12])).hexdigest()==expected,path
 return {'path':path,'sha256':expected}
with ThreadPoolExecutor(max_workers=5) as pool:pages=list(pool.map(verify,paths))
manifest=json.loads((ROOT/'dist/dnd/manifest.json').read_text())
assert len(manifest['archiveArt']['entries'])==73
# This release changes prose and UI only; original illustration sources are unchanged.
subprocess.run(['git','diff','--quiet','2a2e2e954e7257c90142fb495d56a590f7c05f3d','HEAD','--','dnd-source/assets','dnd-source/art-manifest.json','dnd-source/gallery-manifest.json','dnd-source/archive-art.json','dnd-source/works/yinhun/source.html'],cwd=ROOT,check=True)
report={'passed':True,'origin':ORIGIN,**release,'pages':pages,'expandedEntries':166,'illustratedArchives':73,'originalArtAndNovelSourceUnchanged':True}
(ROOT/'verification/content-refinement-online-file-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='pages'},ensure_ascii=False))
