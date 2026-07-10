import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);
const html = fs.readFileSync(new URL("index.html", root), "utf8");
const app = fs.readFileSync(new URL("app.js", root), "utf8");
const worker = fs.readFileSync(new URL("service-worker.js", root), "utf8");
const manifest = JSON.parse(fs.readFileSync(new URL("manifest.webmanifest", root), "utf8"));

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, "HTMLに重複したidがあります");

const directIds = [...app.matchAll(/\$\("#([A-Za-z0-9_-]+)"\)\.(?:addEventListener|value|textContent|classList|hidden|innerHTML|disabled)/g)]
  .map((match) => match[1]);
const missingIds = [...new Set(directIds)].filter((id) => !ids.includes(id));
assert.deepEqual(missingIds, [], `HTMLにないidを参照しています: ${missingIds.join(", ")}`);

const assetsBlock = worker.match(/const ASSETS = \[([\s\S]*?)\];/)?.[1] || "";
const assets = [...assetsBlock.matchAll(/"\.\/([^"?]*)(?:\?[^"}]*)?"/g)].map((match) => match[1]).filter(Boolean);
assets.forEach((asset) => assert.ok(fs.existsSync(new URL(asset, root)), `Service Workerのファイルがありません: ${asset}`));
manifest.icons.forEach((icon) => assert.ok(fs.existsSync(new URL(icon.src, root)), `PWAアイコンがありません: ${icon.src}`));

const forbiddenCopy = ["栄養データでならす", "この食事の見立て", "増えやすい枠", "収まり日", "記録は回っています"];
forbiddenCopy.forEach((copy) => assert.ok(!html.includes(copy) && !app.includes(copy), `不自然な文言が残っています: ${copy}`));

console.log("static-integrity: ok");
