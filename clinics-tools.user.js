// ==UserScript==
// @name         CLINICS ツールまとめ
// @namespace    clinics-tools
// @version      2026.1105.1339
// @description  CLINICS用ツールをまとめて入れるスクリプト（CLINICS 便利ボタン／CLINICS 負担割合表示／CLINICS 不要なレセプト指摘を隠す）。データは外部に送りません。
// @match        https://karte.medley.life/*
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/chikamoto8270-droid/clinics-tools/main/clinics-tools.user.js
// @downloadURL  https://raw.githubusercontent.com/chikamoto8270-droid/clinics-tools/main/clinics-tools.user.js
// ==/UserScript==
// このファイルは build.py で自動生成されます。直接編集せず、各 *.user.js を編集してください。
// Tampermonkeyのメニューから機能ごとにオン・オフできる（設定はこのパソコンに保存）。
function __tool(name, key, run) {
  const off = GM_getValue(key, false);
  GM_registerMenuCommand((off ? '⬜ オフ｜' : '✅ オン｜') + name, () => { GM_setValue(key, !off); location.reload(); });
  if (off) return;
  try { run(); } catch (e) { console.error('[' + name + ']', e); }
}
GM_registerMenuCommand('ℹ 各機能の説明を見る', () => alert('■ 便利ボタン：レセプト結果確認のページ移動・指摘まとめ／受付一覧の医師別集計\n次の3つが使えます。【ページ移動】レセプト一括出力の結果確認で、番号を入れたページへ一気に移動（空欄なら、チェックが終わっていない最初のページまで進む）。【指摘まとめ】結果確認の全ページを読み取り、不要な指摘を除いて1つの一覧に（CSV保存・印刷）。【担当医師別の集計】受付一覧の全ページを読み取り、担当医師ごとに午前（13:30まで）・午後の患者数と、メモ欄の「初」（初診）・「旧」（再初診）の人数を数える。メニュー、またはレセプト画面・受付一覧の右下のボタンから使います。データは外部に送りません。\n\n■ 負担割合表示：カルテの患者番号の横に自己負担割合を表示\nカルテ画面の患者番号の横に、自己負担割合（3割など）、公費を使ったあとの負担、本人／家族、所得区分を小さく表示します。表示するだけで、データは外部に送りません。\n\n■ 指摘を隠す：レセプト結果確認の消せない指摘を非表示\nレセプトチェックの結果確認で、ベースアップ評価料(2)とリハビリテーション総合計画評価料1(2回目以降)の指摘行を自動で隠します。データの変更や外部送信はしません。\n\n各機能は、このメニューの「✅ オン／⬜ オフ」を押すと切り替えられます。'));
// ---- CLINICS 便利ボタン (clinics-buttons.user.js) ----
__tool('便利ボタン：レセプト結果確認のページ移動・指摘まとめ／受付一覧の医師別集計', 'off:clinics-buttons.user.js', () => {
// CLINICS 便利ボタン v1.0
// 中身は以前のブックマークレットと同じ。押したときだけ動き、画面のボタンを自動で押して読み取るだけ（データは変更・送信しない）。
(() => {
  // レセプト結果確認: 指定ページへ移動（空欄ならチェックが終わっていないページまで進む）
  const pageJump = () => { (async()=>{const a=prompt('何ページ目に移動しますか？\n空欄のままOKを押すと、チェックが終わっていないページまで進みます。','');if(a===null)return;const t=parseInt(a.normalize('NFKC'),10);const w=m=>new Promise(r=>setTimeout(r,m));const vis=e=>e.getClientRects().length>0;const T=e=>(e.innerText||e.textContent||'').trim();const N=s=>s.normalize('NFKC').replace(/\s/g,'');const bad=s=>{s=N(s);return (s.includes('ベースアップ評価料(2)')&&s.includes('ベースアップ評価料(1)')&&s.includes('ありません'))||(s.includes('リハビリテーション総合計画評価料1(2回目以降')&&s.includes('根拠となるリハビリテーション料'))};const nums=()=>{const L=[...document.querySelectorAll('body *')].filter(e=>e.children.length===0&&/^\d{1,4}$/.test(e.textContent.trim())&&vis(e));const rows={};L.forEach(e=>{const k=Math.round(e.getBoundingClientRect().top/10);(rows[k]=rows[k]||[]).push(e)});let best=null;Object.keys(rows).map(Number).sort((a,b)=>a-b).forEach(k=>{const r=rows[k].sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left);const v=r.map(e=>+e.textContent.trim());if(r.length>=2&&v.every((x,i)=>i===0||x===v[i-1]+1))best=r});return best};const K=()=>{const r=nums();return r?r.map(e=>e.textContent.trim()).join(','):''};const wc=async k=>{for(let j=0;j<200;j++){const c=K();if(c&&c!==k)return;await w(50)}};const waitNums=async()=>{let r=nums();for(let j=0;j<100&&!r;j++){await w(50);r=nums()}return r};if(t){let last='';for(let i=0;i<300;i++){const r=await waitNums();if(!r){alert('ページ番号ボタンが見つかりませんでした');return}const v=r.map(e=>+e.textContent.trim());const hit=r.find(e=>+e.textContent.trim()===t);if(hit){hit.click();return}const key=v.join(',');if(key===last){alert('これ以上移動できませんでした（最大'+Math.max(...v)+'ページの可能性があります）');return}last=key;(t>v[v.length-1]?r[r.length-1]:r[0]).click();await wc(key);await w(100)}return}const tables=()=>[...document.querySelectorAll('table')].filter(t=>vis(t)&&t.querySelector('th')&&/指摘/.test(T(t.querySelector('tr'))));const on=c=>{const i=c.matches('input')?c:c.querySelector('input[type=checkbox]');if(i)return i.checked;const ac=c.getAttribute('aria-checked')||(c.querySelector('[aria-checked]')||{getAttribute:()=>null}).getAttribute('aria-checked');if(ac!==null)return ac==='true';return/(^|[\s_-])(is-?)?(checked|selected|active|on)([\s_-]|$)/i.test(c.className+' '+[...c.querySelectorAll('*')].map(x=>x.getAttribute('class')||'').join(' '))||!!c.querySelector('svg,i,img')};const box=r=>{const b=r.querySelector('input[type=checkbox],[role=checkbox]');if(b)return b;const c=[...r.cells].find(c=>T(c)===''&&c.querySelector('*'));return c||null};const open=()=>{let n=0,u=0;tables().forEach(t=>[...t.rows].filter(r=>!r.querySelector('th')&&vis(r)).forEach(r=>{const b=box(r);if(!b)return;n++;if(!bad(T(r))&&!on(b))u++}));return{n,u}};const cur=r=>{const bg=r.map(e=>{let x=e;while(x&&x!==document.body){const c=getComputedStyle(x).backgroundColor;if(c&&c!=='rgba(0, 0, 0, 0)'&&c!=='transparent')return c;x=x.parentElement}return''});const cnt={};bg.forEach(c=>cnt[c]=(cnt[c]||0)+1);const i=bg.findIndex(c=>cnt[c]===1);const ac=r.find(e=>e.closest('[aria-current=page],[aria-current=true]'));return ac?+ac.textContent.trim():i>=0?+r[i].textContent.trim():NaN};for(let i=0;i<500;i++){let s=open();if(!s.n){for(let j=0;j<100&&!s.n;j++){await w(50);s=open()}if(!s.n){alert('チェック欄が見つかりませんでした');return}}if(s.u>0)return;const r=await waitNums();if(!r){alert('ページ番号ボタンが見つかりませんでした');return}const c=cur(r);if(isNaN(c)){alert('今のページ番号がわかりませんでした');return}const b=r.find(e=>+e.textContent.trim()===c+1);if(!b){alert('最後のページまで、すべてチェック済みです');return}b.click();let ok=false;for(let j=0;j<300;j++){await w(50);const q=nums();if(q&&cur(q)===c+1&&tables().length){ok=true;break}}if(!ok){alert('次のページに進めませんでした');return}await w(150);}})(); };
  // レセプト結果確認: 全ページを読み取り、不要な指摘を除いた一覧を表示
  const summary = () => { (async()=>{if(!confirm('結果確認の1ページ目を表示した状態で押してください。全ページを読み取って、ベースアップ評価料（２）・リハビリ総合計画評価料１の指摘を除いた一覧をこの画面に表示します。始めますか？'))return;const ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.35);pointer-events:none';const msg=document.createElement('div');msg.style.cssText='position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#fff;padding:10px 16px;border-radius:8px;font:15px sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.3)';msg.textContent='読み取り中です…';ov.appendChild(msg);document.body.appendChild(ov);const w=m=>new Promise(r=>setTimeout(r,m));const vis=e=>e.getClientRects().length>0;const T=e=>(e.innerText||e.textContent||'').trim();const N=s=>s.normalize('NFKC').replace(/\s/g,'');const bad=s=>{s=N(s);return (s.includes('ベースアップ評価料(2)')&&s.includes('ベースアップ評価料(1)')&&s.includes('ありません'))||(s.includes('リハビリテーション総合計画評価料1(2回目以降')&&s.includes('根拠となるリハビリテーション料'))};const pg=e=>[...e.querySelectorAll('button,a,li,[role=button]')].some(b=>/^\d+$/.test(b.textContent.trim()));const nums=()=>{const L=[...document.querySelectorAll('body *')].filter(e=>e.children.length===0&&/^\d{1,4}$/.test(e.textContent.trim())&&vis(e));const rows={};L.forEach(e=>{const k=Math.round(e.getBoundingClientRect().top/10);(rows[k]=rows[k]||[]).push(e)});let best=null;Object.keys(rows).map(Number).sort((a,b)=>a-b).forEach(k=>{const r=rows[k].sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left);const v=r.map(e=>+e.textContent.trim());if(r.length>=2&&v.every((x,i)=>i===0||x===v[i-1]+1))best=r});return best};const tables=()=>[...document.querySelectorAll('table')].filter(t=>vis(t)&&t.querySelector('th')&&/指摘/.test(T(t.querySelector('tr'))));const sig=()=>tables().map(T).join('|');let H=null;const R=[];let pi=0;const read=()=>{tables().forEach(t=>{const hr=[...t.rows].find(r=>r.querySelector('th'));const hs=[...hr.cells].map(T);if(!H)H=hs;let el=t;while(el.parentElement&&el.parentElement!==document.body&&!el.parentElement.matches('[role=dialog],[aria-modal=true]')&&el.parentElement.querySelectorAll('table').length===1&&!pg(el.parentElement))el=el.parentElement;let blk=el===t?'':T(el).replace(T(t),'').trim();let pat='';[...t.rows].filter(r=>!r.querySelector('th')).forEach(r=>{let cs=[...r.cells];if(cs.length>hs.length){pat=cs.slice(0,cs.length-hs.length).map(T).join(' ');cs=cs.slice(cs.length-hs.length)}else if(cs.length<hs.length){cs=Array(hs.length-cs.length).fill(null).concat(cs)}const v=cs.map(c=>c?T(c).replace(/\s*設定$/,''):'');const who=(blk+' '+pat).trim()||'(不明)';if(!bad(v.join(' ')))R.push({who,v});else pi++;})})};const t0=sig();if(!t0){ov.remove();alert('結果確認の表が見つかりませんでした');return}let p=1;for(;p<500;p++){read();msg.textContent='読み取り中… '+p+'ページ目（このタブを表示したままにしてください）';let r=nums();if(!r)break;let b=r.find(e=>+e.textContent.trim()===p+1);if(!b)break;const s=sig();b.click();let ok=false;for(let j=0;j<300;j++){await w(50);const c=sig();if(c&&c!==s){ok=true;break}}if(!ok){alert(p+'ページ目から先に進めませんでした。ここまでの分でまとめます。');break}await w(150);}const E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);const keep=H.map((h,i)=>h!==''||R.some(x=>x.v[i]&&x.v[i]!==''));const hd=['患者'].concat(H.filter((h,i)=>keep[i]&&h!==''));const ix=H.map((h,i)=>i).filter(i=>keep[i]&&H[i]!=='');const pts=[...new Set(R.map(x=>x.who))];let rows='';let prev=null;R.forEach(x=>{rows+='<tr'+(x.who!==prev?' class=f':'')+'><td>'+(x.who!==prev?E(x.who):'')+'</td>'+ix.map(i=>'<td>'+E(x.v[i]||'')+'</td>').join('')+'</tr>';prev=x.who});const csv='\ufeff'+[hd].concat(R.map(x=>[x.who].concat(ix.map(i=>x.v[i]||'')))).map(a=>a.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const html=('<!doctype html><meta charset=utf-8><title>レセプト指摘まとめ</title><style>body{font:14px sans-serif;margin:16px;color:#222}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 8px;vertical-align:top;text-align:left}th{background:#eef1f5;position:sticky;top:0}tr.f td{border-top:2px solid #889}.bar a,.bar button{margin-right:8px;font-size:14px}@media print{.bar{display:none}}</style><h1 style="font-size:20px">レセプト指摘まとめ（ベースアップ評価料（２）・リハビリ総合計画評価料１の指摘を除く）</h1><p>'+p+'ページ分を読み取り、患者 '+pts.length+'人・指摘 '+R.length+'件（除外 '+pi+'件）。作成 '+new Date().toLocaleString()+'</p><p class=bar><a download="レセプト指摘まとめ.csv" href="'+url+'">CSVで保存（Excel用）</a><button id=hzp>印刷</button><button id=hzc>閉じる</button></p><table><thead><tr>'+hd.map(h=>'<th>'+E(h)+'</th>').join('')+'</tr></thead><tbody>'+rows+'</tbody></table>');ov.remove();const fr=document.createElement('iframe');fr.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647;border:0;background:#fff';fr.srcdoc=html;fr.onload=()=>{const d=fr.contentDocument;d.getElementById('hzp').onclick=()=>fr.contentWindow.print();d.getElementById('hzc').onclick=()=>fr.remove()};document.body.appendChild(fr);})(); };
  // 受付一覧: 担当医師別に午前・午後の患者数を集計
  const doctorCount = () => { (async()=>{if(!confirm("受付一覧の全ページを読み取って、担当医師ごとの午前（13:30までの受付）・午後（13:31以降の受付）の患者数を集計します。\nステータスが「キャンセル」の患者は数えません。終わったら結果を別のタブで表示します。始めますか？"))return;const t=t=>new Promise(e=>setTimeout(e,t)),e=t=>t.getClientRects().length>0,n=t=>(t.innerText||t.textContent||"").replace(/\s+/g," ").trim(),o=t=>t.normalize("NFKC").replace(/\s/g,""),r=document.createElement("div");r.style.cssText="position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.35);pointer-events:none";const l=document.createElement("div");l.style.cssText="position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#fff;padding:10px 16px;border-radius:8px;font:15px sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.3)",l.textContent="読み取り中です…",r.appendChild(l),document.body.appendChild(r);const a=t=>{const e=o(t).match(/(\d{1,2})[:：時](\d{2})/);return e?60*+e[1]+ +e[2]:null},s=()=>(()=>{const t=[];if(document.querySelectorAll("table").forEach(o=>{if(!e(o))return;const r=[...o.rows].filter(e),l=r.findIndex(t=>t.querySelector("th")),a=r[l>=0?l:0];a&&t.push({el:o,head:[...a.cells].map(n),rows:r.slice((l>=0?l:0)+1).filter(t=>!t.querySelector("th")).map(t=>[...t.cells].map(n))})}),!t.length){const o=[...document.querySelectorAll("[role=row]")].filter(e),r=o.find(t=>t.querySelector("[role=columnheader]"));r&&t.push({el:r.closest("[role=grid],[role=table]")||r.parentElement,head:[...r.querySelectorAll("[role=columnheader]")].map(n),rows:o.filter(t=>t!==r&&!t.querySelector("[role=columnheader]")).map(t=>[...t.querySelectorAll("[role=cell],[role=gridcell]")].map(n))})}return t.map(t=>{const e=t.head.map(o);let n=e.findIndex(t=>/医師|ドクター|Dr/i.test(t));n<0&&(n=e.findIndex(t=>/担当/.test(t)));const r=e=>{const n=t.rows.map(t=>t[e]||"").filter(t=>t);return n.length&&n.filter(t=>null!==a(t)).length>=.5*n.length};let l=e.findIndex((t,e)=>/受付/.test(t)&&/時|日時/.test(t)&&r(e));l<0&&(l=e.findIndex((t,e)=>/受付/.test(t)&&!/予約/.test(t)&&r(e))),l<0&&(l=e.findIndex((t,e)=>/来院|到着/.test(t)&&r(e))),l<0&&(l=e.findIndex((t,e)=>/時刻|時間/.test(t)&&!/予約/.test(t)&&r(e)));const s=e.findIndex(t=>/ステータス|状態|状況/.test(t)),i=e.findIndex(t=>/メモ/.test(t));return Object.assign(t,{dc:n,tc:l,sc:s,mc:i})}).filter(t=>t.dc>=0&&t.rows.length)})().sort((t,e)=>(e.tc>=0)-(t.tc>=0)||e.rows.length-t.rows.length)[0],i=()=>{const t=s();return t?t.rows.map(t=>t.join("|")).join("\n"):""},c=()=>{const t=[...document.querySelectorAll("body *")].filter(t=>0===t.children.length&&/^\d{1,4}$/.test(t.textContent.trim())&&e(t)),n={};t.forEach(t=>{const e=Math.round(t.getBoundingClientRect().top/10);(n[e]=n[e]||[]).push(t)});let o=null;return Object.keys(n).map(Number).sort((t,e)=>t-e).forEach(t=>{const e=n[t].sort((t,e)=>t.getBoundingClientRect().left-e.getBoundingClientRect().left),r=e.map(t=>+t.textContent.trim());e.length>=2&&r.every((t,e)=>0===e||t===r[e-1]+1)&&(o=e)}),o};let d=s();for(let e=0;e<60&&!d;e++)await t(100),d=s();if(!d)return r.remove(),void alert("「担当医師」の列がある表が見つかりませんでした。受付一覧の画面のスクリーンショットを送ってください。");if(d.tc<0)return r.remove(),void alert("受付時刻の列が見つかりませんでした。受付一覧の画面のスクリーンショットを送ってください。\n見つかった列: "+d.head.join(" / "));const p=d.head,f=d.dc,x=d.tc,m=d.sc,u=d.mc,b={};let h=0,g=0,y=0,v=0,k=0;const w={a:0,b:0,x:0},C={a:0,b:0,x:0},z=new Set,E=()=>{const t=s();t&&t.rows.forEach(t=>{if(t.length<Math.max(f,x)+1)return;const e=t.join("|");if(z.has(e))return;if(z.add(e),/キャンセル/.test(o(m>=0?t[m]||"":e)))return void k++;const n=(t[f]||"").trim()||"(未設定)",r=a(t[x]||""),l=b[n]=b[n]||{a:0,b:0,x:0,f:0,r:0};v++;const s=null===r?"x":r<=810?"a":"b";l[s]++,"a"===s?h++:"b"===s?g++:y++;const i=u>=0?o(t[u]||""):"";/旧/.test(i)?(l.r++,C[s]++):/初/.test(i)&&(l.f++,w[s]++)})},S=async(e,n)=>{const o=Date.now()+50*n;let r="";for(;Date.now()<o&&(await t(15),r=i(),!r||r===e););if(!r||r===e)return!1;let l=0;for(;l<3&&Date.now()<o+3e3;){await t(15);const e=i();e===r?l++:(l=0,r=e)}return!0},j=t=>{const e=t.find(t=>t.closest("[aria-current=page],[aria-current=true]"));if(e)return+e.textContent.trim();const n=t.map(t=>{let e=t;for(;e&&e!==document.body;){const t=getComputedStyle(e).backgroundColor;if(t&&"rgba(0, 0, 0, 0)"!==t&&"transparent"!==t)return t;e=e.parentElement}return""}),o={};n.forEach(t=>o[t]=(o[t]||0)+1);const r=n.findIndex(t=>1===o[t]);return r>=0?+t[r].textContent.trim():NaN};l.textContent="1ページ目に戻っています…";for(let t=0;t<300;t++){const t=c();if(!t)break;const e=t.find(t=>1===+t.textContent.trim()),n=i();if(e){1!==j(t)&&(e.click(),await S(n,20));break}if(t[0].click(),!await S(n,300))break}let I=1;for(;I<500;I++){E(),l.textContent="読み取り中… "+I+"ページ目（このタブを表示したままにしてください）";const t=c();if(!t)break;const e=t.find(t=>+t.textContent.trim()===I+1);if(!e)break;const n=i();e.click();if(!await S(n,300)){alert(I+"ページ目から先に進めませんでした。ここまでの分で集計します。");break}}const q=t=>String(t).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[t])),T=Object.keys(b).sort((t,e)=>b[e].a+b[e].b+b[e].x-(b[t].a+b[t].b+b[t].x)),B=y>0,R=["担当医師","午前（13:30まで）","午後（13:31以降）"].concat(B?["受付時刻なし"]:[]).concat(["1日の合計","初診","再初診"]),A=(t,e)=>[t,e.a,e.b].concat(B?[e.x]:[]).concat([e.a+e.b+e.x,e.f,e.r]),D=T.map(t=>A(t,b[t])),L=t=>t.a+t.b+t.x,N=A("全体の合計",{a:h,b:g,x:y,f:L(w),r:L(C)});let O=0,M=0,U=0,F=0,H=0;T.filter(t=>!(t=>/リハ指示/.test(o(t)))(t)).forEach(t=>{O+=b[t].a,M+=b[t].b,U+=b[t].x,F+=b[t].f,H+=b[t].r});const K=A("診察（リハ指示用を除く）",{a:O,b:M,x:U,f:F,r:H}),P="\ufeff"+[R].concat(D,[N,K]).map(t=>t.map(t=>'"'+String(t).replace(/"/g,'""')+'"').join(",")).join("\r\n"),V=(t,e)=>"<tr"+(e?" class="+e:"")+">"+t.map((t,e)=>"<td"+(e?" class=n":"")+">"+q(t)+"</td>").join("")+"</tr>",X=(t,e)=>"<div class=k><div class=kl>"+t+"</div><div class=kv>"+e+"<small>人</small></div></div>",$='<!doctype html><meta charset=utf-8><title>担当医師別 患者数</title><style>body{font:15px sans-serif;margin:24px;color:#222}.ks{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0 24px}.k{border:1px solid #ccd;border-radius:10px;padding:12px 20px;min-width:150px;background:#f7f9fc}.kl{font-size:14px;color:#555}.kv{font-size:32px;font-weight:bold}.kv small{font-size:15px;margin-left:4px}table{border-collapse:collapse;min-width:520px}th,td{border:1px solid #ccc;padding:8px 14px;text-align:left}th{background:#eef1f5}td.n,th.n{text-align:right}tr.t td{font-weight:bold;background:#f6f6f6;border-top:2px solid #889}.bar button{margin-right:8px;font-size:14px}.s{color:#666;font-size:13px}@media print{.bar{display:none}}</style><h1 style="font-size:22px">担当医師別 患者数</h1><h2 style="font-size:17px;margin:0">全体</h2><div class=ks>'+X("午前（13:30までに受付）",h)+X("午後（13:31以降に受付）",g)+(B?X("受付時刻なし",y):"")+X("1日の合計",h+g+y)+'</div><h2 style="font-size:17px;margin:0">診察（リハ指示用を除く）</h2><div class=ks>'+X("午前の診察",O)+X("午後の診察",M)+(U?X("受付時刻なし",U):"")+X("1日の診察",O+M+U)+"</div>"+(u>=0?'<h2 style="font-size:17px;margin:0">初診（メモに「初」）</h2><div class=ks>'+X("午前の初診",w.a)+X("午後の初診",w.b)+(w.x?X("受付時刻なし",w.x):"")+X("1日の初診",L(w))+'</div><h2 style="font-size:17px;margin:0">再初診（メモに「旧」）</h2><div class=ks>'+X("午前の再初診",C.a)+X("午後の再初診",C.b)+(C.x?X("受付時刻なし",C.x):"")+X("1日の再初診",L(C))+"</div>":'<p style="color:#b00">メモの列が見つからなかったため、初診・再初診は数えていません。</p>')+"<table><thead><tr>"+R.map((t,e)=>"<th"+(e?" class=n":"")+">"+q(t)+"</th>").join("")+"</tr></thead><tbody>"+D.map(t=>V(t)).join("")+V(N,"t")+V(K,"t")+'</tbody></table><p class=bar style="margin-top:16px"><button id=hzv>CSVで保存（Excel用）</button><button id=hzp>印刷</button></p><p class=s>'+I+"ページ分を読み取り、"+v+"人を集計しました（ステータスがキャンセルの "+k+"人は除外）。作成 "+q((new Date).toLocaleString())+"<br>※ 13:30ちょうどの受付は午前に数えています。<br>※ メモに「旧」がある人を再初診、「旧」がなく「初」がある人を初診として数えています。<br>※ 使った列：担当医師＝「"+q(p[f])+"」、受付時刻＝「"+q(p[x])+"」"+(u>=0?"、メモ＝「"+q(p[u])+"」":"")+(m>=0?"、ステータス＝「"+q(p[m])+"」":"（ステータス列が見つからないため、行のどこかに「キャンセル」とある行を除外）")+"</p>",_=()=>{const t=window.open("","_blank");if(!t)return!1;t.document.open(),t.document.write($),t.document.close();const e=t.document;return e.getElementById("hzp").onclick=()=>t.print(),e.getElementById("hzv").onclick=()=>{const t=document.createElement("a");t.href=URL.createObjectURL(new Blob([P],{type:"text/csv"})),t.download="担当医師別患者数.csv",document.body.appendChild(t),t.click(),t.remove()},!0};if(_())return void r.remove();r.style.pointerEvents="auto",l.innerHTML="",l.append("集計が終わりました。 ");const G=document.createElement("button");G.textContent="結果を別のタブで開く",G.style.cssText="font-size:15px;padding:6px 12px;margin-left:8px";const J=document.createElement("button");J.textContent="閉じる",J.style.cssText="font-size:15px;padding:6px 12px;margin-left:8px",G.onclick=()=>{_()?r.remove():alert("別のタブを開けませんでした。アドレスバー右端のポップアップのマークから「常に許可」を選んで、もう一度押してください。")},J.onclick=()=>r.remove(),l.append(G,J)})(); };

  GM_registerMenuCommand('　└ レセプト結果確認：番号のページへ移動（空欄なら未チェックのページへ）', pageJump);
  GM_registerMenuCommand('　└ レセプト結果確認：全ページの指摘を1つの一覧にまとめる（CSV・印刷）', summary);
  GM_registerMenuCommand('　└ 受付一覧：担当医師別に午前・午後の患者数を数える', doctorCount);

  // レセプト一括出力の画面と受付一覧では、右下に小さなボタンも出す
  const BAR = 'clinics-buttons-bar';
  const sync = () => {
    // 受付一覧は「担当医師」という見出しが見えているかで判定する
    const reception = [...document.querySelectorAll('th,[role=columnheader],thead *,div,span')].some(e =>
      e.children.length === 0 && (e.textContent || '').trim() === '担当医師' && e.getClientRects().length);
    const kind = location.pathname.startsWith('/d/settings/receipts') ? 'receipt' : reception ? 'reception' : '';
    let bar = document.getElementById(BAR);
    if (bar && bar.dataset.kind !== kind) { bar.remove(); bar = null; }
    const want = !!kind;
    if (want && !bar) {
      bar = document.createElement('div');
      bar.id = BAR;
      bar.dataset.kind = kind;
      bar.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483000;display:flex;gap:6px';
      const items = kind === 'receipt'
        ? [['ページ移動', pageJump, '番号を入れたページへ移動します。空欄でOKならチェックが終わっていないページまで進みます'], ['指摘まとめ', summary, '全ページの指摘を読み取り、不要な指摘を除いて1つの一覧にします（CSV保存・印刷）']]
        : [['医師別の患者数を集計', doctorCount, '受付一覧の全ページを読み取り、担当医師ごとに午前（13:30まで）・午後の患者数を数えます']];
      items.forEach(([label, fn, tip]) => {
        const b = document.createElement('button');
        b.textContent = label;
        b.title = tip;
        b.style.cssText = 'font:12px sans-serif;padding:4px 10px;border:1px solid #889;border-radius:6px;background:#fff;color:#333;cursor:pointer;opacity:.85';
        b.onclick = fn;
        bar.appendChild(b);
      });
      document.body.appendChild(bar);
    } else if (!want && bar) bar.remove();
  };
  sync();
  setInterval(sync, 1000);
})();
});

// ---- CLINICS 負担割合表示 (clinics-futan.user.js) ----
__tool('負担割合表示：カルテの患者番号の横に自己負担割合を表示', 'off:clinics-futan.user.js', () => {
// CLINICS 負担割合表示 v2.3
// カルテ画面で、見えない小さな画面に「保険情報」を開いて「補助」(負担割合) と公費を読み取り、患者番号の横に表示する。
// 読み取るだけで、保存ボタンなどは押さない。データは外部に送らない。
(() => {
  const ID24 = /[0-9a-f]{24}/;
  const N = s => (s || '').normalize('NFKC').replace(/\s+/g, '');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const waitFor = async (fn, ms = 20000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      try { const v = fn(); if (v) return v; } catch (e) {}
      await sleep(150);
    }
    return null;
  };
  const store = {
    get: async k => { try { return GM_getValue(k); } catch (e) { return undefined; } },
    set: async (k, v) => { try { GM_setValue(k, v); } catch (e) {} }
  };

  // 画面左上の患者番号（例 99999963）
  const findPatientNo = doc => {
    const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const t = (n.nodeValue || '').trim();
      if (!/^\d{6,10}$/.test(t)) continue;
      const el = n.parentElement;
      if (!el || el.closest('#clinics-futan-badge')) continue;
      const r = el.getBoundingClientRect();
      if (r.width && r.top < 320 && r.left < 700) return { el, no: t };
    }
    return null;
  };

  // 表を読む: 見出し名 → 列番号
  const readTable = (doc, headerName) => {
    for (const t of doc.querySelectorAll('table')) {
      const ths = [...t.querySelectorAll('th')].map(th => N(th.textContent));
      if (!ths.includes(N(headerName))) continue;
      const idx = name => ths.indexOf(N(name));
      const rows = [...t.querySelectorAll('tr')].filter(r => !r.querySelector('th') && r.cells.length > 1);
      return { idx, rows };
    }
    return null;
  };
  const isValidStatus = s => !s || (/期間内|有効/.test(s) && !/期間外|無効|切れ/.test(s));

  // ダイアログ内の「補助」欄の値
  const readHojo = doc => {
    const label = [...doc.querySelectorAll('body *')].find(el => N(el.textContent) === '補助' && [...el.children].every(c => !N(c.textContent)));
    if (!label) return null;
    let box = label.parentElement;
    for (let i = 0; i < 4 && box; i++, box = box.parentElement) {
      const sel = box.querySelector('select');
      if (sel) return sel.selectedOptions[0] ? sel.selectedOptions[0].text : '';
      const inp = box.querySelector('input:not([type=hidden]):not([type=checkbox])');
      if (inp && inp.value) return inp.value;
      const txt = (box.innerText || '').replace('補助', '').trim();
      if (txt) return txt.split('\n')[0].trim();
    }
    return '';
  };
  const fmtHojo = v => {
    const m = (v || '').normalize('NFKC').match(/(\d+)\s*割/);
    if (m) return m[1] + '割';
    if (!N(v) || /^[-ー—–]+$/.test(N(v))) return '';
    return v.trim();
  };

  // 見えない画面で保険情報・公費情報を読み取る
  // 見えない画面は1つだけ作って使い回す（2人目からは画面の読み込みを省いて速くする）
  let fr = null;
  async function openWorker(pid, no) {
    const url = '/d/patients/' + pid + '/insurance';
    let since = 0;
    const isReady = () => {
      const d = fr && fr.contentDocument;
      if (!d || !d.body || d.location.pathname !== url) return false;
      const t = readTable(d, '保険者番号');
      if (!t || !t.rows.length) return false;
      if (no) {
        const pn = findPatientNo(d);
        if (!pn || pn.no !== no) {
          // 別の患者の画面が出たまま3秒たったら、この候補はちがうと判断
          if (!since) since = Date.now();
          return Date.now() - since > 3000 ? 'wrong' : false;
        }
      }
      return true;
    };
    if (fr && fr.isConnected && fr.contentWindow && fr.contentDocument && fr.contentDocument.body) {
      try {
        fr.contentWindow.history.pushState({}, '', url);
        fr.contentWindow.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
        since = 0;
        const r = await waitFor(isReady, 6000);
        if (r === true) return fr.contentDocument;
        if (r === 'wrong') return null;
      } catch (e) {}
      fr.remove(); fr = null;
    }
    fr = document.createElement('iframe');
    fr.style.cssText = 'position:fixed;left:-5000px;top:0;width:1400px;height:1000px;border:0;';
    fr.src = url;
    document.body.appendChild(fr);
    since = 0;
    if ((await waitFor(isReady, 25000)) === true) return fr.contentDocument;
    fr.remove(); fr = null;
    return null;
  }

  // ---- 速い方法：CLINICSが使っているデータ（レセコンの保険・公費の組み合わせ）を直接読む ----
  const getJson = async url => {
    const r = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(r.status);
    return r.json();
  };
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const validNow = (s, e) => { const t = today(); return (!s || s <= t) && (!e || t <= e); };
  const rateText = r => {
    const v = parseFloat(r);
    if (isNaN(v)) return '';
    if (v === 0) return '負担なし';
    const w = Math.round(v * 100) / 10;
    return Number.isInteger(w) ? w + '割' : Math.round(v * 100) + '%';
  };
  async function fetchInfoApi(pid, no) {
    const [pt, ins] = await Promise.all([
      no ? getJson('/api/d/patients/' + pid) : Promise.resolve(null),
      getJson('/api/d/orca_patient_insurances?patient_id=' + pid)
    ]);
    if (no) {
      const cn = pt && pt.data && (pt.data.carteNo || pt.data.orcaPatientId);
      if (String(cn || '') !== no) throw new Error('別の患者');
    }
    const d = (ins && ins.data) || {};
    const isJihi = x => x.InsuranceProvider_Class === '980' || /自費/.test(x.InsuranceProvider_WholeName || '');
    const base = [], rel = [], kubun = [];
    for (const x of d.insurances || []) {
      if (isJihi(x) || !validNow(x.Certificate_StartDate, x.Certificate_ExpiredDate)) continue;
      const v = fmtHojo(x.HealthInsuredPerson_Assistance_Name || '') || '設定なし';
      if (!base.includes(v)) base.push(v);
      const r = x.RelationToInsuredPerson === '1' ? '本人' : x.RelationToInsuredPerson ? '家族' : '';
      if (r && !rel.includes(r)) rel.push(r);
    }
    // 高額療養費の所得区分（限度額適用認定など）
    for (const p of d.public_insurances || []) {
      if (!/高額|限度/.test(p.PublicInsurance_Name || '')) continue;
      if (!validNow(p.Certificate_IssuedDate, p.Certificate_ExpiredDate)) continue;
      const k = (p.PublicInsuredPerson_Number || '').normalize('NFKC').trim();
      if (k && !kubun.includes(k)) kubun.push(k);
    }
    const combos = [], baseRate = [];
    for (const c of d.insurance_combinations || []) {
      if (isJihi(c) || !validNow(c.Insurance_Combination_StartDate, c.Insurance_Combination_ExpiredDate)) continue;
      const pubs = c.PublicInsurance_Info || [];
      if (!pubs.length) {
        // 公費なしの組み合わせ ＝ 保険だけのときの実際の負担（補助が空欄でも年齢などからレセコンが決めた値）
        const r = rateText(c.Insurance_Combination_Rate_Outpatient);
        if (r && c.InsuranceProvider_Class && !baseRate.includes(r)) baseRate.push(r);
        continue;
      }
      const money = pubs.map(p => parseInt(p.Money_Outpatient, 10) || 0).filter(m => m > 0);
      combos.push({
        name: (c.Insurance_Combination_Name || '').trim().replace(/\s+/g, '＋'),
        rate: rateText(c.Insurance_Combination_Rate_Outpatient),
        money: money.length ? Math.max(...money) : 0
      });
    }
    const baseOut = baseRate.length ? baseRate : base;
    return { api: true, base: baseOut, rel, kubun, combos, at: Date.now() };
  }

  async function fetchInfo(pid, no) {
    {
      const doc = await openWorker(pid, no);
      if (!doc) throw new Error('画面を開けませんでした');
      const tbl = readTable(doc, '保険者番号');
      const futan = [];
      if (tbl) {
        const st = tbl.idx('ステータス'), kind = tbl.idx('保険の種類');
        for (let i = 0; i < tbl.rows.length; i++) {
          const t2 = readTable(doc, '保険者番号'); const row = t2 && t2.rows[i];
          if (!row) break;
          if (!isValidStatus(st >= 0 ? (row.cells[st] || {}).textContent : '')) continue;
          if (kind >= 0 && /自費/.test((row.cells[kind] || {}).textContent || '')) continue; // 自費の行は読まない
          const btns = row.querySelectorAll('button,a,[role=button]');
          const pen = btns[btns.length - 1];
          if (!pen) continue;
          pen.click();
          const v = await waitFor(() => { const h = readHojo(doc); return h === null ? null : { h }; }, 8000);
          if (v) futan.push({ val: fmtHojo(v.h), kind: kind >= 0 ? (row.cells[kind] || {}).textContent.trim() : '' });
          // 閉じる（キャンセル）
          const cancel = [...doc.querySelectorAll('button,a,[role=button]')].find(b => N(b.textContent) === 'キャンセル');
          if (cancel) cancel.click();
          await waitFor(() => readHojo(doc) === null, 4000);
        }
      }
      // 公費情報タブ
      const kohi = [];
      const tab = [...doc.querySelectorAll('a,button,[role=tab],li')].find(el => N(el.textContent) === '公費情報');
      if (tab) {
        tab.click();
        const kt = await waitFor(() => {
          if (N(doc.body.innerText).includes('公費は登録されていません')) return { rows: [] , idx: () => -1 };
          const t = readTable(doc, '公費の種類'); return t && t.rows.length ? t : null;
        }, 10000);
        if (kt) {
          const ki = kt.idx('公費の種類'), st = kt.idx('ステータス'), fi = kt.idx('負担者番号'), ci = kt.idx('自己負担上限額');
          const cell = (r, i) => i >= 0 ? ((r.cells[i] || {}).textContent || '').trim() : '';
          for (const r of kt.rows) {
            if (ki < 0) continue;
            if (!isValidStatus(cell(r, st))) continue;
            const name = cell(r, ki);
            if (!name || kohi.some(k => k.name === name)) continue;
            const m = name.normalize('NFKC').match(/^\s*(\d{2})/) || N(cell(r, fi)).match(/^(\d{2})/);
            kohi.push({ name, hb: m ? m[1] : '', cap: cell(r, ci) });
          }
        }
      }
      if (!tbl) throw new Error('保険情報が見つかりません');
      return { futan, kohi, at: Date.now() };
    }
  }

  // 公費の法別番号 → 公費を使ったあとの負担（よくあるものだけ。地域の助成などは「要確認」）
  const KOHI = {
    '10': { rate: '5%' },   // 結核（37条の2）
    '12': { rate: 0 },      // 生活保護
    '13': { rate: 0 }, '14': { rate: 0 }, // 戦傷病者
    '18': { rate: 0 }, '19': { rate: 0 }, // 原爆
    '15': { rate: 1 }, '16': { rate: 1 }, '21': { rate: 1 }, // 更生医療・育成医療・精神通院
    '52': { rate: 2 }, '54': { rate: 2 }, // 小児慢性・難病
    // 広島県の福祉医療（地方公費）。市町でルールが違うので広島市のルールを表示（受給者証で確認）
    '91': { text: '重度・精神：広島市は負担なし（他の市町は1日100〜200円）' },
    '92': { text: 'ひとり親：広島市は負担なし（他の市町は1日500円など）' },
    '90': { text: 'こども医療：広島市は入院負担なし／通院は1日500〜1,500円まで（受給者証を確認）' }
  };

  // ---- 表示 ----
  let badge;
  const ensureBadge = () => {
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'clinics-futan-badge';
      badge.style.cssText = 'display:inline;margin-left:10px;font-size:12px;font-weight:normal;color:#222;cursor:pointer;white-space:nowrap;';
      badge.title = 'クリックで読み直し';
      badge.addEventListener('click', () => { lastKey = ''; tick(); });
    }
    const pn = findPatientNo(document);
    if (pn && badge.parentElement !== pn.el) { badge.style.position = badge.style.top = badge.style.left = badge.style.zIndex = ''; pn.el.appendChild(badge); }
    if (!pn && !badge.isConnected) {
      badge.style.position = 'fixed'; badge.style.top = '96px'; badge.style.left = '330px'; badge.style.zIndex = 99999;
      document.body.appendChild(badge);
    }
    return badge;
  };
  const show = (text, warn) => {
    const b = ensureBadge();
    b.textContent = text;
    b.style.color = warn ? '#888' : '#222';
  };
  const render = info => {
    if (info.api) {
      let t = '負担 ' + (info.base.length ? info.base.join('/') : '保険なし');
      const extra = [...(info.rel || []), ...(info.kubun || []).map(k => '所得区分 ' + k)];
      if (extra.length) t += '（' + extra.join('・') + '）';
      for (const c of info.combos) {
        const m = c.money ? c.money.toLocaleString('ja-JP') + '円' : '';
        const r = c.money && c.rate === '負担なし' ? m + 'まで' : c.rate + (m ? '（上限 ' + m + '）' : '');
        t += '　｜ ' + c.name + ' ' + r;
      }
      show(t, false);
      const KB = { 'ア': '年収 約1,160万円〜', 'イ': '年収 約770〜1,160万円', 'ウ': '年収 約370〜770万円', 'エ': '年収 〜約370万円', 'オ': '住民税非課税' };
      const kb = (info.kubun || []).map(k => KB[k] ? '所得区分 ' + k + '：' + KB[k] + '（70歳未満の目安）\n' : '').join('');
      badge.title = kb + '外来の負担（レセコンの保険組み合わせより）読み取り: ' + new Date(info.at).toLocaleString('ja-JP') + '（クリックで読み直し）';
      return;
    }
    const vals = [...new Set(info.futan.map(f => f.val || '設定なし'))];
    let t = '負担 ' + (vals.length ? vals.join('/') : '保険なし');
    const base = (() => { const m = vals.join('').match(/(\d+)割/); return m ? +m[1] : null; })();
    for (const k of info.kohi) {
      if (typeof k === 'string') { t += '　公費: ' + k; continue; }
      const r = KOHI[k.hb];
      const cap = k.cap && /\d/.test(k.cap) ? '・上限 ' + k.cap.replace(/\s+/g, '') : '';
      let after;
      if (r && r.text) after = r.text;
      else if (!r) after = (/^8\d|^9\d/.test(k.hb) ? '地域の助成' : '') + '負担は要確認' + cap;
      else if (r.rate === 0) after = '公費で 負担なし';
      else if (typeof r.rate === 'string') after = '公費で ' + r.rate + cap;
      else after = '公費で ' + (base !== null ? Math.min(base, r.rate) : r.rate) + '割' + cap;
      t += '　→ ' + after + '（' + k.name + '）';
    }
    show(t, false);
    badge.title = '読み取り: ' + new Date(info.at).toLocaleString('ja-JP') + '（クリックで読み直し）';
  };

  // カルテ画面から患者ID（URL用）を探す
  // 候補を新しい順に返す（違う患者だった場合は、見えない画面で患者番号を照合してはじく）
  async function findPids() {
    const out = [];
    const add = id => { if (id && !out.includes(id)) out.push(id); };
    const pn = findPatientNo(document);
    if (pn) add(await store.get('no:' + pn.no));
    document.querySelectorAll('a[href*="/patients/"]').forEach(a => { const m = a.getAttribute('href').match(/patients\/([0-9a-f]{24})/); if (m) add(m[1]); });
    const es = performance.getEntriesByType('resource');
    for (let i = es.length - 1; i >= 0; i--) { const m = es[i].name.match(/patients\/([0-9a-f]{24})/); if (m) add(m[1]); }
    return out.slice(0, 4);
  }

  // 患者情報ページを開いたとき、患者番号とIDの対応を覚えておく
  async function rememberPid() {
    const m = location.pathname.match(/\/d\/patients\/([0-9a-f]{24})/);
    if (!m) return;
    const pn = findPatientNo(document);
    if (pn) await store.set('no:' + pn.no, m[1]);
  }

  let lastKey = '', busy = false;
  async function tick() {
    if (busy) return;
    rememberPid();
    if (!/\/d\/consultations\//.test(location.pathname)) {
      if (badge) badge.remove();
      return;
    }
    const key = location.pathname;
    if (key === lastKey) { if (badge) ensureBadge(); return; }
    busy = true; lastKey = key;
    try {
      show('負担割合 確認中…', true);
      await waitFor(() => findPatientNo(document), 3000);
      ensureBadge();
      const pn = findPatientNo(document);
      const no = pn && pn.no;
      let pids = [];
      for (let i = 0; i < 20 && !pids.length; i++) { pids = await findPids(); if (!pids.length) await sleep(300); }
      if (!pids.length) { show('負担割合: 取得できません（一度「患者情報」を開くと次から出ます）', true); return; }
      const cached = no && await store.get('info:' + no);
      if (cached) render(cached);
      let info = null;
      for (const pid of pids) {
        let wrong = false;
        try { info = await fetchInfoApi(pid, no); } catch (e) { info = null; wrong = e.message === '別の患者'; }
        if (!info && !wrong && location.pathname === key) { try { info = await fetchInfo(pid, no); } catch (e) { info = null; } }
        if (location.pathname !== key) return;
        if (info) { if (no) { await store.set('no:' + no, pid); await store.set('info:' + no, info); } break; }
      }
      if (info) render(info);
      else if (!cached) show('負担割合: 取得できません（クリックで再試行）', true);
    } finally { busy = false; }
  }

  setInterval(tick, 500);
  tick();
})();
});

// ---- CLINICS 不要なレセプト指摘を隠す (clinics-hide.user.js) ----
__tool('指摘を隠す：レセプト結果確認の消せない指摘を非表示', 'off:clinics-hide.user.js', () => {
// CLINICS 不要なレセプト指摘を隠す v1.1
// ベースアップ評価料(2)・リハビリテーション総合計画評価料1(2回目以降)の指摘行を画面上で隠す（データは変更しない）
(()=>{const N=s=>s.normalize('NFKC').replace(/\s/g,'');const m=tr=>{const s=N(tr.innerText||tr.textContent);return (s.includes('ベースアップ評価料(2)')&&s.includes('ベースアップ評価料(1)')&&s.includes('ありません'))||(s.includes('リハビリテーション総合計画評価料1(2回目以降')&&s.includes('根拠となるリハビリテーション料'))};const run=()=>{document.querySelectorAll('tr').forEach(tr=>{if(tr.dataset.hz||!m(tr))return;tr.dataset.hz=1;const rs=[...tr.cells].filter(c=>c.rowSpan>1);if(!rs.length){tr.style.display='none';return}const n=Math.max(...rs.map(c=>c.rowSpan));let g=[tr],x=tr;for(let i=1;i<n;i++){x=x.nextElementSibling;if(!x)break;g.push(x)}if(g.every(r=>r===tr||m(r))){g.forEach(r=>{r.dataset.hz=1;r.style.display='none'})}else{[...tr.cells].forEach(c=>{if(c.rowSpan<=1)c.style.display='none'})}});const pg=e=>[...e.querySelectorAll('button,a,li,[role=button]')].some(b=>/^\d+$/.test(b.textContent.trim()));document.querySelectorAll('table').forEach(t=>{if(t.dataset.hz)return;const rs=[...t.rows].filter(r=>!r.querySelector('th'));if(!rs.length||!rs.every(r=>r.style.display==='none'))return;t.dataset.hz=1;let el=t;while(el.parentElement&&el.parentElement!==document.body&&!el.parentElement.matches('[role=dialog],[aria-modal=true]')&&el.parentElement.querySelectorAll('table').length===1&&!pg(el.parentElement))el=el.parentElement;el.style.display='none'})};run();if(!window.__hz){window.__hz=new MutationObserver(()=>{clearTimeout(window.__hzt);window.__hzt=setTimeout(run,100)});window.__hz.observe(document.body,{childList:true,subtree:true})}})();
});
