"""Catalogue and export self-contained work guides without merging their lore into the codex."""
from pathlib import Path
from html.parser import HTMLParser
import base64,hashlib,html,json,re,shutil,subprocess
import reader

PUBLIC_ROOT='https://blog.luckydogs.top/dnd/'

def embedded_json(page,id):
    match=re.search(r'<script\b(?=[^>]*\bid="'+re.escape(id)+r'")[^>]*>(.*?)</script>',page,re.S)
    if not match:raise ValueError('作品 HTML 缺少 '+id)
    return json.loads(match[1])

def json_script(page,id,value):
    pattern=r'(<script\b(?=[^>]*\bid="'+re.escape(id)+r'")[^>]*>).*?(</script>)'
    text=json.dumps(value,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
    return re.sub(pattern,lambda m:m[1]+text+m[2],page,count=1,flags=re.S)

class WorkImages(HTMLParser):
    def __init__(self):super().__init__();self.plates=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='img' and attrs.get('src','').startswith('data:image/webp;base64,'):
            self.plates.append(attrs)

def registered_works(root):
    file=root/'works.json'
    if not file.exists():return []
    records=json.loads(file.read_text());result=[]
    for record in records:
        assert re.fullmatch('[a-z0-9]+(?:-[a-z0-9]+)*',record['id'])
        path=Path(record['source']);assert not path.is_absolute() and '..' not in path.parts
        page=(root/path).read_text();data=embedded_json(page,'atlas-data');plates=WorkImages();plates.feed(page)
        assert plates.plates,'作品没有内嵌插图'
        entry=dict(record,author=data['meta']['author'],scope=data['meta']['scope'],stats={'volumes':len(data['volumes']),'events':len(data['events']),'characters':len(data['characters'])},cover=plates.plates[0]['src'],cover_alt=plates.plates[0].get('alt',record['title']+' · 概念插画'),url=PUBLIC_ROOT+'works/'+record['id']+'/')
        result.append(entry)
    assert len({x['id'] for x in result})==len(result)
    return result

def catalogue(page,root):
    works=registered_works(root);e=lambda x:html.escape(str(x),quote=True)
    cards=[]
    for x in works:
        stats=x['stats']
        cards.append(f'''<article class="work-card" data-work="{e(x['id'])}"><a href="{e(x['url'])}" class="work-cover-link" aria-label="打开《{e(x['title'])}》剧情与世界图谱"><img class="work-cover" data-work-cover="{e(x['id'])}" src="{x['cover']}" alt="{e(x['cover_alt'])}" width="800" height="1200" loading="lazy" decoding="async"><span>作品图谱 ↗</span></a><div class="work-copy"><span class="eyebrow">NOVEL ATLAS / {e(x['category'])}</span><h3>《{e(x['title'])}》</h3><p class="work-tagline">{e(x['tagline'])}</p><p class="work-author">作者：{e(x['author'])}</p><p>{e(x['description'])}</p><div class="work-stats"><span><b>{stats['volumes']}</b> 卷纲</span><span><b>{stats['events']}</b> 重大事件</span><span><b>{stats['characters']}</b> 人物档案</span></div><p class="work-scope"><strong>收录范围</strong>{e(x['scope'])}</p><div class="work-actions"><a class="primary" href="{e(x['url'])}">打开作品图谱 ↗</a><a class="plain" href="{e(x['url'])}#volumes">从卷纲开始</a><a class="plain" href="{e(x['url'])}#characters">人物与画廊</a></div><p class="small-copy work-reading-note">{e(x['reading_note'])}</p></div></article>''')
    section='''<section class="chapter" id="works"><header class="section-head"><span class="eyebrow">08 / STORIES BEYOND THE CODEX</span><h2>衍生作品</h2><p class="sub">沿着作品走进世界。这里收录独立的剧情与人物导览，每部作品保留自己的阅读范围、章节依据与设定边界。</p></header><div class="works-grid">'''+''.join(cards)+'''</div><div class="note"><strong>阅读边界：</strong>作品中的时代划分、魔法机制与人物经历按其自身文本理解。作品页保留剧透提示与来源说明；百科的基础设定另行查阅。</div></section>'''
    nav='<a href="#works" data-section="works"><span>08</span>衍生作品</a>'
    assert page.count('</nav>')==1
    page=page.replace('</nav>',nav+'</nav>',1).replace('<footer class="footer">',section+'<footer class="footer">',1)
    public=[{k:v for k,v in x.items() if k not in ['cover','source','imported_source_sha256']} for x in works]
    dataset='<script id="works-data" type="application/json">'+json.dumps(public,ensure_ascii=False).replace('</','<\\/')+'</script>'
    page=page.replace('<script id="codex-data"',dataset+'<script id="codex-data"',1)
    return page

def image_dimensions(file):
    decoder=shutil.which('webpinfo') or '/opt/homebrew/bin/webpinfo'
    info=subprocess.run([decoder,'-summary',str(file)],check=True,capture_output=True,text=True).stdout
    width=int(re.search(r'Width:\s*(\d+)',info)[1]);height=int(re.search(r'Height:\s*(\d+)',info)[1])
    return width,height

def prepare_online_works(codex,output,root):
    records=[]
    for work in registered_works(root):
        prefix='/dnd/works/'+work['id']+'/';directory=Path(output)/'works'/work['id'];assets=directory/'assets';assets.mkdir(parents=True,exist_ok=True)
        original=(root/work['source']).read_text();data=embedded_json(original,'atlas-data');data['meta'].pop('sourcePath',None)
        uris=set(re.findall(r'data:image/webp;base64,[A-Za-z0-9+/=]+',original));images={}
        encoder=shutil.which('cwebp') or '/opt/homebrew/bin/cwebp'
        for uri in sorted(uris):
            blob=base64.b64decode(uri.split(',',1)[1],validate=True)
            if blob[:4]!=b'RIFF' or blob[8:12]!=b'WEBP':raise ValueError('作品插图不是 WebP')
            digest=hashlib.sha256(blob).hexdigest();name='art-'+digest[:20]+'.webp';file=assets/name
            if not file.exists():file.write_bytes(blob)
            width,height=image_dimensions(file)
            info=dict(url=prefix+'assets/'+name,sha256=digest,width=width,height=height,bytes=len(blob),variants=[])
            for size in [320,640]:
                if size>=width:continue
                smallname='art-'+digest[:20]+f'-w{size}-q82-v1.webp';path=assets/smallname
                if not path.exists():subprocess.run([encoder,'-quiet','-q','82','-resize',str(size),'0',str(file),'-o',str(path)],check=True)
                info['variants'].append(dict(url=prefix+'assets/'+smallname,width=size,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bytes=path.stat().st_size))
            info['thumb']=info['variants'][0]['url'] if info['variants'] else info['url']
            info['card']=info['variants'][-1]['url'] if info['variants'] else info['url']
            info['srcset']=', '.join([f'{v["url"]} {v["width"]}w' for v in info['variants']]+[f'{info["url"]} {width}w'])
            images[uri]=info
        page=re.sub(r'data:image/webp;base64,[A-Za-z0-9+/=]+',lambda m:images[m[0]]['url'],original)
        page=json_script(page,'atlas-data',data)
        page=re.sub(r'(<p><strong>来源文件</strong> · ).*?(</p>)',lambda m:m[1]+html.escape(data['meta']['source'])+m[2],page,count=1,flags=re.S)
        page=page.replace('单文件离线阅读 · 所有人物图与3D库已嵌入','在线作品专题 · 图片按需加载，3D库内置')
        galleries=embedded_json(original,'gallery-data')
        gallery={id:[dict(x,src=images[x['src']]['url'],srcset=images[x['src']]['srcset']) for x in a] for id,a in galleries.items()}
        page=json_script(page,'gallery-data',gallery)
        def responsive_img(match):
            tag=match[0];src=re.search(r'\bsrc="([^"]+)"',tag)
            info=next((x for x in images.values() if src and x['url']==src[1]),None)
            if not info:return tag
            hero='data-portrait=' not in tag
            tag=tag.replace('src="'+info['url']+'"','src="'+(info['card'] if hero else info['thumb'])+'"',1)
            attrs=f' data-full="{info["url"]}" data-thumb="{info["thumb"]}" data-srcset="{info["srcset"]}" srcset="{info["srcset"]}" sizes="'+('(max-width:700px) 90vw, 520px' if hero else '(max-width:700px) 45vw, 280px')+'"'
            if 'decoding=' not in tag:attrs+=' decoding="async"'
            if 'loading=' not in tag and not hero:attrs+=' loading="lazy"'
            return tag[:-1]+attrs+'>'
        page=re.sub(r'<img\b[^>]*>',responsive_img,page)
        # Keep full-resolution originals for dialogs; graph portraits use cached thumbnails.
        replacements=[
            ("const images=Object.fromEntries($$('[data-portrait]').map(el=>[el.dataset.portrait,el.src]));", "const images=Object.fromEntries($$('[data-portrait]').map(el=>[el.dataset.portrait,el.dataset.full||el.src]));\nconst portraitSets=Object.fromEntries($$('[data-portrait]').map(el=>[el.dataset.portrait,el.dataset.srcset||'']));\nconst graphImages=Object.fromEntries($$('[data-portrait]').map(el=>[el.dataset.portrait,el.dataset.thumb||el.src]));"),
            ("note:'保留已批准版本',src:images[id]}","note:'保留已批准版本',src:images[id],srcset:portraitSets[id]}"),
            ('id="gallery-image" src="${items[0].src}"','id="gallery-image" src="${items[0].src}" srcset="${items[0].srcset||\'\'}" sizes="(max-width:700px) 90vw, 500px"'),
            ('<img src="${images[id]}" alt=', '<img src="${images[id]}" srcset="${portraitSets[id]}" sizes="(max-width:700px) 90vw, 500px" alt='),
            ('img.src=current.src;img.alt=',"img.srcset=current.srcset||'';img.sizes='(max-width:700px) 90vw, 500px';img.src=current.src;img.alt="),
            ('href:images[c.id]','href:graphImages[c.id]'),
        ]
        for before,after in replacements:
            if page.count(before)!=1:raise ValueError('作品交互结构已改变，需检查整合适配：'+before[:100])
            page=page.replace(before,after,1)
        bar='<div class="codex-return-bar"><div class="container"><a href="/dnd/#works">← 返回 DND 百科 · 衍生作品</a><span>小说专题 / 作品内设定</span></div></div>'
        assert '<header class="topbar">' in page
        page=page.replace('<header class="topbar">','<header class="topbar">'+bar,1)
        extra_css='''.codex-return-bar{border-bottom:1px solid var(--line);background:#0b121d}.codex-return-bar>.container{display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:36px;font-size:12px}.codex-return-bar a{color:var(--gold);padding:5px 0}.codex-return-bar span{color:var(--muted);font-size:11px}html{scroll-padding-top:136px}@media(max-width:700px){.codex-return-bar span{display:none}.codex-return-bar>.container{min-height:34px;font-size:11px}html{scroll-padding-top:150px}}@media print{.codex-return-bar{display:none}}'''
        page=page.replace('</head>','<link rel="canonical" href="'+work['url']+'"><style>'+extra_css+'</style></head>',1)
        # Explain provenance on the public copy without exposing local file paths.
        page=page.replace('依据本机 EPUB','依据所提供的 EPUB').replace('依据本机EPUB','依据所提供的EPUB').replace('本机《阴魂》EPUB','所提供的《阴魂》EPUB').replace('本机文本','所提供的文本').replace('本机《阴魂.epub》','所提供的《阴魂.epub》')
        page=reader.adapt(page,root,data)
        assert '/Users/' not in page
        (directory/'index.html').write_text(page)
        manifest=dict(id=work['id'],title=work['title'],url=work['url'],imported_source_sha256=work['imported_source_sha256'],maintained_source_sha256=hashlib.sha256(original.encode()).hexdigest(),html_sha256=hashlib.sha256(page.encode()).hexdigest(),stats=work['stats'],gallery_count=len(gallery),images=[{k:v for k,v in x.items() if k not in ['thumb','card','srcset']} for x in images.values()])
        (directory/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
        cover=images[work['cover']];codex=codex.replace(work['cover'],cover['card'])
        marker='data-work-cover="'+work['id']+'"'
        pattern=r'<img\b[^>]*'+re.escape(marker)+r'[^>]*>'
        codex=re.sub(pattern,lambda m:m[0][:-1]+f' srcset="{cover["srcset"]}" sizes="(max-width:620px) 90vw, 380px">',codex)
        codex=codex.replace(work['url'],prefix)
        records.append(dict(id=work['id'],title=work['title'],url=work['url'],manifest_url=prefix+'manifest.json',image_count=len(images)))
        print(json.dumps(dict(work=work['id'],html_bytes=len(page.encode()),original_images=len(images),responsive_images=sum(len(x['variants']) for x in images.values())),ensure_ascii=False))
    return codex,records
