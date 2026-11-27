// アプリのアイコン（icon-192.png・icon-512.png）を作る。紺の地に、古い板と新しい板がまざった船（まだ同じ船？）。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of [192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#123554"/>
      <line x1="50" y1="58" x2="50" y2="16" stroke="#fffdf7" stroke-width="3"/><path d="M52 18 L76 50 L52 52 Z" fill="#fffdf7"/>
      ${[0, 1, 2, 3, 4].map((i) => `<rect x="${22 + i * 11.2}" y="58" width="11.2" height="20" fill="${i % 2 ? "#f0d9a8" : "#a8693a"}" stroke="#123554" stroke-width="1.5"/>`).join("")}
      <path d="M8 84 Q20 78 32 84 T56 84 T80 84 T104 84 V100 H0 V84Z" fill="#8fb8de"/></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
