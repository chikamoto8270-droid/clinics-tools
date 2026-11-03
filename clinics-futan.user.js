// ==UserScript==
// @name         CLINICS 負担割合表示
// @namespace    clinics-tools
// @version      1.2
// @description  CLINICSのカルテ画面に、患者の自己負担割合（保険情報の「補助」）と公費を表示します。データは外部に送りません。
// @match        https://karte.medley.life/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/chikamoto8270-droid/clinics-tools/main/clinics-futan.user.js
// @downloadURL  https://raw.githubusercontent.com/chikamoto8270-droid/clinics-tools/main/clinics-futan.user.js
// ==/UserScript==
// CLINICS 負担割合表示 v1.2
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
      await sleep(250);
    }
    return null;
  };
  const store = {
    get: async k => { try { return GM_getValue(k); } catch (e) { return undefined; } },
    set: async (k, v) => { try { GM_setValue(k, v); } catch (e) {} }
  };

  // 画面左上の患者番号（例 99999963）
  const findPatientNoEl = doc => {
    const els = doc.querySelectorAll('body *');
    for (const el of els) {
      if (el.children.length) continue;
      const t = (el.textContent || '').trim();
      if (!/^\d{6,10}$/.test(t)) continue;
      const r = el.getBoundingClientRect();
      if (r.width && r.top < 250 && r.left < 700) return el;
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
  async function fetchInfo(pid) {
    const fr = document.createElement('iframe');
    fr.style.cssText = 'position:fixed;left:-5000px;top:0;width:1400px;height:1000px;border:0;';
    fr.src = '/d/patients/' + pid + '/insurance';
    document.body.appendChild(fr);
    try {
      const ok = await waitFor(() => { const d = fr.contentDocument; return d && /\/insurance/.test(d.location.pathname) && d.body; }, 20000);
      if (!ok) throw new Error('画面を開けませんでした');
      const doc = fr.contentDocument;
      const tbl = await waitFor(() => { const t = readTable(doc, '保険者番号'); return t && t.rows.length ? t : null; }, 20000);
      const futan = [];
      if (tbl) {
        const st = tbl.idx('ステータス'), kind = tbl.idx('保険の種類');
        for (let i = 0; i < tbl.rows.length; i++) {
          const t2 = readTable(doc, '保険者番号'); const row = t2 && t2.rows[i];
          if (!row) break;
          if (!isValidStatus(st >= 0 ? (row.cells[st] || {}).textContent : '')) continue;
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
    } finally {
      fr.remove();
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
      badge.style.cssText = 'display:inline-block;margin-left:12px;padding:2px 10px;border-radius:6px;font-weight:bold;font-size:16px;background:#fff3cd;color:#7a4b00;border:2px solid #f0ad4e;cursor:pointer;vertical-align:middle;white-space:nowrap;';
      badge.title = 'クリックで読み直し';
      badge.addEventListener('click', () => { lastKey = ''; tick(); });
    }
    const no = findPatientNoEl(document);
    if (no && badge.previousElementSibling !== no) no.insertAdjacentElement('afterend', badge);
    if (!no && !badge.isConnected) {
      badge.style.position = 'fixed'; badge.style.top = '96px'; badge.style.left = '330px'; badge.style.zIndex = 99999;
      document.body.appendChild(badge);
    }
    return badge;
  };
  const show = (text, warn) => {
    const b = ensureBadge();
    b.textContent = text;
    b.style.background = warn ? '#f8d7da' : '#fff3cd';
  };
  const render = info => {
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
  async function findPid() {
    const a = document.querySelector('a[href*="/patients/"]');
    let m = a && a.getAttribute('href').match(/patients\/([0-9a-f]{24})/);
    if (m) return m[1];
    for (const e of performance.getEntriesByType('resource')) {
      m = e.name.match(/patients\/([0-9a-f]{24})/);
      if (m) return m[1];
    }
    const no = findPatientNoEl(document);
    if (no) return await store.get('no:' + no.textContent.trim());
    return null;
  }

  // 患者情報ページを開いたとき、患者番号とIDの対応を覚えておく
  async function rememberPid() {
    const m = location.pathname.match(/\/d\/patients\/([0-9a-f]{24})/);
    if (!m) return;
    const no = findPatientNoEl(document);
    if (no) await store.set('no:' + no.textContent.trim(), m[1]);
  }

  let lastKey = '', busy = false;
  async function tick() {
    if (busy) return;
    rememberPid();
    if (!/\/d\/consultations\//.test(location.pathname)) {
      if (badge) badge.remove();
      return;
    }
    if (!findPatientNoEl(document)) return; // まだ画面が出ていない
    const key = location.pathname;
    if (key === lastKey) { if (badge) ensureBadge(); return; }
    busy = true; lastKey = key;
    try {
      show('負担割合 確認中…', false);
      let pid = null;
      for (let i = 0; i < 30 && !pid; i++) { pid = await findPid(); if (!pid) await sleep(300); }
      if (!pid) { show('負担割合: 取得できません（一度「患者情報」を開くと次から出ます）', true); return; }
      const cached = await store.get('info:' + pid);
      if (cached) render(cached);
      try {
        const info = await fetchInfo(pid);
        if (location.pathname !== key) return;
        await store.set('info:' + pid, info);
        render(info);
      } catch (e) {
        if (!cached) show('負担割合: 取得できません（クリックで再試行）', true);
      }
    } finally { busy = false; }
  }

  setInterval(tick, 1000);
  tick();
})();
