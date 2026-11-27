# Prépare la sauvegarde de l'atelier de L'Île des Cinq à publier : copie les sources dans un dossier (par défaut /home/claude/pub-ile), sous atelier/…,
# avec le suffixe .txt pour ce que la page ne sert pas tel quel (.html, .py, .sh, .md, .out, sans extension), et écrit la page d'accueil (index.html).
# usage, depuis la racine de l'atelier : python3 outils/mkatelier.py [dossier]   → affiche la liste des fichiers, à donner à publish_files
# Pour reconstruire l'atelier depuis la sauvegarde : retirer « atelier/ » et « .txt » ; atelier/prettierrc.json redevient .prettierrc.json.
import os,sys,shutil,re,json,html
P=sys.argv[1] if len(sys.argv)>1 else '/home/claude/pub-ile'
DIRS=['src','gfx','tests','outils','docs']   # archive/ n'est pas publié ici : les archives sont dans l'atelier du lobby
ROOT=['NOTES.md','FICHE.md','LOBBY.md','VERSION','build.py','mktest.sh','tout.sh','.prettierrc.json']
SKIP=('gfx/good/','gfx/out/')
TXT=('.html','.py','.sh','.md','.out')
files=list(ROOT)
for d in DIRS:
    for r,_,fs in os.walk(d):
        for f in sorted(fs):
            p=os.path.join(r,f).replace(os.sep,'/')
            if p.startswith(SKIP) or f.startswith('.') or f.endswith(('.png','.pyc')):continue
            files.append(p)
files.append('construit/ile-pour-lobby.js')   # LA LIVRAISON : le fichier que la conversation du lobby colle tel quel
def pub(p):
    if p=='.prettierrc.json':return 'atelier/prettierrc.json'
    if p=='construit/ile-pour-lobby.js':return 'atelier/livraison/ile-pour-lobby.js'
    return 'atelier/'+p+('.txt' if p.endswith(TXT) or '.' not in os.path.basename(p) else '')
def desc(p):
    try:L=open(p,encoding='utf-8').read(1500).split('\n')
    except Exception:return ''
    for l in L[:6]:
        l=l.strip()
        m=re.match(r'// \[[^\]]+\] (.*)',l)
        if m:return m.group(1)
        if l.startswith('#!') or not l:continue
        m=re.match(r'(?://|#|/\*)+\s*(.*)',l)
        if m and len(m.group(1))>8:return m.group(1).strip(' -=*/')
    return ''
shutil.rmtree(P,ignore_errors=True)
out=[]
for p in files:
    d=os.path.join(P,pub(p));os.makedirs(os.path.dirname(d),exist_ok=True);shutil.copyfile(p,d);out.append(pub(p))
ver=open('VERSION').read().strip()
SEC=[('La livraison pour le lobby',lambda p:p in('construit/ile-pour-lobby.js','LOBBY.md')),('À lire en premier',lambda p:p in('NOTES.md','FICHE.md','src/LISEZMOI.md')),('Construire et tester',lambda p:p in('build.py','mktest.sh','tout.sh','VERSION','.prettierrc.json','src/ORDRE','src/TABLES','src/pont-lobby.js')),
 ('La page',lambda p:p.startswith('src/page/')),('Les règles de L\'Île des Cinq',lambda p:p.startswith('src/regles/')),('L\'interface',lambda p:p.startswith('src/interface/')),('Les sons',lambda p:p.startswith('src/sons/')),
 ('L\'affichage 3D',lambda p:p.startswith('src/affichage/')),('Modèles 3D et moteur d\'aperçu',lambda p:p.startswith('gfx/')),
 ('Tests, captures, bancs de simulation',lambda p:p.startswith('tests/')),('Outils',lambda p:p.startswith('outils/')),('Documents',lambda p:p.startswith('docs/')),('Archives (code retiré)',lambda p:p.startswith('archive/'))]
E=html.escape;body=[];seen=set()
for t,ok in SEC:
    L=[p for p in files if ok(p) and p not in seen]
    if not L:continue
    seen.update(L);body.append('<h2>'+E(t)+'</h2>\n<ul>'+'\n'.join('<li><a href="%s">%s</a><span>%s</span></li>'%(E(pub(p)),E(p),E(desc(p)[:150])) for p in L)+'</ul>')
CSS=""":root{--bg:#f6f4ee;--fg:#1d2a30;--mute:#5b6b72;--line:#d9d4c6;--accent:#b0622a;--card:#fffdf8;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#10202a;--fg:#ecf3f4;--mute:#9fb4bb;--line:#27404c;--accent:#ffcf5a;--card:#16303c;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#10202a;--fg:#ecf3f4;--mute:#9fb4bb;--line:#27404c;--accent:#ffcf5a;--card:#16303c;color-scheme:dark}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 Georgia,'Times New Roman',serif;padding-block:28px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
main{max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:18px}
h1{font-size:28px;margin:0;text-wrap:balance}h2{font-size:17px;margin:10px 0 0;color:var(--accent);letter-spacing:.04em;text-transform:uppercase;font-family:system-ui,sans-serif}
p{margin:0;color:var(--mute)}ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px}
li{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px 12px;display:flex;flex-direction:column;gap:2px}
li a{color:var(--fg);font-family:ui-monospace,Menlo,monospace;font-size:14px;word-break:break-all}li span{color:var(--mute);font-size:14px;min-width:0}"""
page='<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<title>Atelier L\'Île des Cinq · V'+ver+'</title>\n<style>\n'+CSS+'\n</style></head><body>\n<main>\n<h1>Atelier de L\'Île des Cinq · V'+ver+'</h1>\n<p>Les sources du mini-jeu L\'Île des Cinq, ses tests et ses notes. La livraison pour le lobby est le premier fichier de la liste. Cette page est une sauvegarde de travail : elle ne se joue pas.</p>\n'+'\n'.join(body)+'\n</main></body></html>'
open(os.path.join(P,'index.html'),'w',encoding='utf-8').write(page)
json.dump([{'as':'index.html','path':P+'/index.html'}]+[{'as':o,'path':P+'/'+o} for o in out],open(os.path.join(os.path.dirname(P),'pub-ile-liste.json'),'w'))
print(len(out)+1,'fichiers',sum(os.path.getsize(os.path.join(P,o)) for o in out),'octets · liste :',os.path.join(os.path.dirname(P),'pub-ile-liste.json'))
missing=[p for p in files if p not in seen];print('hors sections :',missing)
