// Compare deux fichiers JavaScript par leur arbre de code : mêmes instructions, dans le même ordre, mêmes valeurs.
// Ne compte pas : les espaces, les retours à la ligne, les commentaires, les parenthèses superflues, le choix des guillemets, l'écriture des nombres (.5 = 0.5), un point-virgule vide.
// usage : node astcmp.js ancien.js nouveau.js   → « identiques » ou la première différence
const ts=require(process.env.TS||'/home/claude/.npm-global/lib/node_modules/typescript');const fs=require('fs');
function canon(file){const src=fs.readFileSync(file,'utf8'),sf=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);const out=[];
  if(sf.parseDiagnostics&&sf.parseDiagnostics.length){console.error(file,': erreur de syntaxe',ts.flattenDiagnosticMessageText(sf.parseDiagnostics[0].messageText,' '));process.exit(2);}
  const K=ts.SyntaxKind;
  (function walk(n){
    if(n.kind===K.ParenthesizedExpression){walk(n.expression);return;}
    if(n.kind===K.EmptyStatement)return;
    if(n.kind===K.StringLiteral||n.kind===K.NoSubstitutionTemplateLiteral&&false){out.push('S:'+n.text);return;}
    if(n.kind===K.NumericLiteral){out.push('N:'+Number(n.text));return;}
    if(n.kind===K.BigIntLiteral||n.kind===K.RegularExpressionLiteral){out.push('L:'+n.text);return;}
    if(n.kind===K.NoSubstitutionTemplateLiteral||n.kind===K.TemplateHead||n.kind===K.TemplateMiddle||n.kind===K.TemplateTail){out.push('T'+n.kind+':'+(n.rawText!==undefined?n.rawText:n.text));return;}
    if(n.kind===K.Identifier||n.kind===K.PrivateIdentifier){out.push('I:'+n.text);return;}
    // un bloc d'une seule instruction et l'instruction seule ne sont PAS confondus ; les jetons (opérateurs, mots-clés) comptent
    out.push('<'+n.kind);
    if(ts.isToken(n)&&n.kind>=K.FirstPunctuation)out.push('k'+n.kind);
    n.forEachChild(walk);
    // les marqueurs que forEachChild ne visite pas mais qui changent le sens
    if(n.kind===K.VariableDeclarationList)out.push('f'+(n.flags&(ts.NodeFlags.Let|ts.NodeFlags.Const)));
    if(n.kind===K.PrefixUnaryExpression||n.kind===K.PostfixUnaryExpression)out.push('o'+n.operator);
    if(n.kind===K.PropertyAccessExpression||n.kind===K.ElementAccessExpression||n.kind===K.CallExpression)out.push(n.questionDotToken?'?.':'.');
    out.push('>');
  })(sf);
  return out;}
const [a,b]=process.argv.slice(2).map(canon);let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;
if(i===a.length&&i===b.length){console.log('identiques ('+a.length+' éléments)');process.exit(0);}
console.log('DIFFÉRENTS à l\'élément',i,'sur',a.length,'/',b.length);console.log(' ancien  :',a.slice(Math.max(0,i-12),i+12).join(' '));console.log(' nouveau :',b.slice(Math.max(0,i-12),i+12).join(' '));process.exit(1);
