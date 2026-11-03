# clinics-tools

CLINICS（karte.medley.life）用の小さなツール。ブラウザの中だけで動き、データを外部に送りません。

## まとめてインストール（おすすめ）

[clinics-tools.user.js](https://raw.githubusercontent.com/chikamoto8270-droid/clinics-tools/main/clinics-tools.user.js) を開いて「インストール」すると、下のツールが全部入ります。新しいツールが増えたときも自動で追加・更新されます。
機能ごとのオン・オフは、CLINICSを開いた状態でTampermonkeyのアイコンを押すと出るメニュー（✅ オン／⬜ オフ）で切り替えられます。
これを入れた場合は、個別に入れたスクリプト（clinics-futan / clinics-hide）はTampermonkeyから削除してください（二重に動くため）。

開発メモ: ツールは個別の `*.user.js` として追加・編集します。`clinics-tools.user.js` は `build.py` で生成され、main に push すると GitHub Actions が自動で作り直します（直接編集しない）。

## CLINICS 負担割合表示

カルテ画面の患者番号の横に、自己負担割合（保険の「補助」）と、公費を使ったあとの外来の負担（レセコンの保険組み合わせの負担率）を表示します。

インストール（Tampermonkeyが必要）: [clinics-futan.user.js](https://raw.githubusercontent.com/chikamoto8270-droid/clinics-tools/main/clinics-futan.user.js) を開いて「インストール」。以後は自動で更新されます。

## CLINICS 不要なレセプト指摘を隠す

レセプトチェックの結果確認で、消せない指摘（ベースアップ評価料（２）、リハビリテーション総合計画評価料１（２回目以降の場合））の行を自動で隠します。指摘がこれだけの患者さんは名前ごと隠します。画面の表示を変えるだけで、データは変更しません。

インストール（Tampermonkeyが必要）: [clinics-hide.user.js](https://raw.githubusercontent.com/chikamoto8270-droid/clinics-tools/main/clinics-hide.user.js) を開いて「インストール」。以後は自動で更新されます。
