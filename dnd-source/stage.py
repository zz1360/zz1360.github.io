"""Adapt the online codex to the approved DND world companion reader."""
from pathlib import Path
from html import escape
import hashlib, json, re, shutil, subprocess

def adapt(page, root, output):
    assets = Path(output)/'assets'
    assets.mkdir(parents=True, exist_ok=True)
    records = []
    def publish(path, name):
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        target = assets/(name+'-'+digest[:16]+path.suffix)
        if not target.exists(): shutil.copy2(path, target)
        return '/dnd/assets/'+target.name
    logo = publish(root/'assets/stage/world-emblem.svg', 'world-emblem')
    icon = publish(root/'assets/stage/world-icon.svg', 'world-icon')
    icon_png = publish(root/'assets/stage/world-icon-32.png', 'world-icon-32')
    icon_ico = publish(root/'assets/stage/world-icon.ico', 'world-icon')
    catalog = json.loads((root/'companions.json').read_text())
    encoder = shutil.which('cwebp') or '/opt/homebrew/bin/cwebp'
    for character in catalog:
        id, name = character['id'], character['name']
        if not re.fullmatch(r'[a-z]+',id): raise ValueError('Invalid companion ID')
        source = root/'assets/stage'/f'{id}.webp'
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        variants = []
        for width in [120, 360, 724]:
            target = assets/f'companion-{id}-{digest[:16]}-w{width}.webp'
            if not target.exists():
                if width == 724: shutil.copy2(source, target)
                else: subprocess.run([encoder,'-quiet','-q','88','-alpha_q','100','-resize',str(width),'0',str(source),'-o',str(target)], check=True)
            variants.append({'width':width,'url':'/dnd/assets/'+target.name,'bytes':target.stat().st_size})
        records.append({**character,'sha256':digest,'variants':variants})
    # Sources are set by the controller after reading the saved choices. This
    # avoids downloading the default pair before a previously chosen pair.
    blank = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='3'/%3E"
    def figure(side,id,name):
        label = '左侧' if side == 'left' else '右侧'
        return f'<figure class="goddess {id}" data-side="{side}" data-character="{id}" aria-label="{escape(name)}的艺术演绎"><picture><source media="(min-width:1101px)" sizes="18vw"><img class="goddess-art" src="{blank}" width="724" height="2172" alt="{escape(name)}的全身概念插画" decoding="async"></picture><div class="companion-controls"><button class="companion-step previous" data-direction="-1" aria-label="{label}上一位人物">‹</button><button class="companion-choose" aria-label="选择{label}人物" title="选择{label}人物">◇</button><button class="companion-step next" data-direction="1" aria-label="{label}下一位人物">›</button></div></figure>'
    figures = [figure('left','mystra','密斯特拉'),figure('right','shar','莎尔')]
    rail = re.search(r'<aside class="rail">.*?</aside>',page,re.S)
    if not rail: raise ValueError('Codex navigation structure changed')
    nav = re.search(r'<nav class="nav".*?</nav>',rail[0],re.S)[0]
    page = page[:rail.start()]+page[rail.end():]
    old = re.search(r'<header class="topbar">.*?</header>',page,re.S)[0]
    tools = re.search(r'<div class="tools">.*?</div>',old,re.S)[0]
    tools = tools.replace('>⌕ 搜索百科 <kbd',' aria-label="搜索百科">⌕ <span class="search-label">搜索百科</span><kbd')
    chooser = '<select id="layout-select" aria-label="阅读布局"><option value="companions">人物伴读</option><option value="original">原始阅读</option></select>'
    tools = tools.replace('<div class="tools">','<div class="tools">'+chooser+'<button id="companion-picker" class="plain" aria-haspopup="dialog" aria-controls="companion-dialog">人物</button>',1)
    brand = f'<a class="world-logo" href="#overview" aria-label="DND world · 阅览入口"><img class="world-emblem" src="{logo}" alt="" width="72" height="80"><span class="world-wordmark"><strong>DND</strong><small>world</small></span></a>'
    page = page.replace(old,'<header class="topbar">'+brand+nav+tools+'</header>',1)
    cap = '<div class="chamber-cap"><span><b>DND WORLD</b> / <span id="crumb">阅览入口</span></span><small>在此阅读</small></div>'
    page = page.replace('<main id="main">','<div class="stage">'+figures[0]+'<div class="reading-chamber">'+cap+'<main id="main" tabindex="0" aria-label="百科阅读区">',1)
    scrollbar = '<div class="reader-scrollbar" role="scrollbar" aria-label="中央阅读区滚动条" aria-controls="main" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><div class="scroll-thumb"></div></div>'
    page = page.replace('</main>','</main>'+scrollbar+'</div>'+figures[1]+'</div>',1)
    page = page.replace('</head>','<style>'+ (root/'stage.css').read_text()+(root/'companions.css').read_text()+'</style></head>',1)
    initial = """<script>(()=>{window.dndWorldAppearance={};try{const p=JSON.parse(localStorage.getItem('dnd-world-appearance-v1')||'{}');window.dndWorldAppearance=p&&typeof p==='object'&&!Array.isArray(p)?p:{};document.body.classList.toggle('stage-mode',window.dndWorldAppearance.layout!=='original');document.body.classList.toggle('light',window.dndWorldAppearance.light===true)}catch{}})();</script>"""
    page = page.replace('<body>','<body class="stage-mode">'+initial,1)
    cards = ''.join(f'<button class="companion-option" data-character="{x["id"]}" aria-pressed="false"><img data-src="{x["variants"][0]["url"]}" alt="" width="120" height="360" decoding="async" loading="lazy"><strong>{escape(x["name"])}</strong><small>{escape(x["label"])}</small></button>' for x in records)
    dialog = '<dialog id="companion-dialog" aria-labelledby="companion-title"><div class="dialog-top"><h3 id="companion-title">选择伴读人物</h3><button class="close" data-close="companion-dialog" aria-label="关闭人物选择">×</button></div><div class="companion-settings"><div class="companion-sides" role="group" aria-label="要更换的位置"><button class="plain" data-pick-side="left" aria-pressed="true">左侧人物</button><button class="plain" data-pick-side="right" aria-pressed="false">右侧人物</button></div><p id="companion-summary"></p><div class="companion-options">'+cards+'</div><p id="companion-dialog-status" role="status" aria-live="polite"></p><button id="companion-reset" class="plain">恢复密斯特拉与莎尔</button><p class="small-copy">AI 概念插画 · 艺术演绎</p></div></dialog><span id="companion-status" class="companion-status" role="status" aria-live="polite"></span>'
    data = '<script type="application/json" id="companion-data">'+json.dumps(records,ensure_ascii=False).replace('<','\\u003c')+'</script>'
    page = page.replace('</body>',dialog+data+'<script>'+(root/'stage.js').read_text()+'</script><script>'+(root/'companions.js').read_text()+'</script></body>',1)
    page = page.replace('<title>D&D 世界百科 · 多元宇宙知识图谱</title>','<title>DND world · D&D 世界百科</title>',1)
    icons = f'<link rel="icon" type="image/x-icon" sizes="16x16 32x32 48x48" href="{icon_ico}"><link rel="icon" type="image/png" sizes="32x32" href="{icon_png}"><link rel="icon" type="image/svg+xml" sizes="any" href="{icon}">'
    page = re.sub(r'<link rel="icon"[^>]*>',icons,page,count=1)
    page = page.replace('搜索万界典藏','搜索 DND world').replace('万界典藏 / D&D WORLD CODEX · 非官方知识导览','DND world · 非官方知识导览')
    return page, {'logo':logo,'icon':icon,'portraits':records,'appearanceKey':'dnd-world-appearance-v1'}
