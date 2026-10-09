"""Export embedded art into immutable WebP assets and responsive display sizes."""
from pathlib import Path
from html.parser import HTMLParser
import base64,hashlib,json,re,shutil,subprocess,tempfile

class PlateParser(HTMLParser):
    def __init__(self):super().__init__();self.plates=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='img' and 'entry-art' in attrs.get('class','').split():
            self.plates.append(dict(id=attrs['id'][4:],src=attrs['src']))

def export(source,output):
    offline_source_sha256=hashlib.sha256(source.encode()).hexdigest()
    from works import prepare_online_works
    source,works=prepare_online_works(source,output,Path(__file__).resolve().parent)
    output=Path(output);plates=PlateParser();plates.feed(source)
    gallery=json.loads(re.search(r'<script id="art-gallery-data" type="application/json">(.*?)</script>',source,re.S)[1])
    data=json.loads(re.search(r'<script id="codex-data" type="application/json">(.*?)</script>',source,re.S)[1])
    entries={x['id']:x for k in ['worlds','planes','history','people','locations','factions','terms'] for x in data[k]}
    uris=set(p['src'] for p in plates.plates)|set(x['src'] for a in gallery.values() for x in a)
    if not uris or any(not uri.startswith('data:image/webp;base64,') for uri in uris):raise ValueError('Expected embedded WebP artwork')
    encoder=shutil.which('cwebp') or ('/opt/homebrew/bin/cwebp' if Path('/opt/homebrew/bin/cwebp').exists() else None)
    if not encoder:raise RuntimeError('需要 cwebp（macOS: brew install webp），未生成网页。')
    assets=output/'assets';assets.mkdir(parents=True,exist_ok=True);images={};all_files=set()
    for uri in sorted(uris):
        blob=base64.b64decode(uri.split(',',1)[1],validate=True)
        if blob[:4]!=b'RIFF' or blob[8:12]!=b'WEBP':raise ValueError('Expected WebP')
        digest=hashlib.sha256(blob).hexdigest();file='art-'+digest[:20]+'.webp'
        if not (assets/file).exists():(assets/file).write_bytes(blob)
        info=dict(url='/dnd/assets/'+file,sha256=digest,width=1536,variants=[]);all_files.add(file)
        for width in [320,640,960]:
            variant='art-'+digest[:20]+f'-w{width}-q82-v1.webp';path=assets/variant
            if not path.exists():
                subprocess.run([encoder,'-quiet','-q','82','-resize',str(width),'0',str(assets/file),'-o',str(path)],check=True)
            info['variants'].append(dict(width=width,url='/dnd/assets/'+variant,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bytes=path.stat().st_size))
            all_files.add(variant)
        info['thumb']=info['variants'][0]['url'];info['card']=info['variants'][1]['url']
        info['srcset']=', '.join(f'{v["url"]} {v["width"]}w' for v in info['variants'][1:])+f', {info["url"]} 1536w'
        images[uri]=info
    page=re.sub(r'data:image/webp;base64,[A-Za-z0-9+/=]+',lambda m:images[m[0]]['url'],source)
    for p in plates.plates:
        im=images[p['src']]
        before=f'<img id="art-{p["id"]}" class="entry-art" src="{im["url"]}"'
        after=f'<img id="art-{p["id"]}" class="entry-art" src="{im["card"]}" data-full="{im["url"]}" data-thumb="{im["thumb"]}" data-srcset="{im["srcset"]}" srcset="{im["srcset"]}" sizes="(max-width:620px) 90vw, (max-width:1100px) 45vw, 400px"'
        assert before in page,p['id'];page=page.replace(before,after,1)
    online_gallery={id:[dict(x,src=images[x['src']]['url'],thumb=images[x['src']]['thumb'],srcset=images[x['src']]['srcset']) for x in a] for id,a in gallery.items()}
    page=re.sub(r'(<script id="art-gallery-data" type="application/json">).*?(</script>)',lambda m:m[1]+json.dumps(online_gallery,ensure_ascii=False).replace('</','<\\/')+m[2],page,flags=re.S)
    page=page.replace('<head>','<head><link rel="canonical" href="https://blog.luckydogs.top/dnd/">',1)
    marker='<nav class="nav" aria-label="百科章节">';assert page.count(marker)==1
    page=page.replace(marker,marker+'<a href="/" aria-label="返回比特酒馆"><span>↩</span>返回酒馆</a>',1)
    page=page.replace('正文、样式、内容索引、插图和 Three.js 均嵌入本文件','正文、样式、内容索引和 Three.js 内置于页面；插图采用独立 WebP 文件与响应式尺寸')
    page=page.replace('可离线阅读 / 来源联网打开','博客在线版 / 来源联网打开').replace('可离线阅读，','在线阅读，').replace('无需联网加载字体或脚本。','无需联网加载字体或第三方脚本。').replace('离线插图版</span>','博客探索版</span>')
    manifest=dict(url='https://blog.luckydogs.top/dnd/',works=works,source_sha256=offline_source_sha256,originals=[],galleries={},image_count=len(images),responsive_sizes=[320,640,960],generated_files=sorted(all_files))
    def asset_record(uri):return {k:v for k,v in images[uri].items() if k not in ['srcset','card','thumb']}
    for p in plates.plates:manifest['originals'].append(dict(id=p['id'],name=entries[p['id']]['name'],**asset_record(p['src'])))
    for id,a in gallery.items():manifest['galleries'][id]=[dict(title=x['title'],**asset_record(x['src'])) for x in a]
    # Remove only assets belonging to a previous export, never unrelated files.
    old=output/'manifest.json'
    if old.exists():
        previous=json.loads(old.read_text()).get('generated_files',[])
        for name in set(previous)-all_files:
            if re.fullmatch(r'art-[a-f0-9]{20}(?:-w\d+-q82-v1)?\.webp',name):(assets/name).unlink(missing_ok=True)
    from stage import adapt
    page,manifest['layout']=adapt(page,Path(__file__).resolve().parent,output)
    (output/'index.html').write_text(page)
    old.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(dict(output=str(output),html_bytes=len(page.encode()),images=len(images),responsive_files=len(all_files)-len(images)),ensure_ascii=False))
