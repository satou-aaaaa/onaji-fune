// まだ同じ船？（テセウスの船・ホッブズの2そう目）の問題と航海を作る（ブラウザと node の両方で使う）。
// 航海：船の板を1枚ずつかえ、毎回「まだ同じ船？」に答える（正解のない問い。点数に入れない）。最後に古い板で2そう目ができ、どちらが本物かを選ぶ。
// 問題：2そうの船の絵と「考え方の札」を見て、その札ならどちらがテセウスの船かを当てる（札の言葉だけで答えが1つに決まる）。
//       正解したら2段目「では、別の札なら？」。出典の問題は、プルタルコス『英雄伝』テセウス伝 23・ホッブズ『物体論』第2部第11章7節に書いてあることだけ。
// 札は、哲学の考え方をゲーム用に短くした3つ（形・板・つながり）。答えは札の言葉と船の様子（形・板・続き方）から決まる（下の judge）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS は最後に足すだけにし、足す種類には since:"YYYY-MM-DD"（出し始める日・公開の翌日以降）を付ける。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "ひねり", "出典"];

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    plut: ["プルタルコス『英雄伝』テセウス伝 23（Perrin 英訳 1914）", "https://lexundria.com/plut_thes/23/prr"],
    hobbes: ["ホッブズ『物体論』第2部第11章7節（英訳 Elements of Philosophy, 1656）", "https://archive.org/details/b30335838"],
    sepmc: ["スタンフォード哲学百科事典「Material Constitution」", "https://plato.stanford.edu/entries/material-constitution/"],
    sepit: ["スタンフォード哲学百科事典「Identity Over Time」", "https://plato.stanford.edu/entries/identity-time/"],
  };

  // 考え方の札（3つ）。どの札も、見るものを1つだけにする（ほかは見ない）ので、答えは1つに決まる
  const CARDS = {
    kata: { name: "形の札", mark: "◇", rule: "形とつくりが、もとの船と同じなら同じ船。板や、どう続いてきたかは見ない。", look: "見るのは形だけ。船の形か、いかだの形か。" },
    ita: { name: "板の札", mark: "▦", rule: "もとの板が全部そのまま使われていれば同じ船。形や、どう続いてきたかは見ない。", look: "見るのは板だけ。もとの古い板が全部あるか。" },
    tsuna: { name: "つながりの札", mark: "〰", rule: "もとの船から少しずつ変わり、とぎれずに続いてきたなら同じ船。板や形は見ない。", look: "見るのは続き方だけ。もとの船からとぎれずに来たか。" },
  };
  const CK = Object.keys(CARDS);

  // 2段目と1段目の答え（4つ）。左右の船は旗の形（● ▲）でも分ける
  const GROUPS = {
    L: { name: "左の船 ●", sub: "丸の旗" },
    R: { name: "右の船 ▲", sub: "三角の旗" },
    both: { name: "両方", sub: "どちらも同じ船" },
    none: { name: "どちらでもない", sub: "どちらも別の船" },
  };
  const OPTS = Object.keys(GROUPS).map((g) => GROUPS[g].name);

  // part:ri:begin（shared-workflows の template/parts/data/ri.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // part:ri:end
  // part:shuffle:begin（shared-workflows の template/parts/data/shuffle.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  // part:shuffle:end
  // part:pickN:begin（shared-workflows の template/parts/data/pickN.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  // part:pickN:end

  // 船の様子：shape（ship 船の形・raft いかだの形）・old（もとの板の数。N なら全部もとの板）・cont（もとの船からとぎれずに続いてきた）
  // 場面ごとに A（もとの船から続く側）と B（もう1そう）。k はかえた板の数（partial だけ）
  const SC = {
    copy: { lv: 0, name: "そっくりの船", A: (N) => ({ shape: "ship", old: N, cont: true, d: "もとの船。板は1枚もかえていない" }), B: () => ({ shape: "ship", old: 0, cont: false, d: "新しい板で作った、そっくりの船" }) },
    hobbes: { lv: 1, name: "古い板の2そう目", A: () => ({ shape: "ship", old: 0, cont: true, d: "板を1枚ずつ、全部かえ続けた船" }), B: (N) => ({ shape: "ship", old: N, cont: false, d: "はずした古い板を、同じ形に組み直した船" }) },
    partial: { lv: 1, name: "途中までかえた船", A: (N, k) => ({ shape: "ship", old: N - k, cont: true, d: `板を${k}枚だけ、新しくかえた船` }), B: () => ({ shape: "ship", old: 0, cont: false, d: "新しい板で作った、そっくりの船" }) },
    raft: { lv: 1, name: "古い板のいかだ", A: () => ({ shape: "ship", old: 0, cont: true, d: "板を1枚ずつ、全部かえ続けた船" }), B: (N) => ({ shape: "raft", old: N, cont: false, d: "はずした古い板で組んだ、いかだ" }) },
    reshape: { lv: 2, name: "形を変えた船", A: (N) => ({ shape: "raft", old: N, cont: true, d: "板はそのままで、少しずつ、いかだの形に作りかえた船" }), B: () => ({ shape: "ship", old: 0, cont: false, d: "新しい板で作った、もとの形のそっくりの船" }) },
    sink: { lv: 2, name: "しずんだ船", A: () => ({ shape: "ship", old: 0, cont: false, d: "新しい板で作った、そっくりの船" }), B: () => ({ shape: "ship", old: 0, cont: false, d: "もう1そう、新しい板で作ったそっくりの船" }), pre: "もとの船は、しずんでなくなった。" },
  };
  // 札が「同じ船」と言うか（札の言葉どおり。ほかは見ない）
  function judge(card, sh, N) { return card === "kata" ? sh.shape === "ship" : card === "ita" ? sh.old === N : sh.cont; }
  // 2そうの答え（L・R・both・none）
  function answerOf(card, Ls, Rs, N) { const l = judge(card, Ls, N), r = judge(card, Rs, N); return l && r ? "both" : l ? "L" : r ? "R" : "none"; }
  // 札ごとに、2そうがどう見えるか（ヒント2・説明に使う）
  function seeOf(card, sh, N) {
    if (card === "kata") return sh.shape === "ship" ? "船の形" : "いかだの形";
    if (card === "ita") return sh.old === N ? "もとの板が全部" : sh.old > 0 ? `新しい板が${N - sh.old}枚` : "新しい板だけ";
    return sh.cont ? "とぎれずに続いた" : "あとから作った";
  }
  const verdictOf = { L: "左の船", R: "右の船", both: "両方", none: "どちらでもない" };
  function explain(card, Ls, Rs, N) {
    const a = answerOf(card, Ls, Rs, N);
    return `${CARDS[card].name}：左は${seeOf(card, Ls, N)}、右は${seeOf(card, Rs, N)}。だから「${verdictOf[a]}」。`;
  }

  // 船の絵（svg）。古い板は濃い茶色のぬりつぶし、新しい板は明るい色にしま模様と「新」の点（色だけで分けない）
  function shipSvg(N, Ls, Rs, R, pre) {
    const one = (sh, x0, flag, side, order) => {
      const raft = sh.shape === "raft", w = 120, top = raft ? 92 : 72, bot = raft ? 112 : 112, pw = w / N;
      const isNew = new Set(order.slice(0, N - sh.old));
      let s = "";
      for (let i = 0; i < N; i++) {
        const x = x0 + i * pw, nw = isNew.has(i);
        // 船の形は下がすぼまる（両はしの板を斜めに切る）
        const inset = raft ? 0 : (i === 0 ? 14 : i === N - 1 ? 14 : 0);
        const pts = raft ? `${x},${top} ${x + pw},${top} ${x + pw},${bot} ${x},${bot}`
          : i === 0 ? `${x},${top} ${x + pw},${top} ${x + pw},${bot} ${x + inset},${bot}` : i === N - 1 ? `${x},${top} ${x + pw},${top} ${x + pw - inset},${bot} ${x},${bot}` : `${x},${top} ${x + pw},${top} ${x + pw},${bot} ${x},${bot}`;
        s += `<polygon points="${pts}" fill="${nw ? "url(#nw)" : "#6b3f1d"}" stroke="#2b1a0c" stroke-width="1.5"/>`;
        if (nw) s += `<circle cx="${x + pw / 2}" cy="${top + 10}" r="2.6" fill="#2b1a0c"/>`;
      }
      if (!raft) s += `<line x1="${x0 + w / 2}" y1="${top}" x2="${x0 + w / 2}" y2="22" stroke="#2b1a0c" stroke-width="3"/><path d="M${x0 + w / 2 + 2} 26 L${x0 + w / 2 + 40} 60 L${x0 + w / 2 + 2} 62 Z" fill="#fffdf7" stroke="#2b1a0c" stroke-width="1.5"/>`;
      const fx = x0 + w / 2, fy = raft ? 76 : 16;
      if (raft) s += `<line x1="${fx}" y1="${top}" x2="${fx}" y2="${fy}" stroke="#2b1a0c" stroke-width="2.5"/>`;
      s += flag === "●" ? `<circle cx="${fx - 10}" cy="${fy + 4}" r="8" fill="#1f4f7a" stroke="#2b1a0c" stroke-width="1.5"/>` : `<path d="M${fx - 2} ${fy - 4} L${fx - 22} ${fy + 4} L${fx - 2} ${fy + 12} Z" fill="#b23a24" stroke="#2b1a0c" stroke-width="1.5"/>`;
      s += `<text x="${fx}" y="136" text-anchor="middle" font-size="14" font-weight="700" fill="#1d2a3f">${side} ${flag}</text>`;
      return s;
    };
    const oL = shuffle(R, [...Array(N).keys()]), oR = shuffle(R, [...Array(N).keys()]);
    return `<svg viewBox="0 0 320 146" role="img" aria-label="左：${Ls.d}。右：${Rs.d}。${pre || ""}" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="nw" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#f0d9a8"/><rect width="2" height="6" fill="#c9a25f"/></pattern></defs>
      <rect width="320" height="146" fill="#dfeaf2"/><path d="M0 114 Q20 108 40 114 T80 114 T120 114 T160 114 T200 114 T240 114 T280 114 T320 114 V146 H0Z" fill="#9fc3dc"/>
      ${pre ? `<text x="160" y="16" text-anchor="middle" font-size="12" fill="#1d2a3f">${pre}</text>` : ""}
      ${one(Ls, 24, "●", "左", oL)}${one(Rs, 176, "▲", "右", oR)}</svg>`;
  }

  // 種類：場面 × 1段目の札（18）と、出典の問題（8）
  const KINDS = [];
  for (const sc of Object.keys(SC)) for (const c of CK) {
    const S = SC[sc];
    KINDS.push({ id: `${sc}-${c}`, lv: S.lv, sc, card: c, name: `${S.name}×${CARDS[c].name}`, look: CARDS[c].look,
      src: sc === "hobbes" || sc === "raft" ? ["hobbes", "sepmc"] : c === "ita" ? ["sepit", "sepmc"] : ["sepmc"] });
  }
  // 出典の問題（1段だけ）。選び肢は、ほかに当てはまる人・本・数が無いものだけ
  const PEOPLE = ["プルタルコス", "ホッブズ", "デカルト", "ニュートン"], BOOKS = ["『英雄伝』", "『物体論』", "『方法序説』", "『プリンキピア』"];
  const F = (id, name, q, ans, opts, look, why, src) => KINDS.push({ id, lv: 3, name, q, ans, fopts: opts, look, key: look, why, src, fact: true });
  F("who-plut", "テセウスの船を書いた人", "板を入れかえ続けた「テセウスの船」の話を本に書き残した、昔のギリシャの人は？", "プルタルコス", PEOPLE,
    "昔のギリシャの人は1人だけ。", "プルタルコスが『英雄伝』のテセウス伝に書きました。アテネの人が古い板を新しい板にかえ続けたと書いています。", ["plut"]);
  F("who-hobbes", "2そう目を足した人", "テセウスの船の話に「はずした古い板で、もう1そう組んだら？」という問いを足した人は？", "ホッブズ", PEOPLE,
    "『物体論』という本を書いた人。", "ホッブズが『物体論』で、古い板を同じ順に組み直したらどちらが同じ船か、と問いました。", ["hobbes", "sepmc"]);
  F("book-plut", "プルタルコスの本", "プルタルコスが、テセウスの船のことを書いた本は？", "『英雄伝』", BOOKS,
    "昔の英雄たちの一生を書いた本。", "テセウスの船は、プルタルコス『英雄伝』のテセウス伝 23 に出てきます。", ["plut"]);
  F("book-hobbes", "ホッブズの本", "ホッブズが、2そう目の船の問いを書いた本は？", "『物体論』", BOOKS,
    "物とは何かを考えた本。", "ホッブズ『物体論』（De Corpore）の第2部第11章7節に出てきます。", ["hobbes"]);
  F("oars", "櫂の数", "プルタルコスによると、テセウスの船は、こぐ櫂が何本の船？", "30本", ["10本", "30本", "50本", "100本"],
    "英語の訳では thirty-oared。", "プルタルコスは「30本の櫂の船」と書いています。", ["plut"]);
  F("until", "いつまで残した", "プルタルコスによると、アテネの人はテセウスの船を、だれの時代まで残した？", "デメトリオス", ["デメトリオス", "ペリクレス", "テミストクレス", "カエサル"],
    "アテネを治めた人の名前。", "プルタルコスは「デメトリオス・ファレレウスの時代まで」残したと書いています。", ["plut"]);
  F("grow", "哲学者の問い", "プルタルコスによると、この船は哲学者のあいだで、何の問いの例になった？", "育つものは同じか", ["育つものは同じか", "船はなぜうくか", "海はどこまで続くか", "星はなぜ光るか"],
    "板が入れかわって、変わっていくもの。", "哲学者は、変わっていくもの（育つもの）が同じかどうかの例にしました。同じ船と言う人も、ちがう船と言う人もいたそうです。", ["plut"]);
  F("year", "物体論の年", "ホッブズの『物体論』（De Corpore）が出たのは？", "1655年", ["1455年", "1555年", "1655年", "1755年"],
    "17世紀。", "『物体論』は1655年に出ました（ラテン語）。", ["hobbes"]);

  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv, date) => KINDS.filter((k) => k.lv === lv && (!date || !k.since || k.since <= date)).map((k) => k.id);

  // part:seedOf:begin（shared-workflows の template/parts/data/seedOf.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // part:seedOf:end
  // part:rng:begin（shared-workflows の template/parts/data/rng.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // part:rng:end

  // 1問を作る。tag は「種類|種」（例 "hobbes-kata|2026-11-27:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null;
    if (!k) return null;
    const R = rng(seedOf(tag));
    const base = { tag, kind, lv: k.lv, name: k.name, look: k.look, src: k.src.map((s) => SRC[s]), type: "act" };
    if (k.fact) {
      const opts = shuffle(R, k.fopts);
      return { ...base, media: "出典の問題", q: k.q, ask: "", opts, ans: k.ans, key: k.key, why: k.why, grp: null, v: opts.map((o) => k.fopts.indexOf(o)).join("") };
    }
    const S = SC[k.sc], N = [6, 8, 10][ri(R, 0, 2)], kk = k.sc === "partial" ? ri(R, 1, N - 1) : 0, swap = R() < 0.5;
    const others = CK.filter((c) => c !== k.card), c2 = others[ri(R, 0, 1)];
    const A = S.A(N, kk), B = S.B(N, kk), Ls = swap ? B : A, Rs = swap ? A : B;
    const ans = answerOf(k.card, Ls, Rs, N), grp = answerOf(c2, Ls, Rs, N);
    const svg = shipSvg(N, Ls, Rs, R, S.pre);
    const q = `${S.pre || ""}板は${N}枚。左：${Ls.d}。右：${Rs.d}。`;
    return { ...base, media: `${S.name}・板${N}枚`, svg, q, card: k.card, c2, ask: `「${CARDS[k.card].name}」なら、テセウスの船は？`, q2: `では「${CARDS[c2].name}」なら？`,
      opts: OPTS.slice(), ans: GROUPS[ans].name, grp, key: `左は${seeOf(k.card, Ls, N)}・右は${seeOf(k.card, Rs, N)}。`,
      why: explain(k.card, Ls, Rs, N), gwhy: explain(c2, Ls, Rs, N), v: `${swap ? 1 : 0}${c2}${N}.${kk}`, N, k: kk, Ls, Rs };
  }
  // 同じ問題かを見分ける鍵（種類・言い方・選び肢の組・2段目の札）
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}:${P.c2 || ""}`;

  // 今日の5問（やさしい1・ふつう2・ひねり1・出典1。種類は重ねない。出会う → 慣れる → ひねる → まとめる）
  function dailyTags(date) {
    // 札の問題の最初の3問は、札（形・板・つながり）を重ねない。ふつうの2問は場面も重ねない
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0, date), 1), used = new Set([BY[e[0]].card]), n = [];
    for (const id of shuffle(R, kindsOf(1, date))) if (n.length < 2 && !used.has(BY[id].card) && !n.some((x) => BY[x].sc === BY[id].sc)) { n.push(id); used.add(BY[id].card); }
    const h = pickN(R, kindsOf(2, date), 1), f = pickN(R, kindsOf(3, date), 1);
    return [...e, ...n, ...h, ...f].map((id, i) => `${id}|${date}:d${i}`);
  }
  // 上級の3問（ひねりだけ・今日の5問のひねりとは別の種類）
  function hardTags(date) {
    const dh = dailyTags(date)[3].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2, date).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  // ---- 航海（正解のない問い）----
  // 板6枚の船。板を1枚ずつかえて、毎回「まだ同じ船？」（はい・いいえ）。最後に古い板で2そう目ができ、どちらが本物かを選ぶ
  const VN = 6;
  const FINAL = { A: "板をかえ続けた船", B: "古い板で組んだ船", both: "両方とも本物", none: "どちらも本物ではない" };
  // 札ごとの答え方（航海の各回は true＝同じ船、最後は FINAL のどれか）
  const VPRED = { kata: { step: true, fin: "both" }, ita: { step: false, fin: "B" }, tsuna: { step: true, fin: "A" } };
  function voyage(seed) { const R = rng(seedOf("voy:" + seed)); return { N: VN, order: shuffle(R, [...Array(VN).keys()]) }; }
  // 自分の答え（steps: true/false の配列、fin）と、札ごとに合った数。変わり目は、はじめて「いいえ」にした板の番目（無ければ 0）
  function voyScore(steps, fin) {
    const out = {};
    for (const c of CK) out[c] = steps.filter((x) => x === VPRED[c].step).length + (fin === VPRED[c].fin ? 1 : 0);
    const turn = steps.indexOf(false) + 1;
    const top = Math.max(...CK.map((c) => out[c]));
    return { per: out, turn, near: CK.filter((c) => out[c] === top), max: steps.length + 1 };
  }
  // 航海の船の絵（n 枚かえたところ。two なら古い板の2そう目も）
  function voySvg(v, n, two) {
    const one = (x0, flag, label, oldSide) => {
      const N = v.N, w = 120, top = 72, bot = 112, pw = w / N, isNew = new Set(oldSide ? [] : v.order.slice(0, n));
      let s = "";
      for (let i = 0; i < N; i++) {
        const x = x0 + i * pw, nw = isNew.has(i), inset = i === 0 || i === N - 1 ? 14 : 0;
        const pts = i === 0 ? `${x},${top} ${x + pw},${top} ${x + pw},${bot} ${x + inset},${bot}` : i === N - 1 ? `${x},${top} ${x + pw},${top} ${x + pw - inset},${bot} ${x},${bot}` : `${x},${top} ${x + pw},${top} ${x + pw},${bot} ${x},${bot}`;
        s += `<polygon class="${nw && i === v.order[n - 1] && !oldSide ? "pk-new" : ""}" points="${pts}" fill="${nw ? "url(#vnw)" : "#6b3f1d"}" stroke="#2b1a0c" stroke-width="1.5"/>`;
        if (nw) s += `<circle cx="${x + pw / 2}" cy="${top + 10}" r="2.6" fill="#2b1a0c"/>`;
      }
      s += `<line x1="${x0 + w / 2}" y1="${top}" x2="${x0 + w / 2}" y2="22" stroke="#2b1a0c" stroke-width="3"/><path d="M${x0 + w / 2 + 2} 26 L${x0 + w / 2 + 40} 60 L${x0 + w / 2 + 2} 62 Z" fill="#fffdf7" stroke="#2b1a0c" stroke-width="1.5"/>`;
      const fx = x0 + w / 2, fy = 16;
      s += flag === "●" ? `<circle cx="${fx - 10}" cy="${fy + 4}" r="8" fill="#1f4f7a" stroke="#2b1a0c" stroke-width="1.5"/>` : `<path d="M${fx - 2} ${fy - 4} L${fx - 22} ${fy + 4} L${fx - 2} ${fy + 12} Z" fill="#b23a24" stroke="#2b1a0c" stroke-width="1.5"/>`;
      s += `<text x="${fx}" y="136" text-anchor="middle" font-size="13" font-weight="700" fill="#1d2a3f">${label}</text>`;
      return s;
    };
    const pile = two ? "" : `<g>${[...Array(n).keys()].map((i) => `<rect x="${236 + (i % 2) * 6}" y="${126 - i * 7}" width="60" height="6" rx="1" fill="#6b3f1d" stroke="#2b1a0c"/>`).join("")}${n ? `<text x="266" y="${118 - n * 7}" text-anchor="middle" font-size="11" fill="#1d2a3f">はずした板 ${n}枚</text>` : ""}</g>`;
    return `<svg viewBox="0 0 320 146" role="img" aria-label="${two ? "左：板を全部かえ続けた船。右：はずした古い板で組んだ船" : `板を${n}枚かえた船。はずした古い板は${n}枚`}" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="vnw" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#f0d9a8"/><rect width="2" height="6" fill="#c9a25f"/></pattern></defs>
      <rect width="320" height="146" fill="#dfeaf2"/><path d="M0 114 Q20 108 40 114 T80 114 T120 114 T160 114 T200 114 T240 114 T280 114 T320 114 V146 H0Z" fill="#9fc3dc"/>
      ${two ? one(24, "●", "かえ続けた ●", false) + one(176, "▲", "古い板 ▲", true) : one(60, "●", `${n}枚かえた`, false) + pile}</svg>`;
  }

  const ONF = { KINDS, BY, GROUPS, LV, SRC, CARDS, SC, OPTS, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN, judge, answerOf, VN, FINAL, VPRED, voyage, voyScore, voySvg };
  if (typeof module !== "undefined" && module.exports) module.exports = ONF; else root.ONF = ONF;
})(typeof self !== "undefined" ? self : this);
