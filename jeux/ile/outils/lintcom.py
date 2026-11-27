# Cherche du code avalé par un commentaire : un « // » ajouté au milieu d'une ligne met en commentaire tout ce qui suit (arrivé trois fois : V8.6, V8.8, V8.9 → plus de saut jusqu'à la V9.5).
# usage : python3 outils/lintcom.py   (lancé par ./tout.sh)   → liste les lignes suspectes ; rien = bon
import re,sys
bad=0
import glob
for f in sorted(glob.glob('src/*/*.js')):
    for i,l in enumerate(open(f,encoding='utf-8').read().split('\n'),1):
        for m in re.finditer(r'(?<![:\'"`\\/])//(?!/)',l):
            rest=l[m.end():]
            if re.search(r'[\w\]\)$][-+*]?=[\w$(\[\'"!-][^ ]*;\s*([\w$}]|$)|\w\([^ )]*\);[\w$]',rest) and not re.search(r'https?:$',l[:m.start()]):
                print('SUSPECT %s:%d  …%s'%(f,i,rest[:110]));bad+=1
            break
print('commentaires : %d ligne(s) suspecte(s)'%bad)
