"""Publish complete, independently addressable 5E setting guides from shared UI."""
from pathlib import Path
from html.parser import HTMLParser
import html, json, re

GROUPS=('worlds','planes','history','people','locations','factions','terms')
e=lambda text:html.escape(str(text),quote=True)

def registry(root):
    records=json.loads((root/'settings/catalog.json').read_text())
    assert {x['id'] for x in records}=={'realms','eberron','planescape'}
    for x in records:
        assert re.fullmatch(r'[a-z]+',x['id'])
        assert x['path']==('/dnd/' if x['id']=='realms' else '/dnd/settings/'+x['id']+'/')
    return records

def controls(root,current,place):
    options=''.join(f'<option value="{e(x["id"])}"'+(' selected' if x['id']==current else '')+'>'+e(x['name'])+'</option>' for x in registry(root))
    return '<span class="setting-controls"><span class="edition-label">D&amp;D <b>5E</b></span><i aria-hidden="true">✦</i><label class="setting-label" for="setting-'+place+'">战役设定</label><select id="setting-'+place+'" data-setting-select aria-label="选择战役设定">'+options+'</select></span>'

class Chapters(HTMLParser):
    def __init__(self,page):
        super().__init__(convert_charrefs=False);self.depth=0;self.current=None;self.spans=[];self.starts=[0]
        for match in re.finditer('\n',page):self.starts.append(match.end())
        self.feed(page)
    def source_offset(self):
        line,column=self.getpos();return self.starts[line-1]+column
    def handle_starttag(self,tag,attrs):
        if tag!='section':return
        self.depth+=1;attrs=dict(attrs)
        if 'chapter' in attrs.get('class','').split():self.current=(attrs['id'],self.source_offset(),self.depth)
    def handle_endtag(self,tag):
        if tag!='section':return
        if self.current and self.current[2]==self.depth:
            self.spans.append((self.current[0],self.current[1],self.source_offset()+len('</section>')));self.current=None
        self.depth-=1

def json_script(page,id,data):
    pattern=r'(<script\b[^>]*\bid="'+re.escape(id)+r'"[^>]*>).*?(</script>)'
    value=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    page,count=re.subn(pattern,lambda m:m[1]+value+m[2],page,flags=re.S)
    assert count==1,id
    return page

def guide_chapters(data,base,root,scenes,archive_figures):
    sources=data['sources'];nums={k:i+1 for i,k in enumerate(sources)}
    def refs(ids):
        return '<div class="sources-inline"><span>来源</span>'+''.join(f'<a href="{e(sources[k]["url"])}" target="_blank" rel="noopener noreferrer">[{nums[k]:02d}] {e(sources[k]["kind"])}</a>' for k in dict.fromkeys(ids))+'</div>'
    art=archive_figures
    def card(x,i=0):
        detail=''.join('<h4>'+e(a)+'</h4><p>'+e(b)+'</p>' for a,b in x['details'])
        return f'<article class="card'+(' illustrated-card' if x['id'] in art else '')+f'" data-entry="{e(x["id"])}" id="entry-{e(x["id"])}" style="--accent:{e(x["color"])}">'+art.get(x['id'],f'<div class="setting-sigil" aria-hidden="true"><span>{i+1:02d}</span>✦</div>')+f'<span class="index">{e(x.get("cat",x.get("tag",x.get("kind","知识档案"))))}</span><h3>{e(x["name"])}</h3><div class="en">{e(x["en"])}</div><p>{e(x["body"])}</p>'+('<details><summary>继续阅读</summary>'+detail+'</details>' if detail else '')+refs(x['src'])+f'<div class="card-bottom"><span>{e(data["setting"]["name"])}</span><button class="entry-open" data-open="{e(x["id"])}">查看档案 ↗</button></div></article>'
    def cards(group,id,cls='grid'):
        return f'<div class="{cls}" id="{id}">'+''.join(card(x,i) for i,x in enumerate(data[group]))+'</div>'
    def title(section,name):
        return '<header class="section-head"><span class="eyebrow">'+e(data['setting']['en'].upper())+'</span><h2>'+name+'</h2><p class="sub">'+e(data['intro'].get(section,''))+'</p></header>'
    def section(id,body):return '<section class="chapter" id="'+id+'">'+body+'</section>'
    def choices(id,attr,values,noun,count):
        return f'<div class="controls" id="{id}"><button class="chip active" data-{attr}="all" aria-pressed="true">全部</button>'+''.join(f'<button class="chip" data-{attr}="{e(v)}" aria-pressed="false">{e(v)}</button>' for v in dict.fromkeys(values))+f'<span class="result-count" role="status" id="{noun}-count">{count} 个'+('入口' if noun=='world' else '节点')+'</span></div>'
    # Obtain a full visualization by reusing its known outer container through a parser.
    class Viz(HTMLParser):
        def __init__(self,id):super().__init__(convert_charrefs=False);self.parts=[];self.level=0;self.id=id;self.done=False
        def handle_starttag(self,tag,attrs):
            if self.done:return
            attrs=dict(attrs)
            if tag=='div' and attrs.get('id')==self.id and not self.level:self.level=1
            elif self.level and tag=='div':self.level+=1
            if self.level:self.parts.append(self.get_starttag_text())
        def handle_endtag(self,tag):
            if not self.level:return
            self.parts.append('</'+tag+'>')
            if tag=='div':
                self.level-=1
                if not self.level:self.done=True
        def handle_data(self,text):
            if self.level:self.parts.append(text)
        def handle_entityref(self,name):
            if self.level:self.parts.append('&'+name+';')
        def handle_charref(self,name):
            if self.level:self.parts.append('&#'+name+';')
    def viz(id):
        parser=Viz(id);parser.feed(base);text=''.join(parser.parts)
        text=re.sub(r'<div class="fallback-grid">.*?</div>', '<div class="fallback-grid">'+''.join(f'<button data-plane="{e(x["id"])}">{e(x["name"])}</button>' for x in data['planes'])+'</div>',text,flags=re.S)
        return text.replace('THE PLANAR ATLAS',e(data['cosmology']['eyebrow']))
    result={'overview':section('overview','<header class="overview-edition"></header>'+viz('home-viz'))}
    from setting_overviews import render as render_overview
    result['worlds']=render_overview(root,data['setting']['id'],data,scenes[data['setting']['id']])
    result['cosmos']=section('cosmos',title('cosmos','位面宇宙')+'<div class="cosmos-layout setting-cosmos">'+viz('cosmos-viz')+'<article class="plane-panel" id="plane-panel" aria-live="polite"></article></div><div class="plane-selector" aria-label="选择位面条目">'+''.join(f'<button data-plane="{e(x["id"])}" aria-pressed="false">{e(x["name"])}</button>' for x in data['planes'])+'</div><div class="note">'+e(data['model_note'])+'</div>'+cards('planes','plane-grid'))
    history=choices('history-filters','era',[x['era'] for x in data['history']],'history',len(data['history']))+'<div class="timeline" id="timeline">'
    for x in data['history']:
        history+=f'<article class="time-event" data-entry="{e(x["id"])}"><div class="time-date">{e(x["date"])}<small>{e(x["era"])}</small></div><div class="time-body"><h3>{e(x["name"])}</h3><div class="en">{e(x["en"])}</div><p>{e(x["body"])}</p>'+refs(x['src'])+f'<div class="card-bottom"><span>{e(data["setting"]["name"])}</span><button class="entry-open" data-open="{e(x["id"])}">查看档案 ↗</button></div></div></article>'
    result['history']=section('history',title('history','历史年表' if data['setting']['id']=='eberron' else '历史与事件')+history+'</div>')
    people='<div class="controls"><label for="person-world">设定</label><select id="person-world"><option value="all">全部</option><option>'+e(data['setting']['name'])+'</option></select><label for="person-role">类别</label><select id="person-role"><option value="all">全部类别</option>'+''.join('<option>'+e(v)+'</option>' for v in dict.fromkeys(x['role'] for x in data['people']))+'</select><button class="plain" id="reset-people">重置</button><span id="people-count" role="status">'+str(len(data['people']))+' 个档案</span></div>'
    result['people']=section('people',title('people','人物与神祇')+people+cards('people','people-grid')+'<p id="people-empty" class="empty" hidden>没有符合条件的人物。</p>')
    result['atlas']=section('atlas',title('atlas','地理与势力')+cards('locations','setting-places','grid two')+'<div class="section-title"><h3>组织与权力网络</h3><small>'+e(data['setting']['name'])+'</small></div>'+cards('factions','setting-factions'))
    result['primer']=section('primer',title('primer','术语与入门')+cards('terms','setting-terms','grid two'))
    books='<div class="grid two">'
    for work in data['works']:
        books+='<article class="card"><span class="eyebrow">'+e(work['category'])+'</span><h3>'+e(work['title'])+'</h3><p>'+e(work['description'])+'</p>'+refs(work['src'])+'<a class="plain setting-work-link" target="_blank" rel="noopener noreferrer" href="'+e(work['url'])+'">查阅官方资料 ↗</a></article>'
    result['works']=section('works','<header class="section-head"><span class="eyebrow">'+e(data['setting']['en'].upper())+'</span><h2>关联作品与冒险</h2><p class="sub">当前设定的出版物入口；只介绍舞台，不展开剧情结局。</p></header>'+books+'</div>')
    sources_html='<header class="section-head"><span class="eyebrow">SOURCES & SCOPE</span><h2>资料与边界</h2><p class="sub">'+e(data['setting']['scope'])+'</p></header><div class="note">资料核对：'+e(data['setting']['checked'])+'。官方公开文章、目录、设计者解释和社区汇编分别标明；书籍正文未取得的部分不声称已核读。中文译名可能有差异，保留英文名便于对照。</div><ol class="source-list">'
    for id,x in sources.items():sources_html+=f'<li id="source-{e(id)}"><b>{nums[id]:02d}</b><div><a target="_blank" rel="noopener noreferrer" href="{e(x["url"])}">{e(x["title"])} ↗</a><small>{e(x["kind"])}</small><p>{e(x["note"])}</p></div></li>'
    result['sources']=section('sources',sources_html+'</ol>')
    return result

def validate(data):
    entries=[x for k in GROUPS for x in data[k]];ids={x['id'] for x in entries};assert len(entries)==len(ids)
    for x in entries:
        assert x['section'] in {'worlds','cosmos','history','people','atlas','primer'}
        assert x['src'] and all(s in data['sources'] for s in x['src'])
        assert isinstance(x['details'],list) and all(len(p)==2 for p in x['details'])
    for r in data['relations']:assert r['a'] in ids and r['b'] in ids and all(s in data['sources'] for s in r['src'])
    graph=data['cosmology'];assert {x[0] for x in graph['config']}=={x['id'] for x in data['planes']}
    assert set(graph['mobileRows'])=={x['id'] for x in data['planes']}
    assert graph['center'] in ids and all(a in ids and b in ids for a,b in graph['connections'])

def theme(page,root,data):
    setting=data['setting'];current=setting['id']
    page=re.sub(r'(<span class="chamber-edition">).*?(</span><small)',lambda m:m[1]+controls(root,current,'chamber')+m[2],page,count=1,flags=re.S)
    page=page.replace('</header><div class="stage">','</header><div class="setting-toolbar">'+controls(root,current,'toolbar')+'</div><div class="stage">',1)
    page=re.sub(r'<header class="overview-edition">.*?</header>','',page,count=1,flags=re.S)
    page=page.replace('<body class="stage-mode">','<body class="stage-mode" data-setting="'+current+'">',1)
    page=page.replace('</head>','<style>'+(root/'settings.css').read_text()+'</style></head>',1)
    config={'current':setting,'catalog':registry(root)}
    page=page.replace('</body>','<script type="application/json" id="settings-data">'+json.dumps(config,ensure_ascii=False).replace('<','\\u003c')+'</script><script>'+(root/'settings.js').read_text()+'</script></body>',1)
    return page

def publish(base,root,output):
    current=registry(root)[0]
    original=json.loads(re.search(r'<script id="codex-data"[^>]*>(.*?)</script>',base,re.S)[1])
    original['setting']=current
    base=json_script(base,'codex-data',original)
    from setting_overviews import render as render_overview,published_scenes
    scenes=published_scenes(root,output,base)
    from archive_art import publish as publish_archive_art
    archive_figures,archive_manifest=publish_archive_art(root,output,base,scenes)
    parsed=Chapters(base)
    start,end=next((start,end) for id,start,end in parsed.spans if id=='worlds')
    base=base[:start]+render_overview(root,'realms',original,scenes['realms'])+base[end:]
    records=[]
    gallery=json.loads(re.search(r'<script id="art-gallery-data"[^>]*>(.*?)</script>',base,re.S)[1])
    for meta in registry(root)[1:]:
        data=json.loads((root/'settings'/(meta['id']+'.json')).read_text());validate(data)
        page=base;chapters=guide_chapters(data,base,root,scenes,archive_figures)
        parsed=Chapters(page);assert len(parsed.spans)==9
        for id,start,end in reversed(parsed.spans):page=page[:start]+chapters[id]+page[end:]
        ui_data={k:v for k,v in data.items() if k not in ['relations','flows','works']}
        page=json_script(page,'codex-data',ui_data);page=json_script(page,'relations-data',data['relations']);page=json_script(page,'history-flow-data',data['flows']);page=json_script(page,'works-data',data['works'])
        own_gallery={x['id']:gallery[x['art']] for x in data['people'] if x.get('art') in gallery}
        page=json_script(page,'art-gallery-data',own_gallery)
        page=page.replace('https://blog.luckydogs.top/dnd/">','https://blog.luckydogs.top'+meta['path']+'">',1)
        page=page.replace('<title>DND world · D&D 世界百科</title>','<title>'+e(meta['name'])+' · 5E · DND world</title>',1)
        page=re.sub(r'<meta name="description" content="[^"]*">','<meta name="description" content="'+e(meta['name']+' 5E 设定导览：位面、世界、历史、人物与势力。')+'">',page,count=1)
        page=re.sub(r'<footer class="footer">.*?</footer>','<footer class="footer"><span>DND world · '+e(meta['name'])+' · 非官方知识导览</span><span>资料核对 '+e(meta['checked'])+'</span></footer>',page,count=1,flags=re.S)
        page=page.replace("selectMapLocation('waterdeep');",'')
        page=page.replace('placeholder="试试：魔网、崔斯特、Netheril…"','placeholder="'+('试试：沙恩、龙纹、Dal Quor…' if meta['id']=='eberron' else '试试：印记城、门钥、Sigil…')+'"')
        page=page.replace('>衍生作品</a>','>关联作品</a>')
        if meta['id']=='planescape':page=page.replace('>历史年表</a>','>历史与事件</a>')
        page=theme(page,root,data)
        dest=Path(output)/'settings'/meta['id'];dest.mkdir(parents=True,exist_ok=True);(dest/'index.html').write_text(page)
        records.append({'id':meta['id'],'url':meta['path'],'entries':sum(len(data[k]) for k in GROUPS),'graphNodes':len(data['planes'])})
    return theme(base,root,original),records,scenes,archive_manifest
