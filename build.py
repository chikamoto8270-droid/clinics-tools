#!/usr/bin/env python3
"""Combine every *.user.js tool into clinics-tools.user.js (the one script to install)."""
import glob, re, datetime

OUT = 'clinics-tools.user.js'
RAW = 'https://raw.githubusercontent.com/chikamoto8270-droid/clinics-tools/main/' + OUT

parts, grants, names, helps = [], set(), [], []
for f in sorted(glob.glob('*.user.js')):
    if f == OUT:
        continue
    src = open(f, encoding='utf-8').read()
    m = re.match(r'\s*// ==UserScript==(.*?)// ==/UserScript==\n?', src, re.S)
    head, body = (m.group(1), src[m.end():]) if m else ('', src)
    grants |= {'GM_getValue', 'GM_setValue', 'GM_registerMenuCommand'}
    grants |= {g for g in re.findall(r'@grant\s+(\S+)', head) if g != 'none'}
    name = (re.findall(r'@name\s+(.+)', head) or [f])[0].strip()
    label = (re.findall(r'@menu\s+(.+)', head) or [name])[0].strip()
    desc = (re.findall(r'@description\s+(.+)', head) or [''])[0].strip()
    helps.append('■ ' + label + '\n' + desc)
    names.append(name)
    key = 'off:' + f
    parts.append(f'// ---- {name} ({f}) ----\n__tool({label!r}, {key!r}, () => {{\n{body.rstrip()}\n}});\n')

ver = datetime.datetime.now(datetime.timezone.utc).strftime('%Y.%m%d.%H%M')
hdr = ['// ==UserScript==',
       '// @name         CLINICS ツールまとめ',
       '// @namespace    clinics-tools',
       f'// @version      {ver}',
       '// @description  CLINICS用ツールをまとめて入れるスクリプト（' + '／'.join(names) + '）。データは外部に送りません。',
       '// @match        https://karte.medley.life/*']
hdr += [f'// @grant        {g}' for g in sorted(grants)] or ['// @grant        none']
hdr += ['// @run-at       document-idle', f'// @updateURL    {RAW}', f'// @downloadURL  {RAW}', '// ==/UserScript==',
        '// このファイルは build.py で自動生成されます。直接編集せず、各 *.user.js を編集してください。',
        '// Tampermonkeyのメニューから機能ごとにオン・オフできる（設定はこのパソコンに保存）。',
        'function __tool(name, key, run) {',
        '  const off = GM_getValue(key, false);',
        "  GM_registerMenuCommand((off ? '⬜ オフ｜' : '✅ オン｜') + name, () => { GM_setValue(key, !off); location.reload(); });",
        '  if (off) return;',
        '  try { run(); } catch (e) { console.error(\'[\' + name + \']\', e); }',
        '}']
helptext = '\n\n'.join(helps) + '\n\n各機能は、このメニューの「✅ オン／⬜ オフ」を押すと切り替えられます。'
help_js = f"GM_registerMenuCommand('ℹ 各機能の説明を見る', () => alert({helptext!r}));\n"
open(OUT, 'w', encoding='utf-8').write('\n'.join(hdr) + '\n' + help_js + '\n'.join(parts))
print(OUT, ver, names)
