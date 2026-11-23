//tiny stack VM, golf build: byte-exact interpreter for make.fun's tiny stack ISA.
import{readdirSync as R,readFileSync as F,writeFileSync as W,mkdirSync as M,existsSync as E}from"node:fs";
import{join as J}from"node:path";
const I=process.env.MAKEFUN_INPUT_DIR||"/input",O=process.env.MAKEFUN_OUTPUT_DIR||"/output",T="01146abfxxxxxxxx999999959995999x999xxxxxxxxxxxxx04400xxxxxxxxxxx58xxxxxxxxxxxxxx4414",U=f=>new Uint8Array(F(f));
function run(P,Q){const n=P.length,S=[],C=[],Y=new Int32Array(256),O=[];let p=0,s=0,a=0;const D=c=>[Uint8Array.from(O),c];
for(;;){if(s>=1e6)return D(10);if(p<0||p>=n)return D(9);const o=P[p],e=parseInt(T[o],16);if(e!==e)return D(5);const i=o==1?1:o==2?4:o>47&&o<52?2:0;if(p+i>=n)return D(9);s++;if(S.length<(e>>2))return D(2);if(S.length-(e>>2)+(e&3)>256)return D(3);const x=p+1+i;p=x;
if(o>15&&o<35&&o!=23&&o!=27){const b=S.pop(),v=S.pop();if(o>18&&o<23&&!b)return D(4);S.push((o==16?v+b:o==17?v-b:o==18?Math.imul(v,b):o==19?(v==-2147483648&&b==-1?v:(v/b)|0):o==20?(b==-1?0:v%b):o==21?(v>>>0)/(b>>>0)|0:o==22?(v>>>0)%(b>>>0):o==24?v&b:o==25?v|b:o==26?v^b:o==28?v<<b:o==29?v>>b:o==30?v>>>b:o==32?(v==b?1:0):o==33?(v<b?1:0):(v>>>0)<(b>>>0)?1:0)|0);continue}
switch(o){case 0:return D(0);case 1:S.push((P[x-1]<<24)>>24);break;case 2:S.push(P[x-4]|P[x-3]<<8|P[x-2]<<16|P[x-1]<<24);break;case 3:S.pop();break;case 4:S.push(S[S.length-1]);break;case 5:[S[S.length-1],S[S.length-2]]=[S[S.length-2],S[S.length-1]];break;case 6:S.push(S[S.length-2]);break;case 7:[S[S.length-3],S[S.length-2],S[S.length-1]]=[S[S.length-2],S[S.length-1],S[S.length-3]];break;case 23:S[S.length-1]=-S[S.length-1]|0;break;case 27:S[S.length-1]=~S[S.length-1];break;
case 48:case 49:case 50:{const r=((P[x-2]|P[x-1]<<8)<<16)>>16;let t=o==48;if(!t){const v=S.pop();t=o==49?v==0:v!=0}if(t)p=x+r;break}
case 51:if(C.length>=64)return D(7);C.push(x);p=P[x-2]|P[x-1]<<8;break;
case 52:if(!C.length)return D(8);p=C.pop();break;
case 64:{const v=S[S.length-1];if(v<0||v>255)return D(6);S[S.length-1]=Y[v];break}
case 65:{const v=S.pop();if(v<0||v>255)return D(6);Y[v]=S.pop();break}
case 80:{const v=S[S.length-1]+"";if(O.length+v.length>65536)return D(11);S.pop();O.push(...new TextEncoder().encode(v));break}
case 81:if(O.length>=65536)return D(11);O.push(S.pop()&255);break;
case 82:S.push(a<Q.length?Q[a++]:-1);break;
case 83:return D(S.pop()&255)}}}
for(const d of R(I,{withFileTypes:1}).filter(d=>d.isDirectory()).map(d=>d.name)){const q=J(I,d,"input.bin"),[b,c]=run(U(J(I,d,"program.bin")),E(q)?U(q):new Uint8Array(0));M(J(O,d),{recursive:true});W(J(O,d,"stdout.bin"),b);W(J(O,d,"exit.txt"),c+"\n")}
