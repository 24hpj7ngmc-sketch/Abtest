# repère les noms déclarés mais jamais relus dans la page assemblée (all.js). usage : python3 build.py && python3 deadcode.py
import re,sys
js=open('construit/all.js').read()
# retire commentaires et contenus de chaînes (grossier mais suffisant : on garde les gabarits `…` car ils contiennent du code ${…})
def strip(s):
    out=[];i=0;n=len(s)
    while i<n:
        c=s[i]
        if c=='/' and s[i:i+2]=='//':
            j=s.find('\n',i);j=n if j<0 else j;i=j;continue
        if c=='/' and s[i:i+2]=='/*':
            j=s.find('*/',i+2);i=n if j<0 else j+2;continue
        if c in '\'"':
            j=i+1
            while j<n and s[j]!=c:
                j+=2 if s[j]=='\\' else 1
            out.append(c+s[i+1:j]+c);i=j+1;continue      # les chaînes restent : un nom cité dans une chaîne (id HTML, nom de modèle) compte comme utilisé
        out.append(c);i+=1
    return ''.join(out)
code=strip(js)
html=open('src/page/page.html').read()
cnt={}
for m in re.finditer(r'[A-Za-z_$][\w$]*',code):cnt[m.group()]=cnt.get(m.group(),0)+1
decl={}
for m in re.finditer(r'\bfunction\s+([A-Za-z_$][\w$]*)',code):decl[m.group(1)]='function'
for m in re.finditer(r'(?:\b(?:const|let|var)\s+|,)([A-Za-z_$][\w$]*)\s*=(?!=|>)',code):decl.setdefault(m.group(1),'variable')
dead=[(k,v) for k,v in decl.items() if cnt.get(k,0)==1 and k not in html]
print(len(dead),'noms déclarés et jamais relus :')
for k,v in sorted(dead,key=lambda x:x[1]):
    i=re.search(r'(?<![\w$.])'+re.escape(k)+r'(?![\w$])',code).start();print(' ',v.ljust(9),k.ljust(18),code[max(0,i-30):i+70].replace('\n',' '))
