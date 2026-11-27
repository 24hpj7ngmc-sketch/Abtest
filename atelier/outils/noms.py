# Cherche dans le code assemblé (src/, dans l'ordre de src/ORDRE) : les noms utilisés mais déclarés nulle part, et les déclarations jamais lues.
# (tsc dit TS2304 « introuvable » ou TS2552 « introuvable, vouliez-vous dire… » : les deux comptent)
# usage : python3 outils/noms.py [manquants|inutiles|tout]      (se sert de tsc, déjà installé)
import re,subprocess,os,json,sys
quoi=sys.argv[1] if len(sys.argv)>1 else 'tout'
order=[l.strip() for l in open('src/ORDRE',encoding='utf-8').read().split('\n') if l.strip() and not l.startswith('#')]
js=[]
for l in order:
    if l.startswith('@'):js.append({'@sim':'','@/sim':'','@ouvre':'(function(){','@ferme':'})();','@gfx':''}.get(l,''));continue
    js.append('//@@ '+l+'\n'+open('src/'+l,encoding='utf-8').read())
GLOB=os.environ.get('NOMS_GLOBAUX','K,MODELS,PBR,WPHOTO,THREE')
src='(function(){var '+GLOB+';\n'+'\n'.join(js)+'\n})();'
d='/tmp/noms-'+os.path.basename(os.getcwd());os.makedirs(d,exist_ok=True)
open(d+'/all.js','w',encoding='utf-8').write(src)
json.dump({"compilerOptions":{"allowJs":True,"checkJs":True,"noEmit":True,"noUnusedLocals":True,"target":"esnext","lib":["esnext","dom"],"types":[]},"files":["all.js"]},open(d+'/tsconfig.json','w'))
out=subprocess.run(['tsc','-p',d],capture_output=True,text=True).stdout
L=src.split('\n');cur=[];f=None;base={}
for i,l in enumerate(L):
    if l.startswith('//@@ '):f=l[5:];base[f]=i+1
    cur.append(f)
miss={};unused=[]
for m in re.finditer(r"all\.js\((\d+),(\d+)\): error TS(\d+): (.*)",out):
    ln=int(m.group(1));f=cur[ln-1]
    if f is None:continue
    if m.group(3) in('2304','2552'):
        n=re.search(r"'([^']+)'",m.group(4)).group(1);miss.setdefault(n,[]).append('%s:%d'%(f,ln-base[f]))
    elif m.group(3) in('6133','6198'):
        n=re.search(r"'([^']+)'",m.group(4));unused.append(('%s:%d'%(f,ln-base[f]),n.group(1) if n else '?'))
if quoi in('manquants','tout'):
    print('NOMS MANQUANTS :',len(miss))
    for k,v in sorted(miss.items(),key=lambda x:-len(x[1])):print('  %s ×%d  %s'%(k,len(v),' '.join(v[:6])))
if quoi in('inutiles','tout'):
    print('JAMAIS LUS :',len(unused))
    for w,n in unused:print('  %s  %s'%(n,w))
