"""Match the published research release against the tested local build."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib,json,subprocess,urllib.request
ROOT=Path(__file__).resolve().parents[1];ORIGIN='https://blog.luckydogs.top'
release=json.loads((ROOT/'verification/last-release.json').read_text())
proxy=subprocess.run(['git','config','--get','http.proxy'],cwd=ROOT,text=True,stdout=subprocess.PIPE).stdout.strip()
opener=urllib.request.build_opener(urllib.request.ProxyHandler({'http':proxy,'https':proxy}) if proxy else urllib.request.ProxyHandler())
def fetch(path):
 request=urllib.request.Request(ORIGIN+path,headers={'User-Agent':'BitTavernResearchVerification/1.0'})
 with opener.open(request,timeout=30) as response:
  assert response.status==200,path
  return response.read()
assert json.loads(fetch('/release.json?research='+release['sourceCommit'][:12]))['sourceCommit']==release['sourceCommit'],'GitHub Pages still serves an earlier release'
paths=['/','/blog/','/dnd/','/dnd/settings/eberron/','/dnd/settings/planescape/','/dnd/works/yinhun/','/dnd/works/yinhun/manifest.json','/privacy/','/support/']
def check(path):
 file=ROOT/'dist'/path.lstrip('/')
 if path.endswith('/'):file=file/'index.html'
 expected=hashlib.sha256(file.read_bytes()).hexdigest()
 assert hashlib.sha256(fetch(path+'?research='+release['sourceCommit'][:12])).hexdigest()==expected,path
 return {'path':path,'sha256':expected}
with ThreadPoolExecutor(max_workers=5) as pool:pages=list(pool.map(check,paths))
manifest=json.loads((ROOT/'dist/dnd/works/yinhun/manifest.json').read_text())
research=json.loads((ROOT/'dnd-source/works/yinhun/research/index.json').read_text())
assert manifest['research']['source_sha256']==research['sourceSha256']
assert manifest['research']['sections']==10 and manifest['research']['verified_srd_notes']==8
subprocess.run(['git','diff','--quiet','96557c9f20ddb6be3e89bd9060a5165985ec7c58','HEAD','--','dnd-source/works/yinhun/source.html','dnd-source/assets'],cwd=ROOT,check=True)
report={'passed':True,'origin':ORIGIN,**release,'research':manifest['research'],'novelSourceUnchanged':True,'illustrationFilesUnchanged':True,'pages':pages}
(ROOT/'verification/yinhun-research-online-file-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='pages'},ensure_ascii=False))
