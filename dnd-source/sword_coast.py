"""Illustrated Faerûn overview, with independent accessible map controls."""
from html import escape
from pathlib import Path
import base64

# Artistic approximation of the approved illustration, not a geographic projection.
POINTS = [
    ('icewind', 27, 9), ('neverwinter', 29, 19), ('phandalin', 36, 23),
    ('waterdeep', 32, 31), ('baldurs', 37, 49), ('candlekeep', 32, 59),
    ('moonshae', 20, 40), ('anauroch', 53, 24), ('cormyr', 58, 49),
    ('dalelands', 70, 37), ('thay', 91, 49), ('fallen-stars', 78, 55),
    ('chult', 26, 91), ('high-ice', 52, 6), ('great-glacier', 82, 10),
]
REGIONS = [
    ('moonshae','月影群岛'), ('anauroch','安诺瑞沙漠'), ('cormyr','科米尔'),
    ('dalelands','谷地'), ('thay','塞尔'), ('fallen-stars','坠星海'),
    ('chult','楚尔特'), ('high-ice','至高冰原'), ('great-glacier','大冰川'),
]

def render(data):
    entries = {x['id']:x['name'] for x in data['locations']}
    entries.update(REGIONS)
    src='data:image/png;base64,'+base64.b64encode((Path(__file__).parent/'assets/maps/faerun-1492-concept.png').read_bytes()).decode('ascii')
    markers=''.join(f'<button type="button" class="faerun-pin" style="left:{x}%;top:{y}%" data-map="{id}" aria-label="{escape(entries[id])}" aria-pressed="false"><span aria-hidden="true"></span><b>{escape(entries[id])}</b></button>' for id,x,y in POINTS)
    groups=[('剑湾与北地',['icewind','neverwinter','phandalin','waterdeep','baldurs','candlekeep']),('大陆其他地区',[id for id,_ in REGIONS]),('地下',['underdark','menzo'])]
    indexes=''.join('<div class="faerun-group"><span>'+title+'</span><div>'+''.join(f'<button type="button" class="chip" data-map="{id}" aria-pressed="false">{escape(entries[id])}</button>' for id in ids)+'</div></div>' for title,ids in groups)
    return ('<section class="map-explorer faerun-explorer" aria-labelledby="map-title"><div class="map-heading"><div><span class="faerun-kicker">THE FORGOTTEN REALMS · FAERÛN</span><h3 id="map-title">费伦大陆</h3></div><a href="https://www.dndbeyond.com/resources/1782-map-of-faerun" target="_blank" rel="noopener noreferrer">官方地图 ↗</a></div><div class="faerun-layout"><div class="faerun-map-scroll" role="region" tabindex="0" aria-label="费伦地图，可横向滚动"><div class="faerun-map"><img src="'+src+'" alt="费伦大陆奇幻风格概念地图，地形与位置为艺术示意" width="1484" height="1060" draggable="false">'+markers+'</div></div><article class="map-preview faerun-preview" id="map-preview" aria-live="polite" aria-atomic="true"></article></div><div class="faerun-index" aria-label="地点索引">'+indexes+'</div><p class="faerun-note">地图可左右滑动 · 地形与位置为艺术示意<br>地图参考：<a href="https://www.aidedd.org/atlas/faerun" target="_blank" rel="noopener noreferrer">AideDD ↗</a> · <a href="https://www.patreon.com/Johnovick/about" target="_blank" rel="noopener noreferrer">Johnovick · 1492 DR ↗</a></p></section>')
