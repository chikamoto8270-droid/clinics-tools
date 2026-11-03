# clinics-tools

CLINICS（karte.medley.life）用の小さなツール。ブラウザの中だけで動き、データを外部に送りません。

## CLINICS 負担割合表示

カルテ画面の患者番号の横に、自己負担割合（保険の「補助」）と、公費を使ったあとの外来の負担（レセコンの保険組み合わせの負担率）を表示します。

インストール（Tampermonkeyが必要）: [clinics-futan.user.js](https://raw.githubusercontent.com/chikamoto8270-droid/clinics-tools/main/clinics-futan.user.js) を開いて「インストール」。以後は自動で更新されます。

## CLINICS 不要なレセプト指摘を隠す

レセプトチェックの結果確認で、消せない指摘（ベースアップ評価料（２）、リハビリテーション総合計画評価料１（２回目以降の場合））の行を自動で隠します。指摘がこれだけの患者さんは名前ごと隠します。画面の表示を変えるだけで、データは変更しません。

インストール（Tampermonkeyが必要）: [clinics-hide.user.js](https://raw.githubusercontent.com/chikamoto8270-droid/clinics-tools/main/clinics-hide.user.js) を開いて「インストール」。以後は自動で更新されます。
