"""Assemble the exploration tools; knowledge is kept in separate JSON files."""
import json,re,html

def enhance(page,data,root):
    entries={x['id']:x for k in ['worlds','planes','history','people','locations','factions','terms'] for x in data[k]}
    relations=json.loads((root/'relations.json').read_text())
    flows=json.loads((root/'history-flow.json').read_text())
    for r in relations:
        assert r['a'] in entries and r['b'] in entries and all(k in data['sources'] for k in r['src'])
    assert set(flows)=={x['id'] for x in data['history']}
    def script(id,obj):return '<script type="application/json" id="'+id+'">'+json.dumps(obj,ensure_ascii=False).replace('</','<\\/')+'</script>'
    reading='''<section class="reading-desk" aria-labelledby="reading-desk-title"><div class="desk-head"><div><span class="eyebrow">YOUR READING DESK</span><h3 id="reading-desk-title">我的阅览桌</h3></div><button class="plain" id="clear-reading">清空阅读记录</button></div><p class="small-copy">收藏与阅读位置仅保存在当前浏览器，无需登录。点击任意档案中的“收藏”，把线索留在这里。</p><div id="reading-storage-status" role="status"></div><div id="resume-reading"></div><div class="desk-columns"><div><h4>我的收藏 <span id="saved-count">0</span></h4><div id="saved-entries" class="desk-list"></div></div><div><h4>最近阅读</h4><div id="recent-entries" class="desk-list"></div></div></div></section>'''
    page=page.replace('<div class="section-title"><h3>从三个问题开始',reading+'<div class="section-title"><h3>从三个问题开始',1)
    # A hand-drawn navigation schematic. Positions deliberately have no geographic coordinates.
    points=[('icewind',43,15),('neverwinter',39,34),('phandalin',72,43),('waterdeep',34,56),('baldurs',39,75),('candlekeep',36,90)]
    markers=''.join(f'<button class="map-pin" style="left:{x}%;top:{y}%" data-map="{id}" aria-pressed="false"><span class="pin-dot" aria-hidden="true"></span><span>{html.escape(entries[id]["name"])}</span></button>' for id,x,y in points)
    map_html='''<section class="map-explorer" aria-labelledby="map-title"><div class="desk-head"><div><span class="eyebrow">SWORD COAST / A READING MAP</span><h3 id="map-title">沿海岸，寻找故事的入口</h3></div><a href="https://www.dndbeyond.com/resources/1782-map-of-faerun" target="_blank" rel="noopener noreferrer">查阅官方地图 ↗</a></div><p class="small-copy">点选地标，查看地点、人物与势力的阅读线索。下图为方向导航示意，没有比例、准确坐标或里程。</p><div class="map-layout"><div><div class="coast-map"><svg viewBox="0 0 720 640" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="sea-lines" width="50" height="30" patternUnits="userSpaceOnUse"><path d="M0 18q12-6 24 0t24 0" fill="none" stroke="currentColor" opacity=".10"/></pattern></defs><rect width="720" height="640" fill="var(--map-sea)"/><rect width="310" height="640" fill="url(#sea-lines)"/><path d="M375 0 356 70 325 140 338 190 306 253 273 300 282 350 255 398 281 450 284 500 266 561 252 640H720V0Z" fill="var(--map-land)" stroke="var(--gold)" stroke-opacity=".5" stroke-width="2"/><g fill="none" stroke="var(--muted)" opacity=".20" stroke-width="2"><path d="m505 60 22-43 25 43m-11-20 22-38 22 38m-13 370 22-45 24 45m-1-8 24-52 28 52m-51 170 20-40 23 40"/><path d="m488 265 17-28 17 28h-9v14h-16v-14m25-22 16-28 16 28h-8v14h-16v-14m-26 45 17-29 18 29h-10v15h-16v-15"/></g><path d="M307 217q111 36 200 53" fill="none" stroke="var(--gold)" stroke-dasharray="4 8" opacity=".23"/></svg><span class="map-ocean">无痕之海</span><span class="map-inland">北地 · 内陆</span><span class="map-north">↑ 北</span>'''+markers+'''<span class="map-seal">SWORD COAST<br>方向示意 / 无比例</span></div><div class="underground"><span class="eyebrow">BENEATH THE SURFACE / 地下索引</span><p>地下世界在地表下延展，以下条目不占用海岸坐标。</p><div>'''+''.join(f'<button class="plain" data-map="{id}" aria-pressed="false">{html.escape(entries[id]["name"])} →</button>' for id in ['underdark','menzo'])+'''</div></div></div><article class="map-preview" id="map-preview" aria-live="polite" aria-atomic="true"></article></div><div class="map-index" role="group" aria-label="按名称选择地点">'''+''.join(f'<button class="chip" data-map="{x["id"]}" aria-pressed="false">{html.escape(x["name"])}</button>' for x in data['locations'])+'''</div></section>'''
    page=re.sub(r'<div class="atlas-layout"><aside class="atlas-route">.*?</aside>',map_html+'<div class="atlas-cards">',page,count=1,flags=re.S)
    page=page.replace('<div class="section-title"><h3>其他世界的重大事件', '<div class="section-title"><h3>其他世界的重大事件',1)
    # Put explicit cause/effect access on each historical card.
    page=re.sub(r'(<article class="time-event"[^>]+data-entry="([^"]+)".*?<div class="card-bottom">)',lambda m:m[1]+f'<button class="plain" data-open="{m[2]}">追踪前因与后果</button>',page,flags=re.S)
    page=re.sub(r'(<article\b[^>]+data-entry="([^"]+)".*?<div class="card-bottom">)',lambda m:m[1]+f'<button class="save-entry" data-save="{m[2]}" aria-pressed="false" aria-label="收藏{html.escape(entries[m[2]]["name"],quote=True)}">☆</button>',page,flags=re.S)
    extra=script('relations-data',relations)+script('history-flow-data',flows)
    extra+='''<dialog id="share-dialog" aria-labelledby="share-title"><div class="dialog-top"><h2 id="share-title">分享此条目</h2><button class="close" data-close="share-dialog" aria-label="关闭分享">×</button></div><div class="dialog-body"><label for="share-url">复制下面的直达链接</label><input class="search-field" id="share-url" readonly><p class="small-copy">链接会保留条目或当前插画的位置。离线文件的地址仅适用于本机；公开分享请使用博客网址。</p></div></dialog><div id="codex-notice" role="status" aria-live="polite" hidden></div>'''
    page=page.replace('<script id="codex-data"',extra+'<script id="codex-data"',1)
    page=page.replace('</head>','<style>'+(root/'explore.css').read_text()+'</style></head>',1)
    page=page.replace('</body>','<script>'+(root/'explore.js').read_text()+'</script></body>',1)
    page=page.replace('<figure class="art-stage">','<div id="art-tools" class="entry-tools"></div><figure class="art-stage">',1)
    page=page.replace('单文件离线插图版</span>','探索功能更新 2026.10.08 · 离线插图版</span>')
    from works import catalogue
    page=catalogue(page,root)
    page=page.replace("</head>","<style>"+(root/"works.css").read_text()+"</style></head>",1)
    return page
