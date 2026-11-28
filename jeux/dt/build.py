# Assemble Dernier Toit en une seule page.
#   regles/     les règles (immeuble, zombies, joueur, armes, héros…) : aucune 3D, tournent aussi sous Node pour les tests
#   affichage/  la 3D (three.js r128 + kit K)          sons/  le petit synthé WebAudio
#   interface/  page.html (squelette) + le code et le style de l'interface
#   gfx/        kit 3D K, modèles, photos des armes, moteur d'aperçu three-lite (tests)
# Chaque dossier a un ordre.txt : la liste de ses fichiers, dans l'ordre où ils sont collés (tout partage la même portée globale).
# Sorties : toit.html (page), publie.html (page complète, espaces retirés par esbuild), test3d.html (pour les tests, three-lite à la place du vrai three.js),
#           regles.js (les règles seules, chargées par les tests Node), dt-pour-lobby.js (le jeu à coller dans le lobby, voir LOBBY.md).
import os,subprocess,sys
ESBUILD='/opt/npm-tools/node_modules/esbuild/bin/esbuild'
def strip(js): return '\n'.join(l for l in js.split('\n') if not l.strip().startswith('//'))
def lit(dossier):
    noms=[l.strip() for l in open(os.path.join(dossier,'ordre.txt')) if l.strip() and not l.strip().startswith('#')]
    return '\n'.join(open(os.path.join(dossier,n)).read().rstrip('\n') for n in noms)
kit=open('gfx/kit.js').read().replace("if(typeof module!=='undefined')module.exports=K;","")
gfx='\n'.join([strip(kit).strip(),'const MODELS={};',strip(open('gfx/models/shared.js').read()).strip(),strip(open('gfx/models/mains.js').read()).strip(),strip(open('gfx/models/braise.js').read()).strip(),strip(open('gfx/models/roc.js').read()).strip(),strip(open('gfx/models/sylve.js').read()).strip(),strip(open('gfx/models/volt.js').read()).strip(),strip(open('gfx/models/ondine.js').read()).strip(),strip(open('gfx/models/zephyr.js').read()).strip(),strip(open('gfx/models/toit.js').read()).strip(),strip(open('gfx/models/pnj.js').read()).strip(),open('gfx/photos.js').read().strip()])
regles=lit('regles')
open('regles.js','w').write(regles+'\n')
h=open('interface/page.html').read()
parts=[('/*@GFX@*/',gfx),('/*@SIM@*/',regles),('/*@SOUND@*/',lit('sons')),('/*@SCENE@*/',lit('affichage'))]
if '/*@UI@*/' in h: parts.append(('/*@UI@*/',lit('interface')))
if '/*@CSS@*/' in h: parts.append(('/*@CSS@*/',open('interface/style.css').read().rstrip('\n')))
for tag,code in parts:
    assert h.count(tag)==1,tag
    h=h.replace(tag,code.rstrip('\n'))
open('toit.html','w').write(h)
# le script de la page, sans les espaces ni les commentaires (même code, plus léger à charger sur le téléphone)
a=h.index('<script>\n')+9;b=h.rindex('</script>')
js=h[a:b]
if os.path.exists(ESBUILD) and '--brut' not in sys.argv:
    r=subprocess.run([ESBUILD,'--minify-whitespace','--loader=js','--charset=utf8','--log-level=error'],input=js.encode(),capture_output=True)
    if r.returncode!=0: sys.exit('esbuild : '+r.stderr.decode()[:2000])
    js=r.stdout.decode()
h2=h[:a]+js+h[b:]
ENV='<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:dark;box-sizing:border-box}body{margin:0;padding:0}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n'
open('publie.html','w').write(ENV+h2+'\n</body></html>')
# page de test : le vrai three.js est remplacé par le moteur d'aperçu local (pas d'internet ici)
t=open('publie.html').read().replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>','<script src="gfx/three-lite.js"></script>')
open('test3d.html','w').write(t)
# V4.1 : Dernier Toit pour le lobby (voir LOBBY.md) : dt-pour-lobby.js, à coller tel quel dans un <script> de la page du lobby.
# La page publiée y est une chaîne JS sans aucun « < » (écrit \u003c : rien ne peut fermer le <script> du lobby) ; le marqueur DT_OPTS
# dit où DernierToit.page(opts) pose window.DT_LOBBY, juste avant le premier script de la page.
import json,re
TROIS='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
lob=open('publie.html').read()
assert lob.count(TROIS)==1
lob=lob.replace(TROIS,'<script>window.DT_LOBBY=/*@DT_OPTS@*/null;</script>'+TROIS)
ver=re.search(r'<title>Dernier Toit\. (V[0-9.]+)</title>',h).group(1)
chaine=json.dumps(lob,ensure_ascii=False).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
pont=open('interface/pont-lobby.js').read().replace("/*@DT_VERSION@*/ ''",json.dumps(ver)).replace("/*@DT_PAGE@*/ ''",chaine)
assert '<' not in pont.split('const PAGE = ',1)[1].split(';\n',1)[0]
open('dt-pour-lobby.js','w').write(pont)
print('ok',len(h2),'octets (page publiée), règles',len(regles),'· dt-pour-lobby.js',len(pont.encode()),'octets',ver)
