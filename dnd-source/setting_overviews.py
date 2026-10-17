"""Setting-local visual introductions; diagram coordinates are never map coordinates."""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
import base64, hashlib, json, shutil, subprocess

ICONS={
 'globe':'<circle cx="32" cy="32" r="22"/><ellipse cx="32" cy="32" rx="10" ry="22"/><path d="M11 25h42M11 39h42M32 10v44"/>',
 'land':'<path d="m17 15 12-4 8 8 10 1 5 12-10 4-4 15-12 4-5-9-10-4 4-13-4-8z"/><path d="m24 24 7 8 11-3M31 32l-4 12"/><circle cx="31" cy="32" r="3"/>',
 'compass':'<circle cx="32" cy="32" r="22"/><path d="m32 12 7 20-7 20-7-20zM12 32l20-7 20 7-20 7zM32 4v5M32 55v5M4 32h5M55 32h5"/>',
 'castle':'<path d="M10 52h44M15 52V30h12v22M38 52V24h11v28M25 52V17h14v35M29 17V9h6v8M12 30l9-12 9 12M36 24l8-13 8 13M29 52V39h6v13M19 34v7M43 30v8M31 23v8"/>',
 'sun':'<circle cx="32" cy="32" r="12"/><circle cx="32" cy="32" r="20" stroke-dasharray="2 6"/><path d="M32 5v7M32 52v7M5 32h7M52 32h7M13 13l5 5M46 46l5 5M13 51l5-5M46 18l5-5"/>',
 'moon':'<path d="M44 12a22 22 0 1 0 8 34A23 23 0 0 1 44 12z"/><path d="m42 31 3-7 3 7 7 3-7 3-3 7-3-7-7-3z"/>',
 'spark':'<path d="m32 6 6 18 18 8-18 6-6 20-7-20-19-6 19-8zM47 9v9M43 13h9M11 47v9M7 51h9"/>',
 'seal':'<path d="m32 7 21 12v26L32 57 11 45V19zM11 19l21 13 21-13M32 7v25m0 25V32M11 45l21-13 21 13"/>',
 'portal':'<ellipse cx="32" cy="32" rx="17" ry="24"/><ellipse cx="32" cy="32" rx="12" ry="19"/><path d="M8 55h48M20 48V27a12 12 0 0 1 24 0v21M32 3v6M28 6h8"/>',
 'gates':'<path d="M8 54h48M13 54V24h16v30M35 54V17h16v37M10 24l11-11 11 11M32 17 43 5l11 12M18 54V35a3 3 0 0 1 6 0v19M40 54V29a3 3 0 0 1 6 0v25"/>',
 'wheel':'<circle cx="32" cy="32" r="23"/><circle cx="32" cy="32" r="8"/><path d="M32 9v15M32 40v15M9 32h15M40 32h15M16 16l11 11M37 37l11 11M16 48l11-11M37 27l11-11"/>'
}
def icon(name):
    return '<svg class="setting-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+ICONS[name]+'</svg>'

def configurations(root):return json.loads((root/'setting-overviews.json').read_text())

def embedded_scene(root,config):
    artwork=next(x for x in json.loads((root/'art-manifest.json').read_text()) if x['id']==config['sceneEntry'])
    src='data:image/webp;base64,'+base64.b64encode((root/artwork['file']).read_bytes()).decode()
    return dict(src=src,full=src)

def published_scenes(root,output,base):
    class Images(HTMLParser):
        def __init__(self):super().__init__();self.items={}
        def handle_starttag(self,tag,attrs):
            attrs=dict(attrs)
            if tag=='img' and attrs.get('id','').startswith('art-'):self.items[attrs['id'][4:]]=attrs
    parser=Images();parser.feed(base);result={}
    dest=Path(output)/'assets';encoder=shutil.which('cwebp') or '/opt/homebrew/bin/cwebp'
    for key,config in configurations(root).items():
        if config.get('sceneEntry'):
            im=parser.items[config['sceneEntry']]
            result[key]=dict(src=im['src'],full=im['data-full'],srcset=im['data-srcset'])
            continue
        source=root/config['sceneFile'];digest=hashlib.sha256(source.read_bytes()).hexdigest();variants=[]
        for width in [640,960,1536]:
            file=dest/f'overview-{key}-{digest[:16]}-w{width}-q84-v1.webp'
            if not file.exists():
                if width==1536:shutil.copy2(source,file)
                else:subprocess.run([encoder,'-quiet','-q','84','-resize',str(width),'0',str(source),'-o',str(file)],check=True)
            variants.append(dict(width=width,url='/dnd/assets/'+file.name,sha256=hashlib.sha256(file.read_bytes()).hexdigest(),bytes=file.stat().st_size))
        result[key]=dict(src=variants[1]['url'],full=variants[2]['url'],srcset=', '.join(f'{x["url"]} {x["width"]}w' for x in variants),variants=variants)
    return result

def render(root,key,data,scene=None):
    config=configurations(root)[key];scene=scene or embedded_scene(root,config)
    e=lambda value:escape(str(value),quote=True)
    entries={x['id']:x for group in ['worlds','planes','history','people','locations','factions','terms'] for x in data[group]}
    sources=data['sources'];numbers={id:i+1 for i,id in enumerate(sources)}
    nodes={x['id']:x for x in config['nodes']};parts=[];templates=[];fallback=[]
    def refs(ids):
        assert all(id in sources for id in ids)
        return '<details class="setting-note-sources"><summary>资料来源</summary>'+''.join(f'<a href="{e(sources[id]["url"])}" target="_blank" rel="noopener noreferrer">[{numbers[id]:02d}] {e(sources[id]["title"])} ↗</a>' for id in dict.fromkeys(ids))+'</details>'
    for node in config['nodes']:
        assert node['icon'] in ICONS and node['entry'] in entries
        entry=entries[node['entry']];summary=node.get('summary',entry['body']);ids=node.get('src',entry['src']);action=node['action']
        if 'entry' in action:
            assert action['entry'] in entries
            link=f'<button type="button" class="plain" data-open="{e(action["entry"])}">{e(action["label"])} ↗</button>'
        else:
            assert action['section'] in ['history','atlas','cosmos','primer','people']
            link=f'<a class="plain" href="#{e(action["section"])}">{e(action["label"])} →</a>'
        note=f'<span class="setting-note-kind">{e(node["kind"])}</span><h3 tabindex="-1">{e(node["name"])} <small>{e(node["en"])}</small></h3><p>{e(summary)}</p><div class="setting-note-actions">{link}{refs(ids)}</div>'
        templates.append(f'<template id="setting-note-{e(node["id"])}">'+note+'</template>')
        fallback.append('<details><summary>'+e(node['name'])+'</summary>'+note+'</details>')
        parts.append(f'<button type="button" class="setting-node'+(' is-branch' if node.get('branch') else ' is-primary')+f'" data-setting-node="{e(node["id"])}" style="--node-x:{node["x"]}%;--node-y:{node["y"]}%" aria-expanded="false" aria-controls="setting-note-panel"><span class="setting-node-mark">'+icon(node['icon'])+f'</span><span class="setting-node-copy"><small>{e(node["kind"])}</small><strong>{e(node["name"])}</strong><span>{e(node["en"])}</span></span></button>')
    paths=[]
    for start,end,kind in config['links']:
        a,b=nodes[start],nodes[end];x1,y1,x2,y2=a['x']*10,a['y']*5.2,b['x']*10,b['y']*5.2
        path=f'M{x1} {y1} C{(x1+x2)/2} {y1} {(x1+x2)/2} {y2} {x2} {y2}'
        paths.append(f'<path class="setting-link {kind}" d="{path}"/>')
    picture=f'<img class="setting-scene" src="{e(scene["src"])}"'+(f' srcset="{e(scene["srcset"])}" sizes="(max-width:1100px) 95vw, 65vw"' if scene.get('srcset') else '')+f' width="1536" height="1024" alt="{e(config["sceneLabel"])}" loading="lazy" decoding="async">'
    board='<figure class="setting-figure"><div class="setting-board" data-structure="'+e(config['layout'])+'">'+picture+'<div class="setting-board-shade" aria-hidden="true"></div><div class="setting-tracery" aria-hidden="true"></div><svg class="setting-links" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">'+''.join(paths)+'</svg><div class="setting-nodes" role="group" aria-label="'+e(config['title'])+'的舞台结构，点击节点展开介绍">'+''.join(parts)+'</div></div><figcaption><span>结构示意 · 非地理地图</span><button type="button" class="setting-scene-launch" aria-haspopup="dialog" aria-controls="setting-scene-dialog" aria-label="查看完整'+e(config['sceneLabel'])+'插画">场景原画 ↗</button></figcaption></figure>'
    topics='<ul class="setting-topics" aria-label="世界气质">'+''.join('<li>'+icon(i)+'<span>'+e(label)+'</span></li>' for i,label in config['topics'])+'</ul>'
    panel='<aside class="setting-note-panel" id="setting-note-panel" aria-label="舞台节点介绍" hidden><button type="button" class="setting-note-close" aria-label="收起节点介绍">×</button><div id="setting-note-body"></div></aside>'
    scene_dialog='<dialog id="setting-scene-dialog" class="setting-scene-dialog" aria-labelledby="setting-scene-title"><div class="dialog-top"><h2 id="setting-scene-title">'+e(config['sceneLabel'])+'</h2><button type="button" class="close" data-setting-scene-close aria-label="关闭场景原画">×</button></div><figure><p role="status" id="setting-scene-status">正在展开原画…</p><img data-full="'+e(scene['full'])+'" width="1536" height="1024" alt="'+e(config['sceneLabel'])+'" decoding="async"><figcaption>AI 概念插画 · 艺术演绎，不作为准确地理或官方建筑形象的依据。</figcaption></figure></dialog>'
    return '<section class="chapter setting-overview" id="worlds" data-setting-overview="'+key+'"><header class="setting-heading"><div><span class="eyebrow">01 / SETTING OVERVIEW</span><h2>'+e(config['title'])+'</h2></div></header>'+board+topics+panel+''.join(templates)+scene_dialog+'<noscript><div class="setting-static-notes">'+''.join(fallback)+'</div></noscript></section>'
