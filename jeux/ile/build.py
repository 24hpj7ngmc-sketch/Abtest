# L'ÎLE DES CINQ — assemble le jeu : src/page (enveloppe, style) + les fichiers de src/ORDRE + gfx/kit.js + gfx/models/*.js + gfx/armes/ (les six armes, communes au projet)
#   →  construit/ile.html (la page du jeu, celle qui tourne dans le cadre), construit/all.js (son script seul),
#      construit/ile-pour-lobby.js (LE FICHIER À COLLER DANS LE LOBBY : le pont src/pont-lobby.js rempli avec la page, la version et les tables publiques)
import re,sys,os,subprocess,shutil
ORDER=['shared.js','enemy_b.js','bestiaire1.js','bestiaire2.js','defenses.js','nature.js','monde.js','braise.js','roc.js','sylve.js','volt.js','ondine.js','zephyr.js','mains.js','pnj.js','navire.js']   # V8.0 : defaults.js retiré ; V2.8 : roc, sylve, volt, ondine, zephyr (les cinq autres héros, communs aux trois jeux) ; V2.4 : braise.js (Braise, le Mage de feu, commun aux trois jeux) (ses huit modèles de secours étaient tous redéfinis plus loin)
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
# Les six armes du projet. gfx/armes/mains.js vient tel quel de l'atelier de Dernier Toit (src/gfx/models/mains.js) : on ne le modifie pas, on le remplace.
# Il redéfinit aussi la pelle, le marteau et l'avatar : ceux du lobby sont gardés de côté puis remis ; la masse, le leurre et la radio (propres à Dernier Toit) sont retirés.
dtm=strip(open('gfx/armes/mains.js').read()).strip()
assert subprocess.run(['node','--check','gfx/armes/mains.js'],capture_output=True).returncode==0,'gfx/armes/mains.js : erreur de syntaxe'
parts.append("{const GARDE=['vm.pelle','vm.marteau','hero.avatar'].map(k=>[k,MODELS[k]]);\n"+dtm+"\nGARDE.forEach(q=>{MODELS[q[0]]=q[1];});for(const k of['vm.masse','vm.leurre','vm.radio'])delete MODELS[k];}")
gfx='\n'.join(parts)
# V10.8 (le grand rangement) : la page n'est plus un seul gros fichier. src/page/page.html est l'enveloppe ; src/page/style.css la feuille de style ;
# le script est la suite des fichiers listés dans src/ORDRE (règles, interface, sons, affichage, lobby), remis bout à bout dans cet ordre.
def lire(p):return open(p,encoding='utf-8').read()
js=[]
for l in lire('src/ORDRE').split('\n'):
    l=l.strip()
    if not l or l.startswith('#'):continue
    if l=='@sim':js.append('//<SIM>')
    elif l=='@/sim':js.append('//</SIM>')
    elif l=='@ouvre':js.append('(function(){')
    elif l=='@ferme':js.append('})();')
    elif l=='@gfx':js.append(gfx)
    else:js.append(lire('src/'+l).rstrip('\n'))
h=lire('src/page/page.html')
for tag,code in(('/*@STYLE@*/',lire('src/page/style.css').rstrip('\n')),('/*@JS@*/','\n'.join(js))):
    assert h.count(tag)==1,tag
    h=h.replace(tag,code)
# V10.8 : le numéro de version est écrit une seule fois, dans le fichier VERSION ; @VERSION@ le reprend (titre, panneau du portail, haut de l'écran du lobby)
ver=lire('VERSION').strip();assert h.count('@VERSION@')>=1,h.count('@VERSION@');h=h.replace('@VERSION@',ver)
# V8.0 : la page livrée perd ses commentaires, ses retraits et ses lignes vides (les sources les gardent). Les repères //<SIM> restent : les bancs de test s'en servent.
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
# ce que le lobby donne à la partie (window.ILE_LOBBY) est posé avant tout script : le pont remplace le repère par les options ; ouverte seule (tests), la page garde ce qu'un test a posé
a1=h.index('<script src=');h=h[:a1]+'<script>window.ILE_LOBBY=window.ILE_LOBBY||/*@ILE_OPTS@*/null;</script>\n'+h[a1:]
os.makedirs('construit',exist_ok=True)
out=sys.argv[1] if len(sys.argv)>1 else 'construit/fragment.html'
open(out,'w').write(h)
js=h[h.index('<script>\n')+9:h.rindex('</script>')] if '<script>\n' in h else ''
open('construit/all.js','w').write(js)
print('ok',out,len(h),'octets (',raw,'avec commentaires) · modèles :',' '.join(used))
# page complète à publier : même enveloppe que celle que le serveur ajoutait aux anciennes versions (le jeu dépend de la règle [hidden])
ENV='<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:var(--enc-haut,env(safe-area-inset-top,0px));padding-bottom:var(--enc-bas,env(safe-area-inset-bottom,0px))}html{scroll-padding-top:var(--enc-haut,env(safe-area-inset-top,0px))}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n'
page=ENV+h+'\n</body></html>'
open('construit/ile.html','w').write(page)
# ---------- le fichier à coller dans le lobby ----------
# les tables publiques : ce que le lobby a besoin de lire des règles pour ses textes (arbres, Guide). Elles sont tirées des règles elles-mêmes, par node : jamais recopiées à la main.
import json
tables=subprocess.run(['node','outils/tables.js','construit/all.js'],capture_output=True,text=True)
assert tables.returncode==0,tables.stderr[:600]
T=json.loads(tables.stdout)
pont=lire('src/pont-lobby.js')
def js_str(s):return json.dumps(s,ensure_ascii=False).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
for tag,val in(("/*@ILE_VERSION@*/ ''",json.dumps('V'+ver)),("/*@ILE_PAGE@*/ ''",js_str(page)),("/*@ILE_TABLES@*/ null",js_str(T) if False else json.dumps(T,ensure_ascii=False).replace('<','\\u003c'))):
    assert pont.count(tag)==1,tag
    pont=pont.replace(tag,val)
assert '</script' not in pont.lower()
open('construit/ile-pour-lobby.js','w').write(pont)
import hashlib
print('ok construit/ile-pour-lobby.js',len(pont.encode()),'octets · sha256',hashlib.sha256(pont.encode()).hexdigest()[:16],'· tables :',' '.join(sorted(T)))
