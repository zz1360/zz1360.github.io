"""Download generic Noto Serif SC web fonts. Never read or transmit site/article content."""
from pathlib import Path
import subprocess, re
root = Path(__file__).resolve().parent.parent
fonts = root/'public/fonts/noto-serif-sc'
fonts.mkdir(parents=True,exist_ok=True)
url = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600&display=swap'
css = fonts/'upstream.css'
ua = 'Mozilla/5.0 AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
def fetch(address, target):
    subprocess.run(['curl','--fail','--silent','--show-error','--retry','2','--connect-timeout','15','--max-time','60','-A',ua,address,'-o',str(target)],check=True)
fetch(url, css)
body = css.read_text()
addresses = list(dict.fromkeys(re.findall(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', body)))
for index,address in enumerate(addresses):
    suffix = '.woff2' if '.woff2' in address else '.ttf'
    target = fonts/(str(index)+suffix)
    fetch(address,target)
    body = body.replace(address,'/fonts/noto-serif-sc/'+target.name)
(root/'src/styles/fonts.css').write_text(body.replace('Noto Serif SC','Tavern Serif'))
print('Generic public font assets:',len(addresses),flush=True)
