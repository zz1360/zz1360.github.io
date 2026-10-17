"""Assemble the exploration tools; knowledge is kept in separate JSON files."""
import json,re

def enhance(page,data,root):
    entries={x['id']:x for k in ['worlds','planes','history','people','locations','factions','terms','reference_worlds'] for x in data.get(k,[])}
    relations=json.loads((root/'relations.json').read_text())
    flows=json.loads((root/'history-flow.json').read_text())
    for r in relations:
        assert r['a'] in entries and r['b'] in entries and all(k in data['sources'] for k in r['src'])
    assert set(flows)=={x['id'] for x in data['history']}
    def script(id,obj):return '<script type="application/json" id="'+id+'">'+json.dumps(obj,ensure_ascii=False).replace('</','<\\/')+'</script>'
    extra=script('relations-data',relations)+script('history-flow-data',flows)
    extra+='''<dialog id="share-dialog" aria-labelledby="share-title"><div class="dialog-top"><h2 id="share-title">分享此条目</h2><button class="close" data-close="share-dialog" aria-label="关闭分享">×</button></div><div class="dialog-body"><label for="share-url">复制下面的直达链接</label><input class="search-field" id="share-url" readonly><p class="small-copy">链接会保留条目或当前插画的位置。离线文件的地址仅适用于本机；公开分享请使用博客网址。</p></div></dialog><div id="codex-notice" role="status" aria-live="polite" hidden></div>'''
    page=page.replace('<script id="codex-data"',extra+'<script id="codex-data"',1)
    page=page.replace('</head>','<style>'+(root/'explore.css').read_text()+(root/'archive-ui.css').read_text()+(root/'search-ui.css').read_text()+(root/'ui-feedback.css').read_text()+'</style></head>',1)
    page=page.replace('</body>','<script>'+(root/'explore.js').read_text()+'</script><script>'+(root/'ui-feedback.js').read_text()+'</script></body>',1)
    page=page.replace('<figure class="art-stage">','<div id="art-tools" class="entry-tools"></div><figure class="art-stage">',1)
    page=page.replace('单文件离线插图版</span>','界面更新 2026.10.17 · 离线插图版</span>')
    from works import catalogue,reader
    page=catalogue(page,root)
    page=reader.codex(page,root)
    page=page.replace("</head>","<style>"+(root/"works.css").read_text()+"</style></head>",1)
    return page
