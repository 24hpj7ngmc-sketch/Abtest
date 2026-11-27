# Contrôle d'un fichier de mini-jeu à l'arrivée, avant de le coller dans le lobby (contrat : claude/mini-jeu-contrat-lobby.md).
# usage : python3 -I verif-minijeu.py <nouveau fichier> <taille attendue> <sha256 attendu> <variable> [<fichier collé jusqu'ici>]
import hashlib, re, sys
f, taille, sha, var = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]
b = open(f, 'rb').read(); s = b.decode('utf-8')
ok = True
def dit(nom, cond, detail=''):
    global ok
    ok = ok and cond
    print(('ok   ' if cond else 'RATÉ ') + nom + (' — ' + str(detail) if detail != '' else ''))
dit('taille', len(b) == taille, len(b))
dit('sha256', hashlib.sha256(b).hexdigest() == sha, hashlib.sha256(b).hexdigest())
dit('aucun </script dans le fichier', re.search(r'</script', s, re.I) is None)
hosts = sorted(set(re.findall(r'https?://([A-Za-z0-9.-]+)', s)))
permis = {'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'www.w3.org'}
dit('adresses extérieures permises seulement', set(hosts) <= permis, hosts)
dit('three.js r128 sur cdnjs', 'cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js' in s)
appels = {k: len(re.findall(k, s)) for k in [r'\bfetch\s*\(', r'XMLHttpRequest', r'\bWebSocket\b', r'sendBeacon', r'EventSource', r'importScripts', r'navigator\.serviceWorker', r'\beval\s*\(', r'new Function\s*\(', r'document\.cookie', r'window\.top\b', r'\.parent\b']}
print('     appels à surveiller :', {k: v for k, v in appels.items() if v})
dit('aucun appel réseau', not any(appels[k] for k in [r'\bfetch\s*\(', r'XMLHttpRequest', r'\bWebSocket\b', r'sendBeacon', r'EventSource', r'importScripts', r'navigator\.serviceWorker']))
cles = sorted(set(re.findall(r'''localStorage\.(?:getItem|setItem|removeItem)\(\s*['"]([^'"]+)['"]''', s)))
print('     clés de sauvegarde écrites en clair :', cles, '· localStorage cité', s.count('localStorage'), 'fois')
# la clé d'un jeu lui appartient : Dernier Toit garde la sienne (dernier-toit-v1), on ne lui interdit que celles des autres (corrigé à la V11.7, le contrôle le refusait à tort)
autres = ['ile5-save'] + ([] if var == 'DernierToit' else ['dernier-toit'])
dit('ne touche ni la sauvegarde du lobby ni celle d\'un autre jeu', not any(k in s for k in autres), [k for k in autres if k in s])
glob = sorted(set(re.findall(r'^(?:var|let|const|function)\s+([A-Za-z_$][\w$]*)', s, re.M)))
print('     déclarations en début de ligne :', glob[:12], '…' if len(glob) > 12 else '')
dit('la variable ' + var + ' est déclarée', re.search(r'\b(?:var|const|let)\s+' + var + r'\b', s) is not None or ('window.' + var) in s)
v = re.findall(r"version\s*[:=]\s*['\"](V[\d.]+)['\"]", s)
print('     versions écrites :', sorted(set(v)))
if len(sys.argv) > 5:
    o = open(sys.argv[5], encoding='utf-8').read()
    i = 0
    n = min(len(o), len(s))
    while i < n and o[i] == s[i]: i += 1
    j = 0
    while j < n - i and o[-1 - j] == s[-1 - j]: j += 1
    print('     comparé au fichier collé jusqu\'ici : même début sur', i, 'caractères, même fin sur', j, '· milieu : avant', len(o) - i - j, 'caractères, après', len(s) - i - j)
    oh = sorted(set(re.findall(r'https?://([A-Za-z0-9.-]+)', o)))
    dit('mêmes adresses extérieures qu\'avant', oh == hosts, (oh, hosts))
    oa = {k: len(re.findall(k, o)) for k in appels}
    dit('mêmes appels à surveiller qu\'avant', oa == appels, {k: (oa[k], appels[k]) for k in appels if oa[k] != appels[k]})
print('VERDICT :', 'bon à coller' if ok else 'NE PAS COLLER')
