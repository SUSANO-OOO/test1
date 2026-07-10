const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/dist/transformers.min.js";
const MODEL_ID = "Xenova/clip-vit-base-patch32";

const ingredientLabels = [
  ["beef", "牛肉"], ["pork", "豚肉"], ["chicken", "鶏肉"], ["meat", "肉類"],
  ["fish", "魚"], ["salmon", "鮭"], ["tuna", "まぐろ"], ["shrimp", "えび"],
  ["squid", "いか"], ["octopus", "たこ"], ["egg", "卵"], ["tofu", "豆腐"],
  ["cheese", "チーズ"], ["sausage", "ソーセージ"], ["rice", "ご飯"], ["noodles", "麺"],
  ["bread", "パン"], ["pasta", "パスタ"], ["lotus root", "レンコン"], ["burdock root", "ごぼう"],
  ["potato", "じゃがいも"], ["sweet potato", "さつまいも"], ["taro", "里芋"],
  ["carrot", "にんじん"], ["onion", "玉ねぎ"], ["green onion", "ねぎ"],
  ["daikon radish", "大根"], ["turnip", "かぶ"], ["cabbage", "キャベツ"],
  ["Chinese cabbage", "白菜"], ["lettuce", "レタス"], ["spinach", "ほうれん草"],
  ["broccoli", "ブロッコリー"], ["cauliflower", "カリフラワー"], ["tomato", "トマト"],
  ["bell pepper", "ピーマン"], ["eggplant", "なす"], ["cucumber", "きゅうり"],
  ["pumpkin", "かぼちゃ"], ["bean sprouts", "もやし"], ["mushroom", "きのこ"],
  ["corn", "とうもろこし"], ["okra", "オクラ"], ["green beans", "いんげん"],
  ["peas", "えんどう豆"], ["apple", "りんご"], ["banana", "バナナ"],
  ["strawberry", "いちご"], ["orange", "みかん"]
];

let runtimePromise;
let classifierPromise;

function report(callback, message, progress = null) {
  callback?.({ message, progress });
}

async function getRuntime() {
  if (!runtimePromise) runtimePromise = import(TRANSFORMERS_URL);
  return runtimePromise;
}

function modelProgress(callback, event) {
  if (event?.status === "progress_total" && Number.isFinite(event.progress)) {
    report(callback, `初回の解析モデルを準備中 ${Math.round(event.progress)}%`, event.progress);
    return;
  }
  if (event?.status === "ready") report(callback, "解析モデルの準備ができました", 100);
}

async function getClassifier(callback) {
  if (!classifierPromise) {
    classifierPromise = getRuntime().then(({ env, pipeline }) => {
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      if (env.backends?.onnx?.wasm) env.backends.onnx.wasm.proxy = true;
      return pipeline("zero-shot-image-classification", MODEL_ID, {
        dtype: "q8",
        progress_callback: (event) => modelProgress(callback, event)
      });
    }).catch((error) => {
      classifierPromise = null;
      throw error;
    });
  } else {
    report(callback, "保存済みの解析モデルを読み込んでいます");
  }
  return classifierPromise;
}

function toCertainty(score) {
  if (score >= 0.38) return "high";
  if (score >= 0.2) return "medium";
  return "low";
}

async function buildAnalysisViews(image) {
  const views = [image];
  if (image.width < 160 || image.height < 160) return views;
  const width = image.width;
  const height = image.height;
  const halfWidth = Math.floor(width / 2);
  const halfHeight = Math.floor(height / 2);
  const overlapX = Math.floor(width * 0.12);
  const overlapY = Math.floor(height * 0.12);
  const boxes = [
    [Math.floor(width * 0.12), Math.floor(height * 0.12), Math.floor(width * 0.88), Math.floor(height * 0.88)],
    [0, 0, halfWidth + overlapX, halfHeight + overlapY],
    [halfWidth - overlapX, 0, width - 1, halfHeight + overlapY],
    [0, halfHeight - overlapY, halfWidth + overlapX, height - 1],
    [halfWidth - overlapX, halfHeight - overlapY, width - 1, height - 1]
  ];
  for (const box of boxes) views.push(await image.crop(box));
  return views;
}

function mergeResults(viewResults) {
  const scores = new Map();
  for (const results of viewResults) {
    for (const item of results.slice(0, 5)) {
      const score = Number(item.score) || 0;
      if (score < 0.035) continue;
      const current = scores.get(item.label) || { max: 0, sum: 0, hits: 0 };
      current.max = Math.max(current.max, score);
      current.sum += score;
      current.hits += 1;
      scores.set(item.label, current);
    }
  }

  let ranked = [...scores.entries()].map(([label, evidence]) => ({
    label,
    score: evidence.max + Math.min(0.12, (evidence.hits - 1) * 0.035) + Math.min(0.08, evidence.sum * 0.08)
  })).sort((a, b) => b.score - a.score);

  const specificMeats = new Set(["beef", "pork", "chicken"]);
  const meatResults = ranked.filter((item) => specificMeats.has(item.label));
  if (meatResults.length > 1 && meatResults[0].score < 0.34 && meatResults[0].score - meatResults[1].score < 0.06) {
    ranked = ranked.filter((item) => !specificMeats.has(item.label));
    const generic = ranked.find((item) => item.label === "meat");
    if (generic) generic.score = Math.max(generic.score, meatResults[0].score);
    else ranked.push({ label: "meat", score: meatResults[0].score });
    ranked.sort((a, b) => b.score - a.score);
  } else if (meatResults[0]?.score >= 0.25) {
    ranked = ranked.filter((item) => item.label !== "meat");
  }
  return ranked.filter((item) => item.score >= 0.095).slice(0, 8);
}

export async function analyzeMealPhoto(imageDataUrl, onProgress) {
  report(onProgress, "端末内AIを起動しています");
  const [{ RawImage }, classifier] = await Promise.all([getRuntime(), getClassifier(onProgress)]);
  const image = await RawImage.fromURL(imageDataUrl);
  const views = await buildAnalysisViews(image);
  const labels = ingredientLabels.map(([english]) => english);
  const viewResults = [];

  for (let index = 0; index < views.length; index += 1) {
    report(onProgress, `写真の${index + 1}/${views.length}領域を確認中`, ((index + 0.2) / views.length) * 100);
    viewResults.push(await classifier(views[index], labels, {
      hypothesis_template: "a close-up meal photo containing {}"
    }));
  }

  const ingredients = mergeResults(viewResults).map((item) => ({
    name: ingredientLabels.find(([english]) => english === item.label)?.[1] || item.label,
    certainty: toCertainty(item.score)
  })).filter((item, index, items) => items.findIndex((other) => other.name === item.name) === index);

  report(onProgress, "食材候補をまとめています", 100);
  return {
    summary: ingredients.length
      ? "写真全体と各領域を端末内AIで確認しました。候補を選び、食べた量を入力してください。"
      : "写真から食材を絞り込めませんでした。材料名を入力してください。",
    dishes: [],
    ingredients
  };
}
