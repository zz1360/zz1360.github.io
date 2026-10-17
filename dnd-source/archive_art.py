"""Publish setting-local archive art without replacing approved originals."""
from pathlib import Path
import hashlib, html, json, re, shutil, subprocess

GROUPS=('people','locations','factions')
e=lambda text:html.escape(str(text),quote=True)

def catalog(root):
    data=json.loads((root/'archive-art.json').read_text())
    ids=[x['id'] for x in data['assets']]
    assert len(ids)==len(set(ids)), 'Duplicate archive artwork ID'
    known={x['id'] for name in ['data.json','settings/eberron.json','settings/planescape.json']
           for group in GROUPS for x in json.loads((root/name).read_text())[group]}
    for asset in data['assets']:
        assert asset['id'] in known, asset['id']
        assert re.fullmatch(r'assets/archives/[a-z0-9-]+\.webp',asset['file'])
        assert (root/asset['file']).is_file(), 'Missing archive artwork: '+asset['file']
        assert asset.get('generated_source') and asset.get('sha256'), 'Missing provenance: '+asset['id']
        assert hashlib.sha256((root/asset['file']).read_bytes()).hexdigest()==asset['sha256'],asset['id']
        assert asset['width']>0 and asset['height']>0
    return data

def root_assets(root):
    return [dict(a,art_note=a['note']) for a in catalog(root)['assets'] if not a['id'].startswith(('eb-','ps-'))]

def existing_figure(page,id):
    found=re.search(r'<figure class="art-figure">(?:(?!</figure>).)*\bid="art-'+re.escape(id)+r'".*?</figure>',page,re.S)
    assert found, 'Missing existing illustration: '+id
    return found[0]

def localize_figure(figure,original,id):
    return figure.replace('art-'+original,'art-'+id).replace('data-art="'+original+'"','data-art="'+id+'"')

def figure(asset,image):
    id=asset['id'];width=asset.get('width',1536);height=asset.get('height',1024)
    kind={'portrait':'人物肖像','faith':'信仰意象','power':'力量意象','place':'地点意象','faction':'组织意象'}[asset['kind']]
    return ('<figure class="art-figure"><button type="button" class="art-open" data-art="'+e(id)+'" aria-label="放大查看'+e(asset['name'])+'插图">'
            '<img id="art-'+e(id)+'" class="entry-art" src="'+e(image['src'])+'" data-full="'+e(image['full'])+'" data-thumb="'+e(image.get('thumb',image['src']))+'" data-thumb-width="'+str(image.get('thumbWidth',320))+'"'
            ' data-srcset="'+e(image['srcset'])+'" srcset="'+e(image['srcset'])+'" sizes="(max-width:620px) 90vw, (max-width:1100px) 45vw, 500px"'
            ' data-art-note="'+e(asset['note'])+'" data-art-kind="'+e(asset['kind'])+'" alt="'+e(asset['name']+' · '+kind+'概念插画')+'"'
            ' loading="lazy" decoding="async" width="'+str(width)+'" height="'+str(height)+'"><span class="art-enlarge">查看大图 ↗</span></button>'
            '<figcaption>AI 概念插画 · '+kind+'</figcaption></figure>')

def image_record(figure):
    from html.parser import HTMLParser
    class Image(HTMLParser):
        def handle_starttag(self,tag,attrs):
            attrs=dict(attrs)
            if tag=='img' and 'entry-art' in attrs.get('class','').split():self.attrs=attrs
    parser=Image();parser.feed(figure);attrs=parser.attrs
    return dict(src=attrs['src'],full=attrs.get('data-full',attrs['src']),thumb=attrs.get('data-thumb',attrs['src']),
                srcset=attrs.get('data-srcset',''),thumbWidth=int(attrs.get('data-thumb-width',320)),width=int(attrs['width']),height=int(attrs['height']),note=attrs.get('data-art-note',''))

def publish(root,output,base,scenes):
    source=catalog(root);assets=Path(output)/'assets';assets.mkdir(parents=True,exist_ok=True)
    encoder=shutil.which('cwebp') or ('/opt/homebrew/bin/cwebp' if Path('/opt/homebrew/bin/cwebp').exists() else None)
    assert encoder, 'cwebp is required for archive art'
    figures={};files=[];records=[]
    groups={'realms':json.loads((root/'data.json').read_text()),
            **{s:json.loads((root/'settings'/(s+'.json')).read_text()) for s in ['eberron','planescape']}}
    for asset in source['assets']:
        id=asset['id']
        if not id.startswith(('eb-','ps-')):
            figures[id]=existing_figure(base,id)
            continue
        blob=(root/asset['file']).read_bytes();digest=hashlib.sha256(blob).hexdigest()[:20]
        raw='archive-'+digest+'.webp';(assets/raw).write_bytes(blob);files.append(raw)
        variants=[]
        for width in [320,640,960]:
            filename=f'archive-{digest}-w{width}-q82-v1.webp';path=assets/filename
            if not path.exists():subprocess.run([encoder,'-quiet','-q','82','-resize',str(width),'0',str(assets/raw),'-o',str(path)],check=True)
            variants.append(dict(width=width,url='/dnd/assets/'+filename,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bytes=path.stat().st_size));files.append(filename)
        srcset=', '.join(f'{v["url"]} {v["width"]}w' for v in variants[1:])+f', /dnd/assets/{raw} {asset["width"]}w'
        image=dict(src=variants[1]['url'],full='/dnd/assets/'+raw,thumb=variants[0]['url'],srcset=srcset)
        figures[id]=figure(asset,image)
    # Reuse an image only for the identical person or the identical place.
    for item in source['reused']:
        if item.get('original'):figures[item['id']]=localize_figure(existing_figure(base,item['original']),item['original'],item['id'])
        elif item.get('scene'):
            entry=next(x for x in groups[item['scene']]['locations'] if x['id']==item['id'])
            scene=scenes[item['scene']]
            figures[item['id']]=figure(dict(id=item['id'],name=entry['name'],width=1536,height=1024,kind='place',note='地点氛围意象，不是准确地图或建筑复原。'),dict(scene,thumb=scene['variants'][0]['url'],thumbWidth=scene['variants'][0]['width']))
    for data in [groups['eberron'],groups['planescape']]:
        for entry in data['people']:
            if entry.get('art') and entry['id'] not in figures:figures[entry['id']]=localize_figure(existing_figure(base,entry['art']),entry['art'],entry['id'])
    coverage={}
    for setting,data in groups.items():
        coverage[setting]={}
        for group in GROUPS:
            coverage[setting][group]=len(data[group])
            for entry in data[group]:
                id=entry['id'];art=figures.get(id) or (existing_figure(base,id) if setting=='realms' else None)
                assert art,'Unillustrated '+setting+' '+id
                image=image_record(art)
                sizes={image['thumbWidth']:image['thumb'],**{int(part.strip().rsplit(' ',1)[1][:-1]):part.strip().rsplit(' ',1)[0] for part in image['srcset'].split(',') if part.strip()}}
                variants=[]
                for width,url in sorted(sizes.items()):
                    assert url.startswith('/dnd/assets/') and re.fullmatch(r'[a-z0-9.-]+',url.rsplit('/',1)[1])
                    file=assets/url.rsplit('/',1)[1];blob=file.read_bytes()
                    variants.append(dict(width=width,url=url,sha256=hashlib.sha256(blob).hexdigest(),bytes=len(blob)))
                records.append(dict(id=id,setting=setting,group=group,variants=variants,**image))
    previous=Path(output)/'manifest.json'
    if previous.exists():
        old=json.loads(previous.read_text()).get('archiveArt',{}).get('generated_files',[])
        for name in set(old)-set(files):
            if re.fullmatch(r'archive-[a-f0-9]{20}(?:-w\d+-q82-v1)?\.webp',name):(assets/name).unlink(missing_ok=True)
    return figures,dict(created=source['created'],newIllustrations=len(source['assets']),coverage=coverage,entries=records,generated_files=sorted(files))
