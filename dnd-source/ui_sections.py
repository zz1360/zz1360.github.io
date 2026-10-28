"""Concise list surfaces; full entries and sources remain in the existing dialogs."""
from html import escape

def e(value):return escape(str(value),quote=True)

def archive_card(x,figure='',person=False):
    kind=x.get('role') if person else x.get('tag',x.get('kind','知识档案'))
    return (f'<article class="card clean-card {"person-card" if person else ""}{" illustrated-card" if figure else ""}" '
            f'id="entry-{e(x["id"])}" data-entry="{e(x["id"])}">'+figure+
            f'<button type="button" class="clean-card-open" data-open="{e(x["id"])}" aria-label="查看{e(x["name"])}档案">'
            f'<span class="index">{e(kind or "知识档案")}</span><span class="clean-card-title">{e(x["name"])}</span>'
            f'<span class="en">{e(x["en"])}</span><span class="clean-card-summary">{e(x["body"])}</span>'
            '<span class="clean-card-action" aria-hidden="true">查看档案 ↗</span></button></article>')

def history_item(x):
    return (f'<article class="time-event" id="entry-{e(x["id"])}" data-entry="{e(x["id"])}">'
            f'<div class="time-date">{e(x["date"])}<small>{e(x["era"])}</small></div>'
            f'<button type="button" class="time-body time-summary" data-open="{e(x["id"])}">'
            f'<span class="history-name">{e(x["name"])}</span><span class="en">{e(x["en"])}</span>'
            f'<span class="history-summary">{e(x["body"])}</span><span class="history-action">查看事件 ↗</span></button></article>')

def terms(entries,ref):
    rows=[]
    for x in entries:
        detail=''.join(f'<h4>{e(a)}</h4><p>{e(b)}</p>' for a,b in x['details'])
        rows.append(f'<details class="term-row" data-entry="{e(x["id"])}" id="entry-{e(x["id"])}"><summary><span><strong>{e(x["name"])}</strong><small>{e(x["en"])}</small></span><span class="term-short">{e(x["body"])}</span></summary><div class="term-content">{detail}{ref(x["src"])}<button type="button" class="entry-open" data-open="{e(x["id"])}">查看档案 ↗</button></div></details>')
    return '<div class="terms-toolbar"><label for="term-query">查找术语</label><input id="term-query" type="search" placeholder="名称 / 英文名" autocomplete="off"><span id="term-count" role="status">'+str(len(entries))+' 个词条</span></div><div class="term-list" id="term-list">'+''.join(rows)+'</div><p class="empty" id="term-empty" hidden>没有找到匹配的术语。</p>'


def place_directory(entries,figure):
    rows=[]
    for x in entries:
        rows.append(f'<div class="place-row" id="entry-{e(x["id"])}" data-entry="{e(x["id"])}"><div hidden>'+figure(x)+f'</div><button type="button" data-open="{e(x["id"])}"><span><strong>{e(x["name"])}</strong><small>{e(x["en"])}</small></span><span aria-hidden="true">↗</span></button></div>')
    return '<details class="place-directory"><summary>地点目录 <span>查看全部地点</span></summary><div class="place-rows">'+''.join(rows)+'</div></details>'
