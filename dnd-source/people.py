"""One setting scope, with local role and name filters."""
from html import escape

CROSSWORLD = {'mordenkainen', 'tasha', 'vecna', 'strahd', 'lady', 'raistlin', 'tanis', 'blades'}

def render(people, card, split=False):
    local = [x for x in people if not split or x['id'] not in CROSSWORLD]
    guests = [x for x in people if split and x['id'] in CROSSWORLD]
    roles = list(dict.fromkeys(x['role'] for x in people))
    e = lambda s: escape(str(s), quote=True)
    buttons = '<button class="chip active" data-person-role="all" aria-pressed="true">全部类别</button>'
    buttons += ''.join(f'<button class="chip" data-person-role="{e(r)}" aria-pressed="false">{e(r)}</button>' for r in roles)
    controls = '<div class="people-controls"><div class="people-roles" role="group" aria-label="角色类别">'+buttons+'</div><div class="people-search"><label class="setting-label" for="person-query">查找人物</label><input type="search" id="person-query" placeholder="姓名 / 英文名" autocomplete="off"><button class="plain" id="reset-people">重置</button><span id="people-count" role="status">'+str(len(local))+' 个档案</span></div></div>'
    grid = '<div class="grid" id="people-grid">'+''.join(card(x,i) for i,x in enumerate(local))+'</div>'
    if guests:
        grid += '<details class="people-crossworld" id="people-crossworld"><summary>跨界人物 <span id="crossworld-count">'+str(len(guests))+'</span></summary><div class="grid" id="crossworld-grid">'+''.join(card(x,i) for i,x in enumerate(guests))+'</div></details>'
    return controls+grid+'<p id="people-empty" class="empty" hidden>没有找到匹配的人物。</p>'
