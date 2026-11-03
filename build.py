#!/usr/bin/env python3
"""Combine every *.user.js tool into clinics-tools.user.js (the one script to install)."""
import glob, re, datetime

OUT = 'clinics-tools.user.js'
RAW = 'https://raw.githubusercontent.com/chikamoto8270-droid/clinics-tools/main/' + OUT

parts, grants, names = [], set(), []
for f in sorted(glob.glob('*.user.js')):
    if f == OUT:
        continue
    src = open(f, encoding='utf-8').read()
    m = re.match(r'\s*// ==UserScript==(.*?)// ==/UserScript==\n?', src, re.S)
    head, body = (m.group(1), src[m.end():]) if m else ('', src)
    grants |= {g for g in re.findall(r'@grant\s+(\S+)', head) if g != 'none'}
    name = (re.findall(r'@name\s+(.+)', head) or [f])[0].strip()
    names.append(name)
    parts.append(f'// ---- {name} ({f}) ----\ntry {{\n{body.rstrip()}\n}} catch (e) {{ console.error("[{f}]", e); }}\n')

ver = datetime.datetime.now(datetime.timezone.utc).strftime('%Y.%m%d.%H%M')
hdr = ['// ==UserScript==',
       '// @name         CLINICS ツールまとめ',
       '// @namespace    clinics-tools',
       f'// @version      {ver}',
       '// @description  CLINICS用ツールをまとめて入れるスクリプト（' + '／'.join(names) + '）。データは外部に送りません。',
       '// @match        https://karte.medley.life/*']
hdr += [f'// @grant        {g}' for g in sorted(grants)] or ['// @grant        none']
hdr += ['// @run-at       document-idle', f'// @updateURL    {RAW}', f'// @downloadURL  {RAW}', '// ==/UserScript==',
        '// このファイルは build.py で自動生成されます。直接編集せず、各 *.user.js を編集してください。']
open(OUT, 'w', encoding='utf-8').write('\n'.join(hdr) + '\n' + '\n'.join(parts))
print(OUT, ver, names)
