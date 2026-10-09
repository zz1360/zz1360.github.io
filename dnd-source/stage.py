"""Adapt the online codex to the approved DND world companion reader."""
from pathlib import Path
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
    figures = []
    encoder = shutil.which('cwebp') or '/opt/homebrew/bin/cwebp'
    for id, name in [('mystra','密斯特拉'), ('shar','莎尔')]:
        source = root/'assets/stage'/f'{id}.webp'
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        variants = []
        for width in [360, 724]:
            target = assets/f'companion-{id}-{digest[:16]}-w{width}.webp'
            if not target.exists():
                if width == 724: shutil.copy2(source, target)
                else: subprocess.run([encoder,'-quiet','-q','88','-alpha_q','100','-resize',str(width),'0',str(source),'-o',str(target)], check=True)
            variants.append({'width':width,'url':'/dnd/assets/'+target.name,'bytes':target.stat().st_size})
        srcset = ', '.join(f'{x["url"]} {x["width"]}w' for x in variants)
        # A tiny fallback prevents portrait downloads on narrow screens.
        blank = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='3'/%3E"
        figures.append(f'<figure class="goddess {id}" aria-label="{name}的艺术演绎"><picture><source media="(min-width:1101px)" srcset="{srcset}" sizes="18vw"><img class="goddess-art" src="{blank}" width="724" height="2172" alt="{name}的全身概念插画" decoding="async"></picture></figure>')
        records.append({'id':id,'sha256':digest,'variants':variants})
    rail = re.search(r'<aside class="rail">.*?</aside>',page,re.S)
    if not rail: raise ValueError('Codex navigation structure changed')
    nav = re.search(r'<nav class="nav".*?</nav>',rail[0],re.S)[0]
    page = page[:rail.start()]+page[rail.end():]
    old = re.search(r'<header class="topbar">.*?</header>',page,re.S)[0]
    tools = re.search(r'<div class="tools">.*?</div>',old,re.S)[0]
    tools = tools.replace('>⌕ 搜索百科 <kbd',' aria-label="搜索百科">⌕ <span class="search-label">搜索百科</span><kbd')
    chooser = '<select id="layout-select" aria-label="阅读布局"><option value="companions">女神伴读</option><option value="original">原始阅读</option></select>'
    tools = tools.replace('<div class="tools">','<div class="tools">'+chooser,1)
    brand = f'<a class="world-logo" href="#overview" aria-label="DND world · 阅览入口"><img class="world-emblem" src="{logo}" alt="" width="72" height="80"><span class="world-wordmark"><strong>DND</strong><small>world</small></span></a>'
    page = page.replace(old,'<header class="topbar">'+brand+nav+tools+'</header>',1)
    cap = '<div class="chamber-cap"><span><b>DND WORLD</b> / <span id="crumb">阅览入口</span></span><small>在此阅读</small></div>'
    page = page.replace('<main id="main">','<div class="stage">'+figures[0]+'<div class="reading-chamber">'+cap+'<main id="main" tabindex="0" aria-label="百科阅读区">',1)
    scrollbar = '<div class="reader-scrollbar" role="scrollbar" aria-label="中央阅读区滚动条" aria-controls="main" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><div class="scroll-thumb"></div></div>'
    page = page.replace('</main>','</main>'+scrollbar+'</div>'+figures[1]+'</div>',1)
    page = page.replace('</head>','<style>'+ (root/'stage.css').read_text()+'</style></head>',1)
    initial = """<script>(()=>{try{const p=JSON.parse(localStorage.getItem('dnd-world-appearance-v1')||'{}');document.body.classList.toggle('stage-mode',p.layout!=='original');document.body.classList.toggle('light',p.light===true)}catch{}})();</script>"""
    page = page.replace('<body>','<body class="stage-mode">'+initial,1)
    page = page.replace('</body>','<script>'+(root/'stage.js').read_text()+'</script></body>',1)
    page = page.replace('<title>D&D 世界百科 · 多元宇宙知识图谱</title>','<title>DND world · D&D 世界百科</title>',1)
    page = re.sub(r'<link rel="icon"[^>]*>',f'<link rel="icon" href="{logo}">',page,count=1)
    page = page.replace('搜索万界典藏','搜索 DND world').replace('万界典藏 / D&D WORLD CODEX · 非官方知识导览','DND world · 非官方知识导览')
    return page, {'logo':logo,'portraits':records,'appearanceKey':'dnd-world-appearance-v1'}
