import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const context = {
  console,
  Date,
  Math,
  Map,
  Set,
  structuredClone,
  window: { __MEALLENS_TEST__: true, MEALLENS_FOOD_DATA: null },
  localStorage: { getItem: () => null, setItem: () => {} }
};
context.window.window = context.window;
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL("../food-data.js", import.meta.url), "utf8"), context);
context.window.MEALLENS_FOOD_DATA = context.window.MEALLENS_FOOD_DATA;
vm.runInContext(fs.readFileSync(new URL("../food-matcher.js", import.meta.url), "utf8"), context);
vm.runInContext(fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), context);

assert.equal(context.window.MEALLENS_FOOD_DATA.foods.length, 2538);

const api = context.window.MealLensTestApi;
const beef = api.resolveIngredient({ name: "牛肉", foodId: "" });
assert.ok(beef);
assert.equal(beef.label, "牛こま切れ肉");
assert.equal(beef.approximate, true);

const beefResult = api.estimateIngredientList([{ name: "牛肉", foodId: "", amount: 100, unit: "g" }]);
assert.equal(beefResult.unmatched.length, 0);
assert.equal(beefResult.matched.length, 1);
assert.ok(beefResult.calories > 100);
assert.match(beefResult.approximations[0], /牛肉 → 牛こま切れ肉/);

const typoResult = api.estimateIngredientList([{ name: "ブロコリー", foodId: "", amount: 100, unit: "g" }]);
assert.equal(typoResult.unmatched.length, 0);
assert.equal(typoResult.matched.length, 1);

const quantity = api.parseIngredientText("卵2個");
assert.equal(quantity.name, "卵");
assert.equal(quantity.amount, 2);
assert.equal(quantity.unit, "個");

const invalidUnit = api.estimateIngredientList([{ name: "牛肉", foodId: "", amount: 1, unit: "個" }]);
assert.equal(invalidUnit.matched.length, 0);
assert.equal(invalidUnit.unmatched.length, 1);

assert.equal(api.getFoodCandidates("存在しない食材xyz").length, 0);
const unknown = api.estimateIngredientList([{ name: "存在しない食材xyz", foodId: "", amount: 100, unit: "g" }]);
assert.equal(unknown.matched.length, 0);
assert.equal(unknown.unmatched.length, 1);

console.log("food-resolution: ok");
