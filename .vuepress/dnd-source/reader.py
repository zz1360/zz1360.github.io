"""Adapt the maintained novel guide; keep its approved source and artwork unchanged."""
import html,json,re

def index(root,data):
    codex=json.loads((root/'data.json').read_text())
    return {'core':[e['id'] for k,v in codex.items() if isinstance(v,list) for e in v], 'characters':[c['id'] for c in data['characters']], 'events':[e['id'] for e in data['events']]}

def script(id,value):
    return '<script id="'+id+'" type="application/json">'+json.dumps(value,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+'</script>'

def backup_controls():
    return '<div class="reader-backup"><button class="btn" data-reader-export>导出阅读备份</button><button class="btn" data-reader-import>导入并合并</button><input id="reader-import-file" type="file" accept="application/json,.json" hidden></div><p class="reader-note">备份包含百科收藏、最近阅读，以及作品收藏和阅读位置。导入会合并收藏，保持当前剧透设置。</p><p class="reader-status" role="status" data-reader-backup-status></p>'

def adapt(page,root,data):
    work=root/'works/yinhun';lore=json.loads((work/'lore.json').read_text())
    entries={x['id'] for v in json.loads((root/'data.json').read_text()).values() if isinstance(v,list) for x in v}
    assert all(x['id'] in entries for x in lore)
    opts=''.join(f'<option value="{v}">已读完第 {v} 卷</option>' for v in range(1,15))
    panel='''<section class="reader-panel" id="reading" aria-labelledby="reader-title"><div class="reader-heading"><div><span class="eyebrow">YOUR READING COMPANION</span><h2 id="reader-title">按你的进度，走进故事</h2></div><button class="btn" id="reader-save-book" aria-pressed="false">☆ 收藏作品</button></div><div class="reader-controls"><label for="reader-mode">剧透范围<select id="reader-mode"><option value="intro">无剧透介绍</option><option value="progress">按已读进度查看</option><option value="full">允许完整剧透</option></select></label><label id="reader-volume-field" for="reader-volume" hidden>已读进度（按卷末）<select id="reader-volume">'''+opts+'''</select></label></div><p class="reader-hint" id="reader-mode-note"></p><p class="reader-note">按进度模式展示卷内记录；原有综合摘要含跨卷反转，因此暂时隐藏。换装插画仍属于美术演绎，可能包含已批准形象的视觉线索。</p><div class="reader-resume" id="reader-resume"></div><details class="reader-shelf"><summary>我的收藏与备份</summary><div id="reader-saved"></div>'''+backup_controls()+'''<button class="source-btn" id="reader-clear">清空上次阅读位置</button><p class="reader-note" id="reader-storage"></p></details><div id="reader-status" role="status" class="reader-status"></div></section>'''
    page=page.replace('本页含大量剧透。','默认隐藏剧情，可在下方设置剧透范围。')
    page=page.replace('<div class="story-road">',panel+'<div class="story-road">',1)
    page=page.replace('<nav class="nav-links"','<nav class="nav-links"',1).replace('<a href="#world">世界观</a>','<a href="#reading">阅读设置</a><a href="#world">世界观</a>',1)
    def note(marker,id,text):
        nonlocal page
        assert marker in page,marker
        page=page.replace(marker,f'<p class="reader-locked" id="{id}">{text}</p>'+marker,1)
    note('<div class="world-grid">','reader-world-note','综合世界观包含后续情节，当前暂时隐藏。下方的基础概念对照可以先阅读。')
    note('<div class="timeline">','reader-history-note','小说历史讲述可能揭示人物身世；完整历史在允许完整剧透时显示。')
    note('<div class="volume-tabs"','reader-volumes-empty','卷纲尚未解锁。请选择“按已读进度查看”并设置已读卷数。')
    note('<div class="cast-grid">','reader-characters-empty','人物档案与画廊将随已读进度开放。')
    note('<div class="relationship">','reader-relations-note','完整人物关系含跨卷反转，当前暂时隐藏；已读人物的行动可在档案中查看。')
    note('<div class="mysteries">','reader-boundaries-note','未解线索包含后续反转与结局讨论，当前暂时隐藏。')
    cards=''.join('<article class="lore-card"><span class="eyebrow">NOVEL × CODEX / 概念对照</span><h3>'+html.escape(x['name'])+'</h3><p>'+html.escape(x['official'])+'</p><button class="source-btn" data-reader-lore="'+x['id']+'">对照小说与百科 ↗</button></article>' for x in lore)
    page=page.replace('<section class="section" id="history">','<div class="lore-grid">'+cards+'</div><p class="reader-note">仅关联已核对的基础概念。具体情节、机制与年代分别理解；尚未核实的差异不直接判为作者改写。</p><section class="section" id="history">',1)
    page=page.replace('</head>','<style>'+ (work/'reader.css').read_text()+'</style></head>',1)
    extras=script('reader-index-data',index(root,data))+script('novel-lore-data',lore)+'<script>'+(root/'reader-backup.js').read_text()+'</script>'
    def adapt_app(match):
        body=match[1]
        if "const DATA=JSON.parse" not in body:return match[0]
        body=body.replace('let lastFocus=null, activeGallery=null;','let lastFocus=null, activeGallery=null;\n'+(work/'reader-bootstrap.js').read_text(),1)
        body=body.replace("return `<div class=\"source-detail\">", "citations=readerCitations(citations);return `<div class=\"source-detail\">",1)
        body=body.replace("const c=DATA.characters.find(x=>x.id===id);if(!c)return;", "const c=readerCharacter(DATA.characters.find(x=>x.id===id));if(!c)return;readerRemember('character',id);",1)
        body=body.replace("const variants=GALLERIES[id]||[];", "const variants=(GALLERIES[id]||[]).map((x,i)=>readerFull()?x:{...x,title:'姿势与换装 '+(i+1),note:'美术演绎'});",1)
        body=body.replace("const links=DATA.relations.filter", "const links=readerFull()?DATA.relations.filter",1)
        body=body.replace("}).join('');\n  showDialog(`<div class=\"character-detail", "}).join(''):'';\n  showDialog(`<div class=\"character-detail",1)
        body=body.replace('<h4>重要关系</h4>', "${readerTools('character',id)}<h4>${readerFull()?'重要关系':'完整关系暂时隐藏'}</h4>",1)
        body=body.replace("if(gallery)setupGallery(c,items);", "if(gallery)setupGallery(c,items);readerDesk();",1)
        body=body.replace('activeGallery.index=position;',"activeGallery.index=position;readerRemember('character',character.id,position);",1)
        body=body.replace('function setVolume(n){',"function setVolume(n){\n if(n>readerLimit())return;readerRemember('volume',n);",1)
        body=body.replace("DATA.events.filter(e=>(!v||e.volume===v)", "DATA.events.filter(e=>e.volume<=readerLimit()&&(!v||e.volume===v)",1)
        body=body.replace("[e.title,e.cause,e.action,e.consequence,...e.characters]", "(readerFull()?[e.title,e.cause,e.action,e.consequence,...e.characters]:[e.title,e.action,...e.characters])",1)
        body=body.replace('function renderRelations(id){', 'function renderRelations(id){\n if(!readerFull())return;',1)
        # A citation note may itself summarize a later reversal; partial mode uses a neutral locator.
        body=body.replace('${esc(c.note)}</p>', "${esc(readerFull()?c.note:'已读卷内的章节定位；具体内容以原文为准。')}</p>",1)
        body+='\n'+(work/'reader.js').read_text()
        return extras+'<script>'+body+'</script>'
    page=re.sub(r'<script>(.*?)</script>',adapt_app,page,flags=re.S)
    assert 'readerApply();readerBooting=false;' in page
    return page

def codex(page,root):
    source=(root/'works/yinhun/source.html').read_text()
    data=json.loads(re.search(r'<script[^>]*id="atlas-data"[^>]*>(.*?)</script>',source,re.S)[1])
    lore=json.loads((root/'works/yinhun/lore.json').read_text())
    page=page.replace('<div class="work-actions">','<p class="small-copy" data-work-reading></p><div class="work-actions"><button class="plain" data-save-work="yinhun" aria-pressed="false">☆ 收藏作品</button>',1)
    page=page.replace('<div id="resume-reading"></div>','<div id="resume-reading"></div><div id="work-reading-desk"></div>'+backup_controls(),1)
    # Add reciprocal context in the knowledge dossier, without claiming novel events are canon.
    marker="const links=linksFor(id);if(!links.length)return '';"
    assert marker in page
    page=page.replace(marker,"const novel=({"+','.join(json.dumps(x['id'])+':'+json.dumps(x['name'],ensure_ascii=False) for x in lore)+"})[id];const workLink=novel?`<div class=\"note\"><strong>衍生作品 · 《阴魂》</strong><p>基础概念与小说用法分别呈现；小说情节不归入官方设定。</p><a href=\"https://blog.luckydogs.top/dnd/works/yinhun/#lore/${esc(id)}\">查看小说概念对照 ↗</a></div>`:'';const links=linksFor(id);if(!links.length)return workLink;",1)
    page=page.replace('return `<section class="knowledge-links"','return workLink+`<section class="knowledge-links"',1)
    page=page.replace('</body>',script('reader-index-data',index(root,data))+'<script>'+(root/'reader-backup.js').read_text()+'</script><script>'+(root/'works-desk.js').read_text()+'</script></body>',1)
    return page
