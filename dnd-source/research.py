"""Render the supplied novel research manuscript, separately from verified SRD notes."""
from pathlib import Path
from html import escape
import hashlib,json,re

def inline(text):
    # Escape first: manuscript HTML can never become active markup.
    parts=re.split(r'(`[^`]+`)',text)
    result=[]
    for part in parts:
        if part.startswith('`') and part.endswith('`'):
            result.append('<code>'+escape(part[1:-1])+'</code>');continue
        safe=escape(part)
        safe=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',safe)
        safe=re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)',r'<em>\1</em>',safe)
        result.append(safe)
    return ''.join(result)

def markdown(text,label):
    """The manuscript uses headings, prose, lists, quotes, tables and fenced code."""
    lines=text.splitlines();out=[];i=0
    def cells(line):return [c.strip() for c in line.strip().strip('|').split('|')]
    def divider(line):return line.lstrip().startswith('|') and all(re.fullmatch(r':?-{3,}:?',c) for c in cells(line))
    while i<len(lines):
        line=lines[i].strip()
        if not line:i+=1;continue
        if line.startswith('```'):
            code=[];i+=1
            while i<len(lines) and not lines[i].strip().startswith('```'):code.append(lines[i]);i+=1
            out.append('<pre><code>'+escape('\n'.join(code))+'</code></pre>');i+=1;continue
        if line.startswith('|') and i+1<len(lines) and divider(lines[i+1]):
            headers=cells(line);rows=[];i+=2
            while i<len(lines) and lines[i].strip().startswith('|'):
                row=cells(lines[i]);assert len(row)==len(headers),'Research table shape changed'
                rows.append(row);i+=1
            out.append('<div class="research-table" role="region" tabindex="0" aria-label="'+escape(label,quote=True)+' · 对照表"><table><thead><tr>'+''.join('<th scope="col">'+inline(c)+'</th>' for c in headers)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+inline(c)+'</td>' for c in row)+'</tr>' for row in rows)+'</tbody></table></div>');continue
        heading=re.match(r'^(#{3,6})\s+(.+)',line)
        if heading:
            level=min(len(heading[1])+1,6);out.append(f'<h{level}>'+inline(heading[2])+f'</h{level}>');i+=1;continue
        if line.startswith('>'):
            quote=[]
            while i<len(lines) and lines[i].strip().startswith('>'):
                quote.append(re.sub(r'^>\s?','',lines[i].strip()));i+=1
            out.append('<blockquote><p>'+inline(' '.join(quote))+'</p></blockquote>');continue
        list_match=re.match(r'^(?:[-*]\s+|\d+\.\s+)(.+)',line)
        if list_match:
            ordered=bool(re.match(r'^\d+\.',line));tag='ol' if ordered else 'ul';items=[]
            while i<len(lines):
                m=re.match(r'^\d+\.\s+(.+)' if ordered else r'^[-*]\s+(.+)',lines[i].strip())
                if not m:break
                items.append('<li>'+inline(m[1])+'</li>');i+=1
            out.append('<'+tag+'>'+''.join(items)+'</'+tag+'>');continue
        paragraph=[line];i+=1
        while i<len(lines) and lines[i].strip() and not re.match(r'^(?:#{2,6}\s|>|[-*]\s|\d+\.\s|\||```)',lines[i].strip()):paragraph.append(lines[i].strip());i+=1
        out.append('<p>'+inline(' '.join(paragraph))+'</p>')
    return ''.join(out)

def load(root):
    folder=root/'works/yinhun/research';raw=(folder/'source.txt').read_bytes();meta=json.loads((folder/'index.json').read_text())
    assert hashlib.sha256(raw).hexdigest()==meta['sourceSha256'],'Imported research manuscript changed; review provenance first'
    text=raw.decode('utf-8');chunks=re.split(r'^##\s+(.+)\s*$',text,flags=re.M)
    assert len(chunks[1:])==len(meta['sections'])*2,'Research section catalogue needs updating'
    parts=[]
    for index,section in enumerate(meta['sections']):
        title,body=chunks[1+index*2:3+index*2]
        parts.append(dict(section,title=title.strip(),html=markdown(body,title)))
    return meta,parts

def render(root):
    meta,parts=load(root);e=lambda s:escape(str(s),quote=True)
    notes={x['section']:x['text'] for x in meta['notes']}
    checks=''.join('<article class="research-check" id="research-check-'+e(x['id'])+'"><span class="research-check-label">已复核 · '+e(x['label'])+'</span><h4>'+e(x['title'])+'</h4><p>'+e(x['text'])+'</p><a class="source-btn" href="'+e(x['url'])+'" target="_blank" rel="noopener noreferrer">'+e(x['source'])+' ↗</a></article>' for x in meta['checks'])
    toc=''.join('<a href="#research/'+x['id']+'" data-research-topic="'+x['id']+'"><span>'+str(i+1).zfill(2)+'</span>'+e(x['label'])+'</a>' for i,x in enumerate(parts))
    articles=[]
    for i,x in enumerate(parts):
        note='<aside class="research-annotation"><strong>整合校注</strong><p>'+e(notes[x['id']])+'</p></aside>' if x['id'] in notes else ''
        articles.append('<details class="research-topic" id="research-topic-'+x['id']+'" data-research-id="'+x['id']+'"><summary><span class="research-number">'+str(i+1).zfill(2)+'</span><span><span class="research-topic-label">'+e(x['status'])+'</span><h3>'+e(x['title'])+'</h3></span><span class="research-expand" aria-hidden="true">＋</span></summary><div class="research-prose">'+note+x['html']+'</div></details>')
    return '''<section class="section research-section" id="research" aria-labelledby="research-title"><header class="research-heading"><div><span class="eyebrow">LORE &amp; ADAPTATION</span><h2 id="research-title">设定考据</h2></div><span class="research-edition">D&amp;D 3.0 / 3.5</span></header><p class="research-lead">哪些来自规则与费伦历史，哪些是小说的重新演绎。</p><a class="source-btn research-full-link" id="research-full-link" href="#research-complete" hidden>阅读考据全文 ↓</a><div class="research-origin"><strong>阅读范围</strong><p>根据所收录的考据稿整理，文本范围至第十四卷东域篇（下）·第十一章《各人的心思》。未完伏笔不按既成结局处理。</p><p>“原创”“借鉴”等归属判断沿用原稿分析；本次核实的规则另附链接。小说章节与未取得的原书页码保留待核对。</p></div><h3 class="research-subtitle">先看规则对照</h3><p class="reader-note">以下只谈规则，不揭示小说反转。SRD 链接为公开转载页面，不是 Wizards 官网。</p><div class="research-checks">'''+checks+'''</div><div class="research-locked" id="research-locked"><span aria-hidden="true">◇</span><div><h3>完整考据含后续剧情</h3><p>当前只展示基础对照。切换到“允许完整剧透”后，可阅读七秘器、魔网理论、人物关系及后期剧情的完整分析。</p><button type="button" class="btn" data-research-settings>前往阅读设置 ↑</button></div></div><div class="research-complete" id="research-complete" hidden><div class="research-document-head"><h3>考据全文</h3><span>原稿分析 · 已标注校注</span></div><nav class="research-toc" aria-label="考据主题">'''+toc+'''</nav><div class="research-find"><label for="research-query">查找主题</label><input id="research-query" type="search" placeholder="七秘器、分裂命匣、魔网…" autocomplete="off"><button class="source-btn" data-research-clear>重置</button><span id="research-count" role="status">10 个主题</span></div><p id="research-empty" class="reader-note" hidden>没有匹配的主题。</p><div class="research-topics">'''+''.join(articles)+'''</div><footer class="research-provenance"><h4>来源与核验范围</h4><p>原稿：《阴魂_DND官方设定与作者原创考据》。整合日期：2026-10-26。保留原稿全部十个主题、表格与对照书目；校注与本次公开规则核对单列。</p><p>本次未重新取得 EPUB 全文，也未逐页核读原稿列出的全部设定书。跨作品相似性属于互文线索，未确认作者的实际创作来源。</p></footer></div><p class="reader-status" id="research-status" role="status" aria-live="polite"></p></section>'''
