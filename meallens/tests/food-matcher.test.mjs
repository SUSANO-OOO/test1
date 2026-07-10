import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const context = { globalThis: {} };
vm.runInNewContext(fs.readFileSync(new URL("../food-matcher.js", import.meta.url), "utf8"), context);
const matcher = context.globalThis.MealLensFoodMatcher;

assert.equal(matcher.normalize(" ビーフ（生） "), "びーふ生");
assert.ok(matcher.compare("牛肉", ["うし 乳用肥育牛肉 かた"]).score >= 680);
assert.ok(matcher.compare("レンコン", ["れんこん 生"]).score >= 680);
assert.ok(matcher.compare("ブロコリー", ["ブロッコリー"]).score >= 500);
assert.equal(JSON.stringify(matcher.parse("牛肉 100g")), JSON.stringify({ name: "牛肉", amount: 100, unit: "g" }));
assert.equal(JSON.stringify(matcher.parse("卵2個")), JSON.stringify({ name: "卵", amount: 2, unit: "個" }));
assert.equal(JSON.stringify(matcher.parse("1本の長ねぎ")), JSON.stringify({ name: "長ねぎ", amount: 1, unit: "本" }));

console.log("food-matcher: ok");
