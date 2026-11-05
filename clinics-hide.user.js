// ==UserScript==
// @name         CLINICS 不要なレセプト指摘を隠す
// @menu         指摘を隠す：レセプト結果確認の消せない指摘を非表示
// @namespace    clinics-tools
// @version      1.2
// @description  レセプトチェックの結果確認で、ベースアップ評価料(2)とリハビリテーション総合計画評価料1(2回目以降)の指摘行を自動で隠します。データの変更や外部送信はしません。
// @match        https://karte.medley.life/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/chikamoto8270-droid/clinics-tools/main/clinics-hide.user.js
// @downloadURL  https://raw.githubusercontent.com/chikamoto8270-droid/clinics-tools/main/clinics-hide.user.js
// ==/UserScript==
// CLINICS 不要なレセプト指摘を隠す v1.1
// ベースアップ評価料(2)・リハビリテーション総合計画評価料1(2回目以降)の指摘行を画面上で隠す（データは変更しない）
(()=>{const N=s=>s.normalize('NFKC').replace(/\s/g,'');const m=tr=>{const s=N(tr.innerText||tr.textContent);return (s.includes('ベースアップ評価料(2)')&&s.includes('ベースアップ評価料(1)')&&s.includes('ありません'))||(s.includes('リハビリテーション総合計画評価料1(2回目以降')&&s.includes('根拠となるリハビリテーション料'))};const run=()=>{document.querySelectorAll('tr').forEach(tr=>{if(tr.dataset.hz||!m(tr))return;tr.dataset.hz=1;const rs=[...tr.cells].filter(c=>c.rowSpan>1);if(!rs.length){tr.style.display='none';return}const n=Math.max(...rs.map(c=>c.rowSpan));let g=[tr],x=tr;for(let i=1;i<n;i++){x=x.nextElementSibling;if(!x)break;g.push(x)}if(g.every(r=>r===tr||m(r))){g.forEach(r=>{r.dataset.hz=1;r.style.display='none'})}else{[...tr.cells].forEach(c=>{if(c.rowSpan<=1)c.style.display='none'})}});const pg=e=>[...e.querySelectorAll('button,a,li,[role=button]')].some(b=>/^\d+$/.test(b.textContent.trim()));document.querySelectorAll('table').forEach(t=>{if(t.dataset.hz)return;const rs=[...t.rows].filter(r=>!r.querySelector('th'));if(!rs.length||!rs.every(r=>r.style.display==='none'))return;t.dataset.hz=1;let el=t;while(el.parentElement&&el.parentElement!==document.body&&!el.parentElement.matches('[role=dialog],[aria-modal=true]')&&el.parentElement.querySelectorAll('table').length===1&&!pg(el.parentElement))el=el.parentElement;el.style.display='none'})};run();if(!window.__hz){window.__hz=new MutationObserver(()=>{clearTimeout(window.__hzt);window.__hzt=setTimeout(run,100)});window.__hz.observe(document.body,{childList:true,subtree:true})}})();
