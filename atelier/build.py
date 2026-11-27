# assemble le jeu : src/page (enveloppe, style) + les fichiers de src/ORDRE + gfx/kit.js + gfx/models/*.js + dt/ et ile/ (Dernier Toit et L'Île des Cinq, tels quels)  →  construit/ile-des-cinq.html (le jeu), construit/publie.html (la page à publier), construit/all.js (le script seul)
import re,sys,os,subprocess,shutil
# V12.7 : armes.js = copie de jeux/dt/gfx/models/mains.js (les armes en main vm.*) ; il passe AVANT mains.js pour que le hero.avatar du lobby l'emporte sur le sien
ORDER=['shared.js','nature.js','monde.js','armes.js','mains.js','lobby.js','pay_a.js','pnj.js']   # V11.1 : les modèles de l'ancienne partie intégrée (ennemis, boss, défenses, navire) sont retirés ; ils vivent dans l'atelier de L'Île des Cinq
def strip(js):   # retire les lignes de commentaire entières (les commentaires en fin de ligne restent)
    return '\n'.join(l for l in js.split('\n') if not l.strip().startswith('//'))
kit=open('gfx/kit.js').read().replace("if(typeof module!=='undefined')module.exports=K;","")
parts=['// ---------- atelier 3D : K (formes → maillages colorés par sommet), SH (motifs partagés), MODELS (un modèle par objet du jeu) ----------',strip(kit).strip(),'const MODELS={};']
used=[]
for f in ORDER:
    p='gfx/models/'+f
    if not os.path.exists(p):continue
    os.makedirs('gfx/good',exist_ok=True);g='gfx/good/'+f
    if subprocess.run(['node','--check',p],capture_output=True).returncode==0:shutil.copy(p,g)
    elif os.path.exists(g):print('  !',f,': erreur de syntaxe, dernière bonne copie utilisée')
    else:print('  !',f,': erreur de syntaxe, fichier ignoré');continue
    src=strip(open(g).read()).strip()
    if f=='shared.js':src=src.replace('var SH=','const SH=',1)
    parts.append(src);used.append(f)
# V10.1 : les photos des six armes viennent telles quelles de l'atelier de Dernier Toit (dt/photos.js). V11.1 : leurs modèles en main (dt/mains.js) ne sont plus collés ici : seuls les mini-jeux les montrent.
parts.append(strip(open('dt/photos.js').read()).strip())   # WPHOTO : les photos des six armes (salle d'armes, portails)
parts.append(strip(open('gfx/heros-photos.js').read()).strip())   # HPHOTO : les portraits des cinq héros (hall, portails), V11.4
gfx='\n'.join(parts)
# V10.8 (le grand rangement) : la page n'est plus un seul gros fichier. src/page/page.html est l'enveloppe ; src/page/style.css la feuille de style ;
# le script est la suite des fichiers listés dans src/ORDRE (règles, interface, sons, affichage, lobby), remis bout à bout dans cet ordre.
def lire(p):return open(p,encoding='utf-8').read()
js=[]
for l in lire('src/ORDRE').split('\n'):
    l=l.strip()
    if not l or l.startswith('#'):continue
    if l=='@ouvre':js.append('(function(){')
    elif l=='@ferme':js.append('})();')
    elif l=='@gfx':js.append(gfx)
    else:js.append(lire('src/'+l).rstrip('\n'))
h=lire('src/page/page.html')
for tag,code in(('/*@STYLE@*/',lire('src/page/style.css').rstrip('\n')),('/*@JS@*/','\n'.join(js))):
    assert h.count(tag)==1,tag
    h=h.replace(tag,code)
# V10.8 : le numéro de version est écrit une seule fois, dans le fichier VERSION ; @VERSION@ le reprend (titre, panneau du portail, haut de l'écran du lobby)
ver=lire('VERSION').strip();assert h.count('@VERSION@')==3,h.count('@VERSION@');h=h.replace('@VERSION@',ver)
# V8.0 : la page livrée perd ses commentaires, ses retraits et ses lignes vides (les sources les gardent).
def squeeze(js):
    out=[];i=0;n=len(js);RX='(,=:[!&|?{};+-*%<>~^\n'
    def last():
        k=len(out)-1
        while k>=0 and out[k] in ' \t':k-=1
        return out[k] if k>=0 else '\n'
    def word():
        t=''.join(out[-12:]).rstrip();m=re.search(r'[A-Za-z_$][\w$]*$',t);return m.group(0) if m else ''
    def code(depth_stop):
        nonlocal i
        d=0
        while i<n:
            c=js[i]
            if c in '\'"':
                j=i+1
                while js[j]!=c:j+=2 if js[j]=='\\' else 1
                out.append(js[i:j+1]);i=j+1;continue
            if c=='`':
                out.append(c);i+=1
                while js[i]!='`':
                    if js[i]=='\\':out.append(js[i:i+2]);i+=2;continue
                    if js[i]=='$' and js[i+1]=='{':out.append('${');i+=2;code(True);out.append('}');i+=1;continue
                    out.append(js[i]);i+=1
                out.append('`');i+=1;continue
            if c=='/' and js[i+1]=='/':
                j=js.find('\n',i);j=n if j<0 else j
                if js.startswith('//<',i):out.append(js[i:j])
                else:
                    while out and out[-1] in ' \t':out.pop()
                i=j;continue
            if c=='/' and js[i+1]=='*':
                j=js.index('*/',i)+2
                if out and (out[-1].isalnum() or out[-1] in '_$') and j<n and (js[j].isalnum() or js[j] in '_$'):out.append(' ')
                i=j;continue
            if c=='/' and (last() in RX or word() in('return','typeof','case','in','of','else','do','void')):
                j=i+1;cl=False
                while True:
                    ch=js[j]
                    if ch=='\\':j+=2;continue
                    if ch=='\n':j=-1;break
                    if ch=='[':cl=True
                    elif ch==']':cl=False
                    elif ch=='/' and not cl:break
                    j+=1
                if j>0:
                    out.append(js[i:j+1]);i=j+1;continue
            if c=='\n':
                while out and out[-1] in ' \t':out.pop()
                if out and out[-1]!='\n':out.append('\n')
                i+=1
                while i<n and js[i] in ' \t':i+=1
                continue
            if depth_stop:
                if c=='{':d+=1
                elif c=='}':
                    if d==0:return
                    d-=1
            out.append(c);i+=1
    code(False);return ''.join(out)
a0=h.index('<script>\n')+9;b0=h.rindex('</script>');raw=len(h)
h=h[:a0]+squeeze(h[a0:b0])+h[b0:]
# V10.1 : Dernier Toit, collé tel quel dans son propre <script> (une seule variable globale : DernierToit), avant le script du jeu. Nouvelle version de Dernier Toit = remplacer dt/dt-pour-lobby.js.
dt=open('dt/dt-pour-lobby.js').read()
assert '</script' not in dt.lower(),'dt-pour-lobby.js contient une balise de fin de script'
h=h[:a0-9]+'<script id="dt">\n'+dt.rstrip('\n')+'\n</script>\n'+h[a0-9:]
# V11.0 : L'Île des Cinq, collée de la même façon (une seule variable globale : IleDesCinq). Nouvelle version du jeu = remplacer ile/ile-pour-lobby.js.
ile=open('ile/ile-pour-lobby.js').read()
assert '</script' not in ile.lower(),'ile-pour-lobby.js contient une balise de fin de script'
a0=h.index('<script id="dt">')+9
h=h[:a0-9]+'<script id="ile">\n'+ile.rstrip('\n')+'\n</script>\n'+h[a0-9:]
os.makedirs('construit',exist_ok=True)
out=sys.argv[1] if len(sys.argv)>1 else 'construit/ile-des-cinq.html'
open(out,'w').write(h)
js=h[h.index('<script>\n')+9:h.rindex('</script>')] if '<script>\n' in h else ''
open('construit/all.js','w').write(js)
print('ok',out,len(h),'octets (',raw,'avec commentaires) · modèles :',' '.join(used))
# page complète à publier : même enveloppe que celle que le serveur ajoutait aux anciennes versions (le jeu dépend de la règle [hidden])
# V12.0 : l'en-tête porte aussi ce qui fait de la page une appli à installer sur l'écran d'accueil (plein écran, nom, icône, manifeste) ; les deux fichiers liés n'existent que dans le paquet de outils/mkappli.py, ailleurs ils manquent sans gêner
ENV='<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Abtest"><meta name="theme-color" content="#0d2a37"><link rel="apple-touch-icon" href="icon-180.png"><link rel="manifest" href="manifest.webmanifest"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n'
open('construit/publie.html','w').write(ENV+h+'\n</body></html>')
