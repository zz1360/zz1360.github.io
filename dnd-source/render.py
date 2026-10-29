from pathlib import Path
import html,json,base64,re
root=Path(__file__).resolve().parent
D=json.loads((root/'data.json').read_text()); S=D['sources']; nums={k:i+1 for i,k in enumerate(S)}
# Keep cross-setting reference links addressable, outside the active setting directory.
D['reference_worlds']=[dict(x,reference=True,guidePath={'eberron':'/dnd/settings/eberron/','planescape':'/dnd/settings/planescape/'}.get(x['id'])) for x in D['worlds'] if x['id']!='fr']
D['worlds']=[x for x in D['worlds'] if x['id']=='fr']
from ui_sections import archive_card,history_item,terms,place_directory
e=lambda x:html.escape(str(x),quote=True)

art_manifest=json.loads((root/'art-manifest.json').read_text()) if (root/'art-manifest.json').exists() else []
from archive_art import root_assets
original_art_count=len(art_manifest)
art_manifest+=root_assets(root)
ART={x['id']:x for x in art_manifest}
gallery_manifest=json.loads((root/'gallery-manifest.json').read_text()) if (root/'gallery-manifest.json').exists() else []
GALLERIES={}
for asset in gallery_manifest:
 GALLERIES.setdefault(asset['character_id'],[]).append(asset)
def illustration(x):
 a=ART.get(x['id'])
 if not a:return ''
 data='data:image/webp;base64,'+base64.b64encode((root/a['file']).read_bytes()).decode('ascii')
 count=1+len(GALLERIES.get(x['id'],[]))
 action=f'人物画廊 · {count} 幅 ↗' if count>1 else '查看大图 ↗'
 return f'''<figure class="art-figure"><button type="button" class="art-open" data-art="{x['id']}" aria-label="{'浏览' if count>1 else '放大查看'}{e(x['name'])}插图"><img id="art-{x['id']}" class="entry-art" src="{data}" data-art-note="{e(a['art_note'])}" alt="{e(x['name'])}的概念插画" loading="lazy" decoding="async" width="1536" height="1024"><span class="art-enlarge">{action}</span></button><figcaption>AI 概念插画 · 艺术演绎{' · '+str(count)+' 幅画廊' if count>1 else ''}</figcaption></figure>'''

def refs(keys):
 return '<div class="sources-inline"><span>来源</span>'+''.join(f'<a href="{e(S[k]["url"])}" target="_blank" rel="noopener noreferrer" title="{e(S[k]["title"])}">[{nums[k]:02d}] {e(S[k]["kind"])}</a>' for k in dict.fromkeys(keys))+'</div>'
def details(x):
 return '<details><summary>继续阅读</summary>'+''.join(f'<h4>{e(a)}</h4><p>{e(b)}</p>' for a,b in x['details'])+'</details>' if x['details'] else ''
def card(x,i=0,cls='',meta=''):
 button=f'<button class="entry-open" data-art="{x["id"]}">人物画廊 · {1+len(GALLERIES[x["id"]])} 幅 ↗</button>' if x['id'] in GALLERIES else f'<button class="entry-open" data-open="{x["id"]}">查看档案 ↗</button>'
 return f'''<article class="card {cls}{' illustrated-card' if x['id'] in ART else ''}" id="entry-{x['id']}" data-entry="{x['id']}" style="--accent:{x.get('color','#c6aa72')}">{illustration(x)}<span class="index">{e(meta or x.get('kind',x.get('cat','条目')))} · {i+1:02d}</span><h3>{e(x['name'])}</h3><div class="en">{e(x['en'])}</div><p>{e(x['body'])}</p>{details(x)}{refs(x['src'])}<div class="card-bottom"><span>{e(x.get('tag',x.get('setting','知识档案')))}</span>{button}</div></article>'''
def viz(id):
 title='h1' if id=='home-viz' else 'h3'
 return f'''<div class="viz" id="{id}" role="group" aria-label="可交互的位面概念关系图"><div class="atlas-ornament" aria-hidden="true"><span>✦</span><span>✦</span><span>✦</span><span>✦</span></div><div class="viz-top"><span class="eyebrow">THE PLANAR ATLAS</span><{title}>位面概念关系图</{title}></div><div class="fallback"><strong>多元宇宙</strong><div class="fallback-grid">{''.join(f'<button data-plane="{x["id"]}">{x["name"]}</button>' for x in D['planes'])}</div><p>选择位面，查看档案</p></div><div class="label-layer"></div><div class="viz-bottom"><span>拖动旋转 · 点击位面<br><small>概念示意，非天体轨道</small></span><div><button class="plain pause-viz" aria-label="暂停星盘光效">暂停光效</button><button class="plain reset-viz" aria-label="复位星盘视角">复位</button></div></div></div>'''

nav=[('cosmos','00','位面宇宙'),('history','03','历史年表'),('people','04','人物与神祇'),('atlas','05','地理与势力'),('primer','06','术语与入门'),('sources','07','资料与边界')]
H='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="description" content="以被遗忘的国度为主线的中文 D&D 世界百科：世界观、位面、历史、重大事件、人物与神祇。单文件离线阅读，内嵌 Three.js 位面图。"><title>D&D 世界百科 · 多元宇宙知识图谱</title><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23101c18'/%3E%3Cpath d='M32 7 55 21v25L32 59 9 46V21zM9 21l23 10 23-10M32 7v24m0 28V31M9 46l23-15 23 15' stroke='%23d0ad75' fill='none' stroke-width='2'/%3E%3C/svg%3E"><style>'''+(root/'style.css').read_text()+(root/'planar-atlas.css').read_text()+'''</style></head><body><a class="skip" href="#main">跳到正文</a><aside class="rail"><div class="brand"><svg viewBox="0 0 60 64" aria-hidden="true"><path d="M30 4 55 18v28L30 60 5 46V18zM5 18l25 12 25-12M30 4v26m0 30V30M5 46l25-16 25 16" fill="none" stroke="currentColor" stroke-width="1.1"/></svg><div>万界典藏<small>D&D · WORLD CODEX</small></div></div><div class="rail-label">阅览目录 / CONTENTS</div><nav class="nav" aria-label="百科章节">'''+''.join(f'<a href="#{k}" data-section="{k}" {"aria-current=page" if k=="cosmos" else ""}><span>{n}</span>{name}</a>' for k,n,name in nav)+'''</nav><div class="rail-foot"><strong>被遗忘的国度 · 主线</strong>多个世界，一座知识书库。<br>资料核对：2026 · 10 · 02<br>可离线阅读 / 来源联网打开</div></aside><div class="shell"><header class="topbar"><div class="crumb">DUNGEONS & DRAGONS <em> / </em><span id="crumb">位面宇宙</span></div><div class="tools"><button class="search-launch" id="launch-search" aria-haspopup="dialog">⌕ 搜索百科 <kbd>⌘ K</kbd></button><button class="plain" id="theme-button" aria-label="切换到浅色阅读模式">浅色</button><button class="plain" id="print-button" aria-label="打印全百科">打印</button></div></header><main id="main"><noscript><p class="noscript">当前未启用 JavaScript，所有章节仍可阅读；三维模型、筛选与搜索需启用 JavaScript。</p></noscript><section class="chapter" id="cosmos" aria-label="位面宇宙"><header class="overview-edition"><span>D&amp;D 5E</span><i aria-hidden="true">✦</i><strong>被遗忘的国度</strong></header>'''+viz('home-viz')+'''</section>'''
H+='''<section class="chapter" id="history"><header class="section-head"><h2>历史年表</h2></header><div class="controls" id="history-filters"><button class="chip active" data-era="all" aria-pressed="true">全部年代</button>'''+''.join(f'<button class="chip" data-era="{x}" aria-pressed="false">{x}</button>' for x in ['古代','动荡时代','重整时代'])+'''<span class="result-count" id="history-count" role="status">13 个节点</span></div><div class="timeline" id="timeline">'''
H+=''.join(history_item(x) for x in D['history'])+'</div></section>'
from people import render as render_people
from sword_coast import render as render_map
H+='<section class="chapter" id="people"><header class="section-head"><h2>人物与神祇</h2></header>'+render_people(D['people'],lambda x,i:archive_card(x,illustration(x),person=True),split=True)+'</section>'
H+='''<section class="chapter" id="atlas"><header class="section-head"><h2>地理与势力</h2></header>'''+render_map(D)+place_directory(D['locations'],illustration)+'''<div class="section-title"><h3>势力</h3></div><div class="grid">'''+''.join(archive_card(x,illustration(x)) for x in D['factions'])+'''</div></section>'''
H+='''<section class="chapter" id="primer"><header class="section-head"><h2>术语与入门</h2></header>'''+terms(D['terms'],refs)+'''</section>'''
H+='''<section class="chapter" id="sources"><header class="section-head"><h2>资料与边界</h2></header><div class="source-boundaries"><details><summary>版本与资料范围</summary><p>位面以第五版基础分类为参照，魔法船采用 2022 年第五版框架；不同版本、小说和游戏的连续性可能不同。资料核对日期：2026-10-02。未取得的书籍不声称逐页核读。</p></details><details><summary>历史与设定中的不确定之处</summary><p>费伦重大事件的年代结合社区资料汇编；阅读路径、历史分段和关系示意由编者整理。痛苦女士的身份、哀伤之日的真因等仍是谜团。</p></details><details><summary>插画与剧透</summary><p>AI 插画为艺术演绎，不能作为官方外貌或准确地理的依据。本百科包含设定历史、人物基础身份与冒险开场背景，可能构成剧透。</p></details></div><div class="section-title"><h3>来源目录</h3></div><ol class="source-list">'''
for k,x in S.items():
 H+=f'<li id="source-{k}"><b>{nums[k]:02d}</b><div><a href="{e(x["url"])}" target="_blank" rel="noopener noreferrer">{e(x["title"])} ↗</a><small>{e(x["kind"])}</small>{"<p>"+e(x["note"])+"</p>" if x["note"] else ""}</div></li>'
H+='''</ol><div class="note"><strong>文件说明：</strong>正文、样式、内容索引和 Three.js 均嵌入本文件，无需联网加载字体或脚本。外部来源链接需要联网。三维视图依赖浏览器的 WebGL 支持；不可用时保留静态分类与全部文字。Three.js 0.160.1 使用 MIT 许可，许可保留在 HTML 源码中。<br><br>本页为独立整理的非官方知识导览；Dungeons & Dragons 及相关世界、人物的权利归各权利人所有。</div></section><footer class="footer"><span>万界典藏 / D&D WORLD CODEX · 非官方知识导览</span><span>资料核对 2026.10.02 · 单文件离线插图版</span></footer></main></div><dialog id="entry-dialog" aria-labelledby="entry-title"><div class="dialog-top"><h2 id="entry-title">知识档案</h2><button class="close" aria-label="关闭知识档案" data-close="entry-dialog">×</button></div><div class="dialog-body" id="entry-content"></div></dialog><dialog id="search-dialog" aria-labelledby="search-title"><div class="dialog-top"><h2 id="search-title">搜索万界典藏</h2><button class="close" aria-label="关闭搜索" data-close="search-dialog">×</button></div><div class="dialog-body"><label for="search-input" class="eyebrow">名称 · 英文原名 · 内容关键词</label><input class="search-field" type="search" id="search-input" placeholder="试试：魔网、崔斯特、Netheril…" autocomplete="off"><p id="search-status" role="status" style="font-size:13px;margin:12px 0;color:#a4baaa">输入关键词，检索全部知识条目。</p><div class="search-results" id="search-results"></div></div></dialog><script id="codex-data" type="application/json">'''+json.dumps(D,ensure_ascii=False).replace('</','<\\/')+'''</script><script>'''+(root/'three.min.js').read_text().replace('</script','<\\/script')+'''</script><script>'''+(root/'search-ui.js').read_text()+'\n'+(root/'navigation.js').read_text()+'\n'+(root/'app.js').read_text()+'''</script><script>'''+(root/'cosmos.js').read_text()+'''</script></body></html>'''

if ART:
 H=H.replace('正文、样式、内容索引和 Three.js 均嵌入本文件','正文、样式、内容索引、插图和 Three.js 均嵌入本文件')
 H=H.replace('<strong>剧透范围：</strong>',f'<strong>插图说明：</strong>本次使用内置 imagegen 生图工具制作二次元魔幻风格概念插画。首批 {original_art_count} 幅创作于 2026-10-07，人物、地点与组织档案在 2026-10-17 补充完善。人物的服饰、神祇象征形态、城市建筑和构图均属艺术演绎，不能作为官方形象或准确地理证据。本次正文补充于 2026-10-17 核对，旧有资料的核对日期另行保留。<br><br><strong>剧透范围：</strong>')
 art_dialog='''<dialog id="art-dialog" aria-labelledby="art-title"><div class="dialog-top"><div><span class="eyebrow">ILLUSTRATED CODEX</span><h2 id="art-title">典藏插画</h2></div><button class="close" aria-label="关闭插画大图" data-close="art-dialog">×</button></div><figure class="art-stage"><img id="art-full" alt=""><figcaption id="art-caption"></figcaption></figure><div class="art-variant-line" id="art-variant-line" hidden><span id="art-variant-title"></span><small>左右切换姿态与服装 · 手机可左右滑动</small></div><div id="art-gallery-list" class="art-gallery-list" role="group" aria-label="选择人物插图" hidden></div><div class="art-dialog-bottom"><button class="plain" id="art-prev" aria-label="上一幅插画">← 上一幅</button><span id="art-counter" role="status"></span><button class="plain" id="art-next" aria-label="下一幅插画">下一幅 →</button><button class="primary" id="art-read">阅读档案 ↗</button></div></dialog>'''
 gallery_data={id:[{'title':a['title'],'note':a['note'],'src':'data:image/webp;base64,'+base64.b64encode((root/a['file']).read_bytes()).decode('ascii'),'alt':a['name']+' · '+a['title']} for a in assets] for id,assets in GALLERIES.items()}
 gallery_script='<script id="art-gallery-data" type="application/json">'+json.dumps(gallery_data,ensure_ascii=False).replace('</','<\\/')+'</script>'
 H=H.replace('<script id="codex-data"',art_dialog+gallery_script+'<script id="codex-data"')

if GALLERIES:
 total=sum(len(assets) for assets in GALLERIES.values())
 H=H.replace('人物的服饰、神祇象征形态、城市建筑和构图均属艺术演绎，',f'另为 {len(GALLERIES)} 位女性角色或女性化形象新增 {total} 幅系列插画，保留原始插画作为每组首图。新增服装及场景不是官方服装设定或已发生故事的记录；痛苦女士的真实身份仍保持未知。人物的服饰、神祇象征形态、城市建筑和构图均属艺术演绎，')

# Three.js license notice is kept inline for redistribution.
license='''<!-- Three.js (https://threejs.org) MIT License\nCopyright © 2010-2023 three.js authors\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n-->'''
H=H.replace('<script>'+ (root/'three.min.js').read_text()[:40],license+'<script>'+(root/'three.min.js').read_text()[:40])
from enhancements import enhance
H=enhance(H,D,root)

import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(H)
print('Saved:',len(H.encode()),'bytes')
