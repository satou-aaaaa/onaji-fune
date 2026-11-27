// SNS で貼られたときの絵（og.png 1200×630）を作る。今日の問題（答え）は入れず、遊び方の例だけ（問題データにない言い方で、正解の印も付けない。CodeRabbit mansion-kimari#1）。
// 使い方: node tools/make-og.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  // 板6枚の船。nw は新しい板（明るいしま模様）の番目
  const ship = (x0, nw, flag) => { let s = ""; for (let i = 0; i < 6; i++) { const x = x0 + i * 40, n = nw.includes(i); s += `<rect x="${x}" y="300" width="40" height="110" fill="${n ? "url(#nw)" : "#6b3f1d"}" stroke="#2b1a0c" stroke-width="3"/>`; } return s + `<line x1="${x0 + 120}" y1="300" x2="${x0 + 120}" y2="120" stroke="#2b1a0c" stroke-width="8"/><path d="M${x0 + 126} 130 L${x0 + 230} 250 L${x0 + 126} 256 Z" fill="#fffdf7" stroke="#2b1a0c" stroke-width="4"/>${flag}`; };
  const line = (t) => `<div style="font-size:30px;font-weight:700;padding:10px 20px;border-radius:12px;background:#fff;border:3px solid #1d2a3f55">${t}</div>`;
  await p.setContent(`<body style="margin:0;font-family:'Noto Sans CJK JP','IPAPGothic',sans-serif">
  <div style="width:1200px;height:630px;box-sizing:border-box;padding:40px 56px;background:#f3efe4;color:#1d2a3f;display:flex;gap:40px;align-items:center">
    <div style="flex:0 0 400px">
      <div style="font-size:30px;color:#83261a;letter-spacing:.06em">テセウスの船</div>
      <div style="font-size:92px;font-weight:900;margin-top:8px;line-height:1.15;color:#123554">まだ<br><span style="color:#b23a24">同じ船？</span></div>
      <div style="font-size:34px;margin-top:14px">板を1枚ずつ<br>かえていくと…</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:22px">${line("○ はい、同じ船")}${line("✕ いいえ、別の船")}</div>
    </div>
    <svg viewBox="0 0 640 470" width="660" height="485" xmlns="http://www.w3.org/2000/svg" style="background:#dfeaf2;border:4px solid #1d2a3f;border-radius:10px">
      <defs><pattern id="nw" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#f0d9a8"/><rect width="5" height="14" fill="#c9a25f"/></pattern></defs>
      <path d="M0 400 Q40 385 80 400 T160 400 T240 400 T320 400 T400 400 T480 400 T560 400 T640 400 V470 H0Z" fill="#9fc3dc"/>
      <g transform="translate(-20,0) scale(.85) translate(30,60)">${ship(40, [0, 2, 3, 5], `<circle cx="140" cy="110" r="20" fill="#1f4f7a" stroke="#2b1a0c" stroke-width="3"/>`)}</g>
      <text x="320" y="56" text-anchor="middle" font-size="40" font-weight="900" fill="#123554">どこまで同じ？</text>
      <g>${[0, 1, 2, 3].map((i) => `<rect x="${430 + (i % 2) * 10}" y="${380 - i * 22}" width="160" height="18" rx="3" fill="#6b3f1d" stroke="#2b1a0c" stroke-width="3"/>`).join("")}<text x="512" y="282" text-anchor="middle" font-size="26" fill="#1d2a3f">はずした古い板</text></g>
    </svg>
  </div></body>`);
  await p.screenshot({ path: path.join(__dirname, "..", "og.png") });
  await b.close();
})();
