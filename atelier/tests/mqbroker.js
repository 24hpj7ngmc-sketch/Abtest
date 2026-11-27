// Petit serveur de messages MQTT 3.1.1 sur WebSocket, pour tester le multi hors de Claude sans internet (V9.8). Aucune dépendance. Sert seulement aux tests : node tests/runmq.js le lance tout seul.
// Il fait ce que font les serveurs publics pour notre usage : CONNECT → CONNACK, SUBSCRIBE (filtre exact ou finissant par « + ») → SUBACK, PUBLISH → renvoyé à tous les abonnés, PINGREQ → PINGRESP.
const http=require('http'),crypto=require('crypto');
exports.start=port=>new Promise(ok=>{const conns=new Set(),stats={pub:0,conn:0};
  const srv=http.createServer((q,r)=>{r.writeHead(426);r.end();});
  srv.on('upgrade',(req,sock)=>{const key=req.headers['sec-websocket-key'],acc=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+acc+'\r\nSec-WebSocket-Protocol: mqtt\r\n\r\n');
    const c={sock,subs:[],ws:Buffer.alloc(0),mq:Buffer.alloc(0),frag:[]};conns.add(c);stats.conn++;
    const wsSend=buf=>{let h;if(buf.length<126)h=Buffer.from([0x82,buf.length]);else if(buf.length<65536){h=Buffer.alloc(4);h[0]=0x82;h[1]=126;h.writeUInt16BE(buf.length,2);}else{h=Buffer.alloc(10);h[0]=0x82;h[1]=127;h.writeBigUInt64BE(BigInt(buf.length),2);}try{sock.write(Buffer.concat([h,buf]));}catch(_){}};c.send=wsSend;
    const match=(f,t)=>f===t||(f.endsWith('+')&&t.startsWith(f.slice(0,-1))&&!t.slice(f.length-1).includes('/'));
    const mqtt=()=>{for(;;){if(c.mq.length<2)return;let n=0,m=1,i=1,b;do{if(i>=c.mq.length)return;b=c.mq[i++];n+=(b&127)*m;m*=128;}while(b&128);if(c.mq.length<i+n)return;const whole=c.mq.subarray(0,i+n),h=c.mq[0],d=c.mq.subarray(i,i+n);c.mq=c.mq.subarray(i+n);const t=h>>4;
        if(t===1)wsSend(Buffer.from([0x20,2,0,0]));else if(t===8){const tl=d.readUInt16BE(2);c.subs.push(d.subarray(4,4+tl).toString());wsSend(Buffer.from([0x90,3,d[0],d[1],0]));}
        else if(t===3){stats.pub++;const tl=d.readUInt16BE(0),topic=d.subarray(2,2+tl).toString();for(const o of conns)if(o.subs.some(f=>match(f,topic)))o.send(Buffer.from(whole));}
        else if(t===12)wsSend(Buffer.from([0xD0,0]));}};
    sock.on('data',chunk=>{c.ws=Buffer.concat([c.ws,chunk]);for(;;){if(c.ws.length<2)return;const fin=c.ws[0]&128,op=c.ws[0]&15,masked=c.ws[1]&128;let len=c.ws[1]&127,o=2;if(len===126){if(c.ws.length<4)return;len=c.ws.readUInt16BE(2);o=4;}else if(len===127){if(c.ws.length<10)return;len=Number(c.ws.readBigUInt64BE(2));o=10;}
        const need=o+(masked?4:0)+len;if(c.ws.length<need)return;let pay=Buffer.from(c.ws.subarray(o+(masked?4:0),need));if(masked){const mk=c.ws.subarray(o,o+4);for(let i=0;i<pay.length;i++)pay[i]^=mk[i&3];}c.ws=c.ws.subarray(need);
        if(op===8){sock.end();return;}if(op===9){continue;}c.frag.push(pay);if(fin){c.mq=Buffer.concat([c.mq,...c.frag]);c.frag=[];mqtt();}}});
    const bye=()=>conns.delete(c);sock.on('close',bye);sock.on('error',bye);});
  srv.listen(port,'127.0.0.1',()=>ok({stats,close:()=>{for(const c of conns)c.sock.destroy();srv.close();}}));});
if(require.main===module)exports.start(+process.argv[2]||18840).then(()=>console.log('serveur de test MQTT sur ws://127.0.0.1:'+(+process.argv[2]||18840)+'/mqtt'));
