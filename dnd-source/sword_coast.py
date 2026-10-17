"""An original vector chart, with HTML landmarks for keyboard and touch."""
from html import escape

POINTS=[('icewind',56,14),('neverwinter',47,34),('phandalin',75,43),('waterdeep',43,58),('baldurs',49,77),('candlekeep',46,92)]

def render(data):
    entries={x['id']:x for x in data['locations']}
    coast='M430-15 C421 30 448 50 420 86 L401 112 414 145 388 169 385 195 363 220 374 246 347 263 351 290 332 311 349 331 337 354 352 373 323 394 329 416 306 437 314 457 301 478 321 505 313 528 336 548 327 576 346 597 339 618 363 638 351 659 367 684 348 707 360 730 337 753 344 783 326 811 332 855 L740 855V-15Z'
    mountains=''.join(f'<use href="#chart-mountain" x="{x}" y="{y}" transform="rotate({r} {x} {y})"/>' for x,y,r in [(450,90,-8),(493,100,3),(530,85,-5),(568,100,7),(605,87,0),(635,112,9),(513,215,4),(540,235,0),(605,440,5),(635,462,-5),(585,620,-6),(625,649,5),(590,681,0)])
    trees=''.join(f'<use href="#chart-tree" x="{x}" y="{y}"/>' for x,y in [(463,292),(482,270),(502,300),(520,277),(538,307),(464,323),(492,334),(523,332),(547,345),(529,363),(512,520),(536,505),(557,535),(531,550),(560,566),(579,548)])
    svg=f'''<svg viewBox="0 0 720 840" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="chart-ocean" x2="1" y2="1"><stop stop-color="var(--sea-near)"/><stop offset="1" stop-color="var(--sea-deep)"/></linearGradient>
    <linearGradient id="chart-ground" x2=".7" y2="1"><stop stop-color="var(--land-high)"/><stop offset="1" stop-color="var(--land-low)"/></linearGradient>
    <radialGradient id="chart-light"><stop stop-color="var(--chart-gold)" stop-opacity=".12"/><stop offset="1" stop-color="var(--chart-gold)" stop-opacity="0"/></radialGradient>
    <pattern id="chart-waves" width="72" height="44" patternUnits="userSpaceOnUse"><path d="M0 25q18-7 36 0t36 0M18 41h13" fill="none" stroke="var(--sea-ink)" stroke-width=".8" opacity=".2"/></pattern>
    <pattern id="chart-grain" width="47" height="43" patternUnits="userSpaceOnUse"><path d="m4 8 2 1m24 16 1-1m9 14 2 1" stroke="var(--chart-gold)" stroke-opacity=".13"/></pattern>
    <g id="chart-mountain" fill="var(--mountain-fill)" stroke="var(--terrain-ink)" stroke-width="1.3" stroke-linejoin="round"><path d="m-27 28 26-52 30 52M-1-24l-5 29 7-5 10 17M-11-3l11-4 9 3"/><path d="m-19 14 7-12m20 17 8 9" opacity=".6"/></g>
    <g id="chart-tree" stroke="var(--forest-ink)" stroke-width="1.4" stroke-linejoin="round"><path d="M0-15-9 1h4L-12 12H12L5 1h4Z" fill="var(--forest-fill)"/><path d="M0 8v10"/></g>
    <g id="chart-ship" stroke="var(--chart-gold)" stroke-width="1.4" fill="none"><path d="M-27 9h54l-8 10h-35zM0-34v43M-3-31Q-27-17-24 5h21ZM4-28Q28-9 25 5H4Z"/><path d="M-29 24q11-4 22 0t22 0t20 0" opacity=".55"/></g>
    </defs><rect width="720" height="840" fill="url(#chart-ocean)"/><rect width="720" height="840" fill="url(#chart-waves)"/>
    <g fill="none" stroke="var(--sea-ink)" opacity=".18" stroke-width="1"><path d="{coast}" transform="translate(-19 0)"/><path d="{coast}" transform="translate(-43 0)"/><path d="{coast}" transform="translate(-76 0)"/></g>
    <path d="{coast}" fill="url(#chart-ground)" stroke="var(--chart-gold)" stroke-width="2"/>
    <path d="M440 170q51 37 112 12t117 32M385 466q81-52 144-20t154 10M382 746q113-41 268-1" fill="none" stroke="var(--terrain-ink)" opacity=".16"/>
    <g opacity=".8">{mountains}</g><g opacity=".78">{trees}</g>
    <g fill="none" stroke="var(--river-ink)" stroke-width="2" stroke-linecap="round"><path d="M520 249q-9 28-41 26t-30 27-47 7-61 18"/><path d="M624 608q-35-5-47 19t-57 5-53 17-48-2-57 9"/></g>
    <path d="M407 154Q402 219 361 285L349 332 373 378 332 431 316 488Q342 547 355 594L366 646 358 710 338 777" fill="none" stroke="var(--chart-gold)" stroke-width="2" stroke-dasharray="3 8" opacity=".6"/>
    <g fill="var(--chart-gold)" opacity=".5"><path d="m240 288 6-5 4 8-6 7-5-2zM218 348l5-3 5 7-5 5zM283 527l6-2 3 8-8 5zM274 547l4-1 2 5-5 3z"/></g>
    <use href="#chart-ship" x="163" y="590" transform="rotate(-12 163 590)" opacity=".65"/>
    <circle cx="195" cy="300" r="210" fill="url(#chart-light)"/>
    <rect width="720" height="840" fill="url(#chart-grain)"/>
    <g class="chart-label" fill="var(--terrain-ink)" text-anchor="middle"><text x="540" y="155" letter-spacing="7">世界之脊</text><text x="506" y="397" font-size="16">无冬森林</text></g>
    <g transform="translate(614 745)" stroke="var(--chart-gold)" fill="none" opacity=".8"><circle r="38" stroke-width=".8"/><circle r="29" stroke-dasharray="1 6"/><path d="M0-53 8-7 0 10-8-7ZM0 53 8 7 0-10-8 7ZM-53 0-7-8 10 0-7 8ZM53 0 7-8-10 0 7 8Z" stroke-width="1"/><path d="M0-53 0 10-8-7ZM53 0 7 8-10 0Z" fill="var(--chart-gold)" fill-opacity=".5"/><text y="-62" text-anchor="middle" stroke="none" fill="var(--chart-gold)" font-size="18">北</text></g>
    <rect x="12" y="12" width="696" height="816" rx="2" fill="none" stroke="var(--chart-gold)" stroke-opacity=".35"/><path d="M12 51V12h39M669 12h39v39M12 789v39h39M669 828h39v-39" fill="none" stroke="var(--chart-gold)" stroke-opacity=".65" stroke-width="2"/>
    </svg>'''
    markers=''.join(f'<button type="button" class="map-pin" style="left:{x}%;top:{y}%" data-map="{id}" aria-pressed="false"><span class="pin-dot" aria-hidden="true"></span><span>{escape(entries[id]["name"])}</span></button>' for id,x,y in POINTS)
    underground=''.join(f'<button class="plain" data-map="{id}" aria-pressed="false">{escape(entries[id]["name"])} ↗</button>' for id in ['underdark','menzo'])
    index=''.join(f'<button class="chip" data-map="{x["id"]}" aria-pressed="false">{escape(x["name"])}</button>' for x in data['locations'])
    return '<section class="map-explorer" aria-labelledby="map-title"><div class="map-heading"><h3 id="map-title">剑湾</h3><a href="https://www.dndbeyond.com/resources/1782-map-of-faerun" target="_blank" rel="noopener noreferrer">官方地图 ↗</a></div><div class="map-layout"><div><div class="coast-map" role="group" aria-label="剑湾地点示意图">'+svg+'<span class="map-ocean">无痕之海<small>TRACKLESS SEA</small></span><span class="map-seal">SWORD COAST · 示意图</span>'+markers+'</div><div class="underground"><span>地下</span><div>'+underground+'</div></div></div><article class="map-preview" id="map-preview" aria-live="polite" aria-atomic="true"></article></div><div class="map-index" role="group" aria-label="按名称选择地点">'+index+'</div></section>'
