# photos.js rend chaque arme sur fond magenta (2x) ; ici : fond rendu transparent, recadrage, 240x90, palette réduite → gfx/photos.js
from PIL import Image
import base64,io,os
W,H=240,90
out={}
for k in ['fusil','pistolet','assaut','sniper','pompe','lance']:
    im=Image.open('/tmp/photos/%s.png'%k).convert('RGBA')
    if os.path.exists('/tmp/photos/%s.flip'%k):im=im.transpose(Image.FLIP_LEFT_RIGHT)   # vue du flanc gauche : on retourne, bouche à droite
    px=im.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=px[x,y]
            if r>200 and b>200 and g<60:px[x,y]=(0,0,0,0)
    im=im.crop(im.getbbox())
    s=min((W*2-12)/im.width,(H*2-8)/im.height)
    im=im.convert('RGBa').resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.LANCZOS)
    c=Image.new('RGBa',(W*2,H*2));c.paste(im,((W*2-im.width)//2,(H*2-im.height)//2))
    c=c.resize((W,H),Image.LANCZOS).convert('RGBA')
    c=c.quantize(colors=128,method=Image.FASTOCTREE)
    bio=io.BytesIO();c.save(bio,'PNG',optimize=True);out[k]=bio.getvalue()
    open('/tmp/photos/%s-ok.png'%k,'wb').write(out[k])
js='// photos des armes pour le menu (faites par photos.js + photos.py, ne pas éditer)\nconst WPHOTO={'+','.join("%s:'data:image/png;base64,%s'"%(k,base64.b64encode(v).decode()) for k,v in out.items())+'};\n'
open('gfx/photos.js','w').write(js)
print({k:len(v) for k,v in out.items()},len(js))
