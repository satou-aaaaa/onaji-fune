# AGENTS.md

まだ同じ船？：テセウスの船の板を1枚ずつかえて毎回「まだ同じ船？」に答え（正解のない航海）、最後に古い板で組んだ2そう目とどちらが本物かを選ぶと、答えの変わり目と近い考え方の札（形・板・つながり）が出る学習ゲーム。そのあと、2そうの船と札を見て「その札なら本物は？」を当てる1日5問（正解したら2段目「では、別の札なら？」）と、出典（プルタルコス・ホッブズ）の問題。`index.html` と `data.js` を GitHub Pages で公開する。

## 準備（最初に一度）

```bash
bash scripts/setup.sh   # Node.js（版は .nvmrc）を確かめ、検査の依存とブラウザを入れる。何度実行してもよい
```

Claude Code のクラウドセッションでは `.claude/settings.json` のフックが自動で実行する。

## push する前の確認

```bash
node qa/run.mjs   # 問題（26種類×3000問：選び肢・答えは1つ・答えと2段目が札の表どおり・出典の表どおり）・航海・今日の5問と上級（3年分）・とことん・通しで遊ぶ・続きから・2段目・復習・幅320px・PWA・引き継ぎ・見やすさ（CI の QA と同じ）
```

## このリポジトリの決まり

- 札は3つ（形・板・つながり）。どの札も「見ないもの」を書き、札の言葉と船の様子（形・もとの板の数・とぎれずに続いたか）だけで答えが1つに決まるようにする。場面を足すときは `qa/run.mjs` の `TB`（札の言葉から手で書いた表）にも足す。
- 出典の問題は、プルタルコス『英雄伝』テセウス伝 23（Perrin 英訳）とホッブズ『物体論』第2部第11章7節に書いてあることだけ。足すときは本文を読み、`qa/run.mjs` の `TF` にも足す。どの札が正しいかを決めつけない（遊び方・「このゲームについて」・README に「ゲームのために短くした」「今も決まっていません」を置く。QA が見る）。
- 航海（`voyage`）には正解・★を付けない。答えは `voy`（日付ごと）と `ops`（新しい順に30）に残すだけで、連続・今日の記録・Ko-fi には数えない。
- 今日の5問（やさしい1・ふつう2・ひねり1・出典1、種類は重ねない）・上級（ひねり3、今日のひねりと別）は日本時間の日付の種で決まり、だれでも同じ。`Math.random()` は練習・とことんの種だけ。乱数は `sort` の比較の中で引かない。`KINDS` は最後に足すだけ（QA の `PIN` が第1回の1問目を見る）。`data.js` を変える PR は自動ではマージされない（`hold_paths`）。
- ★はまちがい＋ヒントの数（0で★3・1で★2・2以上で★1）。上級はヒントなし。時間制限なし。
- 好きなだけ遊べる：チケット・ライフ・回数制限・🔒で開くモードを入れない（shared-workflows `routines/game-dev.md` F1〜F7。QA が見る）。とことん（`runs.e`）はまちがえても続き、「ここで降りる」で終わる。
- 1問を深くする：`depth.js` と `qa/depth-check.mjs` は shared-workflows `template/` の写しで、ここでは直さない。自信あり・2段目「では、別の札なら？」・復習（1→3→7日後）。出典の問題は1段だけ。記録 `onf-v1`・文字 `onf-fs`・復習 `onf-depth`。
- 共有は遊ぶ人が押したときに開くリンクだけ。シェアの文に問題・答えを出さない。応援は Ko-fi へのただのリンクだけ。
- 外へ通信しない（CSP の `connect-src 'self'` を広げない）。見やすさ・引き継ぎ・store・core・kiroku は shared-workflows `template/` の写しで、ここでは直さない。
- 画面の土台は どこの裁判所？（saibansho-doko）から写した。写し元の言葉が残っていないかを QA が見る。
- PWA：画面のファイルを足したら `sw.js` の `SHELL` にも足し、中身を大きく変えたら `CACHE` の版を上げる。アイコンは `node tools/make-icons.cjs`、`og.png` は `node tools/make-og.cjs`。
- 公開リポジトリなので、個人情報・鍵を入れない。

## 公開

- GitHub Pages は `main` のルート（`/`）を公開する。PR の QA と Secret scan が ✅ になると `automerge.yml` が自動でマージする。止めたいときは下書きにするか、ラベル「自動マージしない」を付ける。
- `sw.js`・`manifest.webmanifest`・`data.js` を変える PR は自動ではマージされない（`hold_paths`）。CodeRabbit のレビューを読み、手でマージする直前に今の head へのレビューを読み直す。CodeRabbit は PR に `@coderabbitai review` とコメントして頼む。

## 共通のきまり

- PR の作り方・マージの仕方は satou-aaaaa/shared-workflows の `routines/pr.md`、全体のきまりは `routines/common.md` に従う。
- CI の部品は shared-workflows の共通部品を呼ぶ。リポジトリ側の .github/workflows には呼び出しと設定値だけを書く。
- Claude 以外の AI・人が作業するときは、shared-workflows の `routines/tool-map.md` と `routines/without-claude.md` を読む。
