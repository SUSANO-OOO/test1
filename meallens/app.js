const STORAGE_KEY = "tabe-photo-v2";
const PHOTO_DB_NAME = "meallens-photos";
const PHOTO_STORE_NAME = "meal-photos";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const toLocalIso = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const todayIso = () => toLocalIso(new Date());

const mealTypes = {
  setMeal: { label: "主食+おかず", kcal: 720, protein: 34, fat: 24, carb: 86 },
  riceBowl: { label: "ご飯もの", kcal: 760, protein: 24, fat: 22, carb: 108 },
  noodle: { label: "麺類", kcal: 690, protein: 22, fat: 20, carb: 98 },
  bread: { label: "パン類", kcal: 520, protein: 15, fat: 22, carb: 66 },
  fried: { label: "揚げ物", kcal: 820, protein: 30, fat: 42, carb: 78 },
  sweet: { label: "甘いもの", kcal: 360, protein: 6, fat: 16, carb: 50 },
  salad: { label: "サラダ", kcal: 280, protein: 18, fat: 14, carb: 20 },
  snack: { label: "おやつ", kcal: 260, protein: 5, fat: 12, carb: 34 },
  drink: { label: "飲み物", kcal: 180, protein: 4, fat: 5, carb: 28 }
};

const portionRates = {
  light: 0.75,
  normal: 1,
  large: 1.3
};

const eatenRatios = {
  all: { label: "全部", rate: 1 },
  most: { label: "少し残した", rate: 0.82 },
  half: { label: "半分くらい", rate: 0.55 },
  taste: { label: "少しだけ", rate: 0.25 }
};

const cookingFactors = {
  plain: { label: "油は少なめ", kcal: 0, protein: 0, fat: 0, carb: 0 },
  sauteed: { label: "炒め・焼き", kcal: 90, protein: 0, fat: 10, carb: 0 },
  fried: { label: "揚げた", kcal: 220, protein: 0, fat: 24, carb: 4 }
};

const officialFoodData = window.MEALLENS_FOOD_DATA || { source: null, foods: [] };
const officialFoods = Array.isArray(officialFoodData.foods) ? officialFoodData.foods : [];
const officialFoodById = new Map(officialFoods.map((food) => [String(food.id), food]));
const foodPresentationCache = new Map();
const foodMatcher = window.MealLensFoodMatcher;

// The official table is intentionally kept behind a consumer-facing food dictionary.
// Users choose ordinary grocery names; the matching terms select the precise source row.
const commonFoodCatalog = [
  { label: "豚バラ肉", aliases: ["豚バラ", "豚ばら", "ばら肉", "豚肉"], match: ["ぶた", "大型種肉", "ばら", "脂身つき", "生"] },
  { label: "豚こま切れ肉", aliases: ["豚こま", "豚小間", "豚こま肉", "豚こま切れ", "豚小間切れ", "こま切れ", "豚肉"], match: ["ぶた", "大型種肉", "かた", "脂身つき", "生"] },
  { label: "豚ロース", aliases: ["豚ロース肉", "豚肉"], match: ["ぶた", "大型種肉", "ロース", "脂身つき", "生"] },
  { label: "豚ヒレ", aliases: ["豚ヒレ肉", "豚肉"], match: ["ぶた", "大型種肉", "ヒレ", "赤肉", "生"] },
  { label: "豚もも肉", aliases: ["豚もも", "豚肉"], match: ["ぶた", "大型種肉", "もも", "脂身つき", "生"] },
  { label: "豚ひき肉", aliases: ["豚ミンチ", "豚挽肉", "豚肉"], match: ["ぶた", "ひき肉", "生"] },
  { label: "鶏むね肉", aliases: ["鶏胸肉", "鶏むね", "鶏肉"], match: ["にわとり", "若どり", "むね", "皮なし", "生"] },
  { label: "鶏もも肉（皮なし）", aliases: ["鶏もも", "鶏モモ", "鶏肉"], match: ["にわとり", "若どり", "もも", "皮なし", "生"] },
  { label: "鶏もも肉（皮つき）", aliases: ["鶏もも皮つき", "鶏肉"], match: ["にわとり", "若どり", "もも", "皮つき", "生"] },
  { label: "ささみ", aliases: ["鶏ささみ", "鶏肉"], match: ["にわとり", "若どり", "ささみ", "生"] },
  { label: "鶏ひき肉", aliases: ["鶏ミンチ", "鶏挽肉", "鶏肉"], match: ["にわとり", "ひき肉", "生"] },
  { label: "牛こま切れ肉", aliases: ["牛こま", "牛小間", "牛肉"], match: ["うし", "乳用肥育牛肉", "かた", "脂身つき", "生"] },
  { label: "牛バラ肉", aliases: ["牛バラ", "牛ばら", "牛肉"], match: ["うし", "乳用肥育牛肉", "ばら", "脂身つき", "生"] },
  { label: "牛ひき肉", aliases: ["牛ミンチ", "牛挽肉", "牛肉"], match: ["うし", "ひき肉", "生"] },
  { label: "長ねぎ", aliases: ["白ねぎ", "白ネギ", "ネギ", "ねぎ"], match: ["根深ねぎ", "生"], unitWeights: { 本: 60 } },
  { label: "青ねぎ", aliases: ["青ネギ", "葉ねぎ", "葉ネギ", "ネギ", "ねぎ"], match: ["葉ねぎ", "生"], unitWeights: { 本: 30 } },
  { label: "小ねぎ", aliases: ["小ネギ", "万能ねぎ", "カットねぎ", "ネギ", "ねぎ"], match: ["こねぎ", "生"], unitWeights: { 本: 20 } },
  { label: "玉ねぎ", aliases: ["たまねぎ"], match: ["たまねぎ", "りん茎", "生"], unitWeights: { 個: 180 } },
  { label: "炊いた白米", aliases: ["ご飯", "ごはん", "白米", "米"], match: ["こめ", "水稲めし", "精白米"] },
  { label: "卵", aliases: ["たまご", "鶏卵"], match: ["鶏卵", "全卵", "生"], unitWeights: { 個: 50 } },
  { label: "木綿豆腐", aliases: ["豆腐", "木綿"], match: ["木綿豆腐"] },
  { label: "納豆", aliases: ["納豆1パック"], match: ["納豆", "糸引き納豆"], unitWeights: { パック: 40 } }
];

const genericFoodDefaults = [
  { aliases: ["牛肉", "ぎゅうにく", "牛にく", "ビーフ"], label: "牛こま切れ肉" },
  { aliases: ["豚肉", "ぶたにく", "豚にく", "ポーク"], label: "豚こま切れ肉" },
  { aliases: ["鶏肉", "とりにく", "鳥肉", "チキン"], label: "鶏むね肉" },
  { aliases: ["ねぎ", "ネギ", "葱"], label: "長ねぎ" },
  { aliases: ["ご飯", "ごはん", "白米", "米"], label: "炊いた白米" },
  { aliases: ["豆腐"], label: "木綿豆腐" }
];

const ingredientProfiles = [
  { label: "鶏肉（部位不明）", aliases: ["鶏肉", "鳥肉", "チキン"], kcal: 190, protein: 20, fat: 12, carb: 0 },
  { label: "豚肉（部位不明）", aliases: ["豚肉", "ポーク"], kcal: 250, protein: 19, fat: 19, carb: 0 },
  { label: "牛肉（部位不明）", aliases: ["牛肉", "ビーフ"], kcal: 260, protein: 18, fat: 21, carb: 0 },
  { label: "魚（種類不明）", aliases: ["魚", "魚類"], kcal: 170, protein: 21, fat: 9, carb: 0 },
  { label: "肉（種類不明）", aliases: ["肉", "肉類"], kcal: 240, protein: 19, fat: 18, carb: 0 },
  { label: "野菜（種類不明）", aliases: ["野菜", "野菜類"], kcal: 30, protein: 1.5, fat: 0.2, carb: 6 },
  { label: "鮭", aliases: ["鮭", "サーモン"], kcal: 200, protein: 22, fat: 13, carb: 0 },
  { label: "えび", aliases: ["えび", "海老", "エビ"], kcal: 82, protein: 18.4, fat: 0.3, carb: 0.5 },
  { label: "いか", aliases: ["いか", "烏賊", "イカ"], kcal: 76, protein: 17.9, fat: 0.8, carb: 0.1 },
  { label: "たこ", aliases: ["たこ", "蛸", "タコ"], kcal: 70, protein: 16.4, fat: 0.7, carb: 0.1 },
  { aliases: ["卵", "たまご"], kcal: 151, protein: 12, fat: 10, carb: 0, units: { 個: 50 } },
  { aliases: ["ご飯", "白米", "米"], kcal: 156, protein: 2.5, fat: 0.3, carb: 37 },
  { aliases: ["うどん"], kcal: 95, protein: 2.6, fat: 0.4, carb: 21 },
  { aliases: ["そば"], kcal: 114, protein: 4.8, fat: 0.7, carb: 22 },
  { aliases: ["パスタ", "スパゲッティ"], kcal: 150, protein: 5.5, fat: 0.9, carb: 30 },
  { aliases: ["食パン", "パン"], kcal: 264, protein: 9.3, fat: 4.4, carb: 47, units: { 枚: 60 } },
  { aliases: ["豆腐"], kcal: 72, protein: 6.6, fat: 4.2, carb: 1.6 },
  { aliases: ["納豆"], kcal: 190, protein: 16.5, fat: 10, carb: 12, units: { パック: 40 } },
  { aliases: ["牛乳"], kcal: 61, protein: 3.3, fat: 3.8, carb: 4.8, units: { 杯: 200 } },
  { aliases: ["チーズ"], kcal: 330, protein: 23, fat: 26, carb: 1, units: { 枚: 18 } },
  { aliases: ["ネギ", "ねぎ", "長ねぎ"], kcal: 28, protein: 1.2, fat: 0.1, carb: 7, units: { 本: 60 } },
  { aliases: ["玉ねぎ", "たまねぎ"], kcal: 37, protein: 1, fat: 0.1, carb: 8.8, units: { 個: 180 } },
  { aliases: ["キャベツ"], kcal: 23, protein: 1.3, fat: 0.2, carb: 5.2 },
  { aliases: ["レタス"], kcal: 12, protein: 0.6, fat: 0.1, carb: 2.8 },
  { aliases: ["ブロッコリー"], kcal: 37, protein: 4.3, fat: 0.5, carb: 5.2 },
  { aliases: ["トマト"], kcal: 20, protein: 0.7, fat: 0.1, carb: 4.7, units: { 個: 150 } },
  { aliases: ["油", "オイル"], kcal: 921, protein: 0, fat: 100, carb: 0, units: { 杯: 12 } }
];

const slotDefaultTimes = {
  朝: "08:00",
  昼: "12:30",
  夜: "19:00",
  間食: "15:30"
};

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number(value) || 0));
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const nutritionBounds = {
  setMeal: { calories: [380, 980], protein: [12, 55], fat: [6, 45], carb: [35, 125] },
  riceBowl: { calories: [450, 1050], protein: [10, 45], fat: [5, 42], carb: [60, 145] },
  noodle: { calories: [360, 980], protein: [8, 42], fat: [4, 40], carb: [45, 135] },
  bread: { calories: [240, 760], protein: [5, 35], fat: [5, 36], carb: [25, 95] },
  fried: { calories: [500, 1150], protein: [12, 55], fat: [18, 65], carb: [35, 125] },
  sweet: { calories: [120, 620], protein: [0, 18], fat: [2, 32], carb: [15, 90] },
  salad: { calories: [120, 620], protein: [4, 42], fat: [2, 36], carb: [8, 55] },
  snack: { calories: [80, 520], protein: [0, 20], fat: [1, 32], carb: [8, 75] },
  drink: { calories: [0, 420], protein: [0, 16], fat: [0, 18], carb: [0, 70] }
};

const defaultState = {
  activeDate: todayIso(),
  selectedMealType: "setMeal",
  selectedCooking: "plain",
  selectedPortion: "normal",
  selectedSlot: "朝",
  selectedMealTime: "08:00",
  selectedEatenRatio: "all",
  analysisRange: "week",
  pendingPhoto: "",
  pendingVision: null,
  editingMealId: "",
  profile: {
    sex: "female",
    age: 35,
    height: 160,
    weight: 62,
    targetWeight: 56,
    activity: 1.375,
    workActivity: 0.08,
    dailyActivity: 0.08,
    pace: "gentle",
    targetCalories: 1700,
    maintenanceCalories: 1950
  },
  meals: []
};

let state = loadState();
let toastTimer = null;
let deferredInstallPrompt = null;
let nutritionEditedByUser = false;
let photoAnalysisToken = 0;
let isPhotoAnalyzing = false;
const persistedPhotoSignatures = new Map();

const viewHeaders = {
  home: {
    title: "今日の残り",
    lead: "写真で記録した食事から、残りカロリーとたんぱく質を見ます。"
  },
  capture: {
    title: "写真で記録",
    lead: "写真と食材の量から、カロリーとPFCを記録します。"
  },
  insight: {
    title: "食事の傾向",
    lead: "直近7日・30日の記録から、食事量と記録状況を確認します。"
  },
  settings: {
    title: "目安を設定",
    lead: "普段の活動量と減らし方から、1日のカロリー目安を計算します。"
  }
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultState);
    return normalizeStateData(JSON.parse(saved));
  } catch {
    return structuredClone(defaultState);
  }
}

function normalizeStateData(value) {
  const data = value && typeof value === "object" ? value : {};
  const rawProfile = data.profile && typeof data.profile === "object" ? data.profile : {};
  const profile = {
    sex: rawProfile.sex === "male" ? "male" : "female",
    age: normalizeFiniteNumber(rawProfile.age, 18, 99) || defaultState.profile.age,
    height: normalizeFiniteNumber(rawProfile.height, 120, 230) || defaultState.profile.height,
    weight: normalizeFiniteNumber(rawProfile.weight, 30, 250) || defaultState.profile.weight,
    targetWeight: normalizeFiniteNumber(rawProfile.targetWeight, 0, 250),
    workActivity: normalizeFiniteNumber(rawProfile.workActivity, 0, 0.3),
    dailyActivity: normalizeFiniteNumber(rawProfile.dailyActivity, 0, 0.28),
    pace: ["maintain", "gentle", "standard"].includes(rawProfile.pace) ? rawProfile.pace : "gentle"
  };
  profile.activity = calcActivityFactor(profile);
  Object.assign(profile, calcTargets(profile));
  const seenMealIds = new Set();
  const meals = (Array.isArray(data.meals) ? data.meals : []).map(normalizeMealRecord).map((meal) => {
    if (!seenMealIds.has(meal.id)) {
      seenMealIds.add(meal.id);
      return meal;
    }
    const uniqueMeal = { ...meal, id: `${Date.now()}-${Math.random().toString(16).slice(2)}` };
    seenMealIds.add(uniqueMeal.id);
    return uniqueMeal;
  });
  return {
    ...structuredClone(defaultState),
    activeDate: /^\d{4}-\d{2}-\d{2}$/.test(data.activeDate) ? data.activeDate : todayIso(),
    selectedMealType: hasOwn(mealTypes, data.selectedMealType) ? data.selectedMealType : "setMeal",
    selectedCooking: hasOwn(cookingFactors, data.selectedCooking) ? data.selectedCooking : "plain",
    selectedPortion: hasOwn(portionRates, data.selectedPortion) ? data.selectedPortion : "normal",
    selectedSlot: ["朝", "昼", "夜", "間食"].includes(data.selectedSlot) ? data.selectedSlot : "朝",
    selectedMealTime: /^\d{2}:\d{2}$/.test(data.selectedMealTime) ? data.selectedMealTime : "08:00",
    selectedEatenRatio: hasOwn(eatenRatios, data.selectedEatenRatio) ? data.selectedEatenRatio : "all",
    analysisRange: data.analysisRange === "month" ? "month" : "week",
    pendingPhoto: "",
    pendingVision: null,
    editingMealId: "",
    profile,
    meals
  };
}

function normalizeText(value, maxLength = 120) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeFiniteNumber(value, min = 0, max = 10000) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : 0;
}

function normalizePhotoUrl(value) {
  if (typeof value !== "string" || value.length > 3000000) return "";
  return /^data:image\/(?:jpeg|png|webp);base64,/i.test(value) ? value : "";
}

function normalizeVisionRecord(value) {
  if (!value || typeof value !== "object") return null;
  const ingredients = Array.isArray(value.ingredients)
    ? value.ingredients.slice(0, 12).map((item) => ({
      name: normalizeText(item?.name, 60),
      certainty: ["high", "medium", "low"].includes(item?.certainty) ? item.certainty : "medium"
    })).filter((item) => item.name)
    : [];
  return {
    ...value,
    summary: normalizeText(value.summary, 300),
    label: normalizeText(value.label, 80),
    signals: Array.isArray(value.signals) ? value.signals.slice(0, 12).map((item) => normalizeText(item, 80)).filter(Boolean) : [],
    ingredients,
    dishes: Array.isArray(value.dishes) ? value.dishes.slice(0, 5).map((item) => ({ name: normalizeText(item?.name, 80) })).filter((item) => item.name) : []
  };
}

function normalizeMealRecord(value) {
  const meal = value && typeof value === "object" ? value : {};
  const rawId = normalizeText(meal.id, 80);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(meal.date) ? meal.date : todayIso();
  const unitSet = new Set(["g", "個", "本", "枚", "パック", "杯"]);
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients.slice(0, 40).map((ingredient) => ({
    name: normalizeText(ingredient?.name, 80),
    foodId: normalizeText(ingredient?.foodId, 80),
    amount: normalizeFiniteNumber(ingredient?.amount, 0, 100000),
    unit: unitSet.has(ingredient?.unit) ? ingredient.unit : "g"
  })).filter((ingredient) => ingredient.name || ingredient.amount) : [];
  return {
    id: /^[A-Za-z0-9._:-]+$/.test(rawId) ? rawId : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date,
    createdAt: normalizeFiniteNumber(meal.createdAt, 0, Number.MAX_SAFE_INTEGER) || Date.now(),
    updatedAt: normalizeFiniteNumber(meal.updatedAt, 0, Number.MAX_SAFE_INTEGER) || undefined,
    slot: ["朝", "昼", "夜", "間食"].includes(meal.slot) ? meal.slot : "朝",
    time: /^\d{2}:\d{2}$/.test(meal.time) ? meal.time : "",
    name: normalizeText(meal.name, 120),
    type: hasOwn(mealTypes, meal.type) ? meal.type : "setMeal",
    typeLabel: normalizeText(meal.typeLabel, 80) || "食事",
    cooking: hasOwn(cookingFactors, meal.cooking) ? meal.cooking : "plain",
    portion: hasOwn(portionRates, meal.portion) ? meal.portion : "normal",
    eatenRatio: hasOwn(eatenRatios, meal.eatenRatio) ? meal.eatenRatio : "all",
    ingredients,
    photo: normalizePhotoUrl(meal.photo),
    vision: normalizeVisionRecord(meal.vision),
    calories: normalizeFiniteNumber(meal.calories),
    protein: normalizeFiniteNumber(meal.protein, 0, 1000),
    fat: normalizeFiniteNumber(meal.fat, 0, 1000),
    carb: normalizeFiniteNumber(meal.carb, 0, 2000),
    memo: normalizeText(meal.memo, 1000)
  };
}

function openPhotoDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PHOTO_DB_NAME, 1);
    request.addEventListener("upgradeneeded", () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PHOTO_STORE_NAME)) database.createObjectStore(PHOTO_STORE_NAME);
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

async function persistMealPhotos(meals = state.meals) {
  const photos = meals.filter((meal) => {
    if (!meal.id || !meal.photo) return false;
    const signature = `${meal.photo.length}:${meal.photo.slice(-32)}`;
    return persistedPhotoSignatures.get(meal.id) !== signature;
  });
  if (!photos.length) return;
  const database = await openPhotoDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(PHOTO_STORE_NAME, "readwrite");
    const store = transaction.objectStore(PHOTO_STORE_NAME);
    photos.forEach((meal) => store.put(meal.photo, meal.id));
    transaction.addEventListener("complete", () => {
      photos.forEach((meal) => persistedPhotoSignatures.set(meal.id, `${meal.photo.length}:${meal.photo.slice(-32)}`));
      resolve();
    });
    transaction.addEventListener("error", () => reject(transaction.error));
  });
  database.close();
}

async function deleteMealPhoto(mealId) {
  const database = await openPhotoDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(PHOTO_STORE_NAME, "readwrite");
    transaction.objectStore(PHOTO_STORE_NAME).delete(mealId);
    transaction.addEventListener("complete", resolve);
    transaction.addEventListener("error", () => reject(transaction.error));
  });
  database.close();
  persistedPhotoSignatures.delete(mealId);
}

async function migrateAndHydrateMealPhotos() {
  if (!("indexedDB" in window) || !state.meals.length) return;
  await persistMealPhotos(state.meals);
  const database = await openPhotoDatabase();
  const store = database.transaction(PHOTO_STORE_NAME, "readonly").objectStore(PHOTO_STORE_NAME);
  await Promise.all(state.meals.map((meal) => new Promise((resolve) => {
    if (meal.photo) return resolve();
    const request = store.get(meal.id);
    request.addEventListener("success", () => {
      if (request.result) {
        meal.photo = request.result;
        persistedPhotoSignatures.set(meal.id, `${meal.photo.length}:${meal.photo.slice(-32)}`);
      }
      resolve();
    });
    request.addEventListener("error", resolve);
  })));
  database.close();
  saveState();
  renderHome();
  renderMealList();
}

function saveState() {
  if ("indexedDB" in window) persistMealPhotos().catch(() => {});
  const storedState = {
    ...state,
    pendingPhoto: "",
    pendingVision: null,
    editingMealId: "",
    meals: state.meals.map((meal) => ({ ...meal, photo: "" }))
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedState));
  } catch {
    showToast("端末の保存容量が足りません。バックアップ後に不要な記録を整理してください");
  }
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function setView(viewId) {
  $$(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  $$(".bottom-nav button").forEach((button) => {
    const active = button.dataset.view === viewId;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  document.body.dataset.view = viewId;
  const header = viewHeaders[viewId] || viewHeaders.home;
  $("#appTitle").textContent = viewId === "home" ? `${formatActiveDateLabel()}の残り` : header.title;
  $("#appLead").textContent = header.lead;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatKcal(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("ja-JP")} kcal`;
}

function formatActiveDateLabel(date = state.activeDate) {
  if (date === todayIso()) return "今日";
  const [, month, day] = String(date).split("-").map(Number);
  return `${month}月${day}日`;
}

function mealsForDate(date) {
  return state.meals.filter((meal) => meal.date === date);
}

function calcDay(date) {
  const meals = mealsForDate(date);
  return {
    meals,
    calories: meals.reduce((sum, meal) => sum + Number(meal.calories || 0), 0),
    protein: meals.reduce((sum, meal) => sum + Number(meal.protein || 0), 0),
    fat: meals.reduce((sum, meal) => sum + Number(meal.fat || 0), 0),
    carb: meals.reduce((sum, meal) => sum + Number(meal.carb || 0), 0)
  };
}

function getLastDays(count) {
  const [year, month, day] = state.activeDate.split("-").map(Number);
  const base = new Date(year, month - 1, day);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() - (count - 1 - index));
    return toLocalIso(date);
  });
}

function calcTargets(profile = state.profile) {
  const sexOffset = profile.sex === "male" ? 5 : -161;
  const bmr = (10 * Number(profile.weight || 0)) + (6.25 * Number(profile.height || 0)) - (5 * Number(profile.age || 0)) + sexOffset;
  const activity = calcActivityFactor(profile);
  const maintenance = Math.max(0, Math.round(bmr * activity));
  const deficit = profile.pace === "gentle" ? 250 : profile.pace === "maintain" ? 0 : 400;
  const floor = profile.sex === "male" ? 1500 : 1200;
  const target = Math.max(floor, maintenance - deficit);
  return {
    bmr: Math.round(bmr),
    activity,
    maintenanceCalories: maintenance,
    targetCalories: Math.round(target)
  };
}

function calcActivityFactor(profile = state.profile) {
  const hasSplitActivity = profile.workActivity !== undefined || profile.dailyActivity !== undefined;
  if (!hasSplitActivity) return Number(profile.activity || 1.2);
  const work = Number(profile.workActivity || 0);
  const daily = Number(profile.dailyActivity || 0);
  return Math.min(1.78, Math.max(1.2, 1.2 + work + daily));
}

function inferSplitActivity(activity = 1.375) {
  const value = Number(activity || 1.375);
  if (value < 1.3) return { workActivity: 0, dailyActivity: 0 };
  if (value < 1.48) return { workActivity: 0.08, dailyActivity: 0.08 };
  if (value < 1.65) return { workActivity: 0.18, dailyActivity: 0.17 };
  return { workActivity: 0.3, dailyActivity: 0.28 };
}

function estimateMeal() {
  const base = mealTypes[state.selectedMealType];
  const rate = portionRates[state.selectedPortion] || 1;
  const cooking = cookingFactors[state.selectedCooking] || cookingFactors.plain;
  const riceBoost = $("#riceBoost")?.checked ? { kcal: 170, protein: 3, fat: 0, carb: 38 } : { kcal: 0, protein: 0, fat: 0, carb: 0 };
  const oilBoost = $("#oilBoost")?.checked ? { kcal: 180, protein: 0, fat: 20, carb: 0 } : { kcal: 0, protein: 0, fat: 0, carb: 0 };
  const proteinBoost = $("#proteinBoost")?.checked ? { kcal: 150, protein: 24, fat: 6, carb: 0 } : { kcal: 0, protein: 0, fat: 0, carb: 0 };
  const sauceBoost = $("#sauceBoost")?.checked ? { kcal: 90, protein: 0, fat: 2, carb: 18 } : { kcal: 0, protein: 0, fat: 0, carb: 0 };
  const boosts = [riceBoost, oilBoost, proteinBoost, sauceBoost].reduce((sum, item) => ({
    kcal: sum.kcal + item.kcal,
    protein: sum.protein + item.protein,
    fat: sum.fat + item.fat,
    carb: sum.carb + item.carb
  }), { kcal: 0, protein: 0, fat: 0, carb: 0 });
  const boostCount = ["riceBoost", "oilBoost", "proteinBoost", "sauceBoost"].filter((id) => $(`#${id}`)?.checked).length;
  const vision = state.pendingVision || {};
  const visionCalories = Math.round(Number(vision.calorieDelta || 0));
  const visionProtein = Math.round(Number(vision.proteinDelta || 0));
  const visionFat = Math.round(Number(vision.fatDelta || 0));
  const visionCarb = Math.round(Number(vision.carbDelta || 0));
  const estimate = sanitizeNutrition({
    calories: Math.round(base.kcal * rate + cooking.kcal + boosts.kcal + visionCalories),
    protein: Math.max(0, Math.round(base.protein * rate + cooking.protein + boosts.protein + visionProtein)),
    fat: Math.max(0, Math.round(base.fat * rate + cooking.fat + boosts.fat + visionFat)),
    carb: Math.max(0, Math.round(base.carb * rate + cooking.carb + boosts.carb + visionCarb)),
    typeLabel: base.label,
    confidence: vision.label || (boostCount || state.selectedCooking !== "plain" ? "写真と追加情報からの概算" : "写真からの概算")
  }, state.selectedMealType, state.selectedPortion);
  return applyEatenRatio(estimate, state.selectedEatenRatio);
}

function sanitizeNutrition(values, type = state.selectedMealType, portion = state.selectedPortion) {
  const bounds = nutritionBounds[type] || nutritionBounds.setMeal;
  const portionScale = portion === "light" ? 0.82 : portion === "large" ? 1.18 : 1;
  const clampBy = (key, value) => {
    const [min, max] = bounds[key];
    return Math.round(Math.min(Math.max(Number(value) || 0, min * portionScale), max * portionScale));
  };
  return {
    ...values,
    calories: Math.round(clampBy("calories", values.calories)),
    protein: clampBy("protein", values.protein),
    fat: clampBy("fat", values.fat),
    carb: clampBy("carb", values.carb)
  };
}

function applyEatenRatio(values, eatenKey = "all") {
  const ratio = eatenRatios[eatenKey]?.rate || 1;
  if (ratio >= 0.99) return values;
  return {
    ...values,
    calories: Math.max(0, Math.round(values.calories * ratio)),
    protein: Math.max(0, Math.round(values.protein * ratio)),
    fat: Math.max(0, Math.round(values.fat * ratio)),
    carb: Math.max(0, Math.round(values.carb * ratio)),
    confidence: `${values.confidence}+${eatenRatios[eatenKey].label}`
  };
}

function normalizeFoodText(value) {
  return foodMatcher?.normalize(value) || String(value || "").trim().toLowerCase();
}

function parseIngredientText(value) {
  return foodMatcher?.parse(value) || { name: String(value || "").trim(), amount: null, unit: null };
}

function getPreferredGenericLabel(query) {
  const normalized = normalizeFoodText(query);
  return genericFoodDefaults.find((item) => item.aliases.some((alias) => normalizeFoodText(alias) === normalized))?.label || "";
}

function roundTo(value, digits = 1) {
  const scale = 10 ** digits;
  return Math.round((Number(value) || 0) * scale) / scale;
}

function formatNumber(value, digits = 1) {
  return Number(roundTo(value, digits).toFixed(digits)).toString();
}

function findOfficialFood(match = []) {
  return officialFoods.find((food) => {
    const name = normalizeFoodText(food.name);
    return match.every((term) => name.includes(normalizeFoodText(term)));
  }) || null;
}

function getCatalogFood(entry) {
  return entry ? findOfficialFood(entry.match) : null;
}

function getCatalogCandidateByFoodId(foodId) {
  return commonFoodCatalog.find((entry) => String(getCatalogFood(entry)?.id) === String(foodId)) || null;
}

function searchCatalog(query, limit = 8) {
  const parsed = parseIngredientText(query);
  const normalized = normalizeFoodText(parsed.name);
  if (!normalized.length) return [];
  const preferredLabel = getPreferredGenericLabel(parsed.name);
  return commonFoodCatalog.map((entry, index) => {
    const food = getCatalogFood(entry);
    if (!food) return null;
    const match = foodMatcher?.compare(parsed.name, [entry.label, ...entry.aliases]) || { score: 0, kind: "none" };
    const preference = preferredLabel === entry.label ? 140 : 0;
    const score = match.score + preference;
    return score ? { entry, food, score, matchKind: match.kind, representative: Boolean(preference), index } : null;
  }).filter(Boolean)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit);
}

function getFoodPresentation(food) {
  const cacheKey = String(food?.id || food?.name || "");
  if (foodPresentationCache.has(cacheKey)) return foodPresentationCache.get(cacheKey);
  const raw = String(food?.name || "");
  const cleaned = raw
    .replace(/^＜[^＞]+＞\s*/, "")
    .replace(/^[（(][^）)]+[）)]\s*/, "")
    .replace(/[［\[][^］\]]+[］\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const knownLabel = raw.includes("根深ねぎ") ? "長ねぎ"
    : raw.includes("葉ねぎ") ? "青ねぎ"
      : raw.includes("こねぎ") ? "小ねぎ"
        : raw.includes("たまねぎ") ? "玉ねぎ"
          : raw.includes("水稲めし") && raw.includes("精白米") ? "炊いた白米"
            : raw.includes("鶏卵") && raw.includes("全卵") ? "卵"
              : raw.includes("木綿豆腐") ? "木綿豆腐"
                : raw.includes("絹ごし豆腐") ? "絹ごし豆腐"
                  : "";
  const stateTerms = ["生", "ゆで", "焼き", "蒸し", "油いため", "揚げ", "から揚げ", "天ぷら", "フライ", "乾", "冷凍", "缶詰", "水煮", "塩蔵", "砂糖漬", "レトルト"];
  const detailFromRaw = stateTerms.filter((term) => raw.includes(term));
  const meat = /^ぶた(?:\s|$)/.test(cleaned) ? "豚" : /^にわとり(?:\s|$)/.test(cleaned) ? "鶏" : /^うし(?:\s|$)/.test(cleaned) ? "牛" : "";
  if (meat) {
    const cut = ["かたロース", "リブロース", "サーロイン", "ロース", "そともも", "ばら", "もも", "ランプ", "かた", "ヒレ", "ひき肉", "むね", "ささみ", "手羽", "舌", "心臓", "肝臓", "じん臓", "小腸", "大腸", "横隔膜", "腱", "尾"].find((item) => raw.includes(item));
    const cutLabel = { ばら: "バラ", むね: "むね", もも: "もも", かた: "肩", ヒレ: "ヒレ", ひき肉: "ひき肉", 舌: "タン", 心臓: "心臓", 肝臓: "レバー", じん臓: "腎臓" }[cut] || cut || "";
    const productName = cleaned.replace(/^(?:ぶた|にわとり|うし)\s*/, "").split(" ")[0] || "";
    const processedLabel = productName.replace(/缶詰$/, "") || `${meat}加工品`;
    const noMeatSuffix = ["かたロース", "リブロース", "サーロイン", "ロース", "ランプ", "ヒレ", "ひき肉", "ささみ", "手羽", "タン", "心臓", "レバー", "腎臓", "小腸", "大腸", "横隔膜", "腱", "尾"];
    const label = cut
      ? `${meat}${cutLabel}${noMeatSuffix.includes(cutLabel) ? "" : "肉"}`
      : raw.includes("［加工品］") ? processedLabel : `${meat}肉`;
    const breed = raw.includes("和牛肉") ? "和牛" : raw.includes("輸入牛肉") ? "輸入牛" : raw.includes("乳用肥育牛肉") ? "国産牛" : "";
    const detail = [breed, "皮なし", "皮つき", "脂身つき", "皮下脂肪なし", "赤肉", ...detailFromRaw]
      .filter((item, index, items) => item && raw.includes(item === "和牛" ? "和牛肉" : item === "輸入牛" ? "輸入牛肉" : item === "国産牛" ? "乳用肥育牛肉" : item) && items.indexOf(item) === index);
    const presentation = {
      label,
      detail: detail.join("・"),
      searchText: raw
    };
    foodPresentationCache.set(cacheKey, presentation);
    return presentation;
  }
  const tokens = cleaned.split(" ").filter(Boolean);
  const detailTokens = tokens.filter((token) => stateTerms.some((term) => token.includes(term)));
  const titleTokens = tokens.filter((token) => !detailTokens.includes(token) && !["葉", "軟白", "りん茎", "肉", "類"].includes(token));
  const label = knownLabel || titleTokens.slice(0, 3).join("") || cleaned;
  const detail = [...new Set([...detailFromRaw, ...detailTokens])].join("・");
  const presentation = { label, detail, searchText: raw };
  foodPresentationCache.set(cacheKey, presentation);
  return presentation;
}

function simplifyOfficialFoodName(food) {
  return getFoodPresentation(food).label;
}

function rankOfficialFoodCandidates(query, limit = 8) {
  const parsed = parseIngredientText(query);
  const normalized = normalizeFoodText(parsed.name);
  if (!normalized.length || !officialFoods.length) return [];
  return officialFoods.map((food) => {
    const presentation = getFoodPresentation(food);
    const match = foodMatcher?.compare(parsed.name, [food.name, presentation.label, presentation.detail]) || { score: 0, kind: "none" };
    if (!match.score) return { food, presentation, score: 0, matchKind: "none" };
    let score = match.score;
    if (food.name.includes(" 生")) score += 35;
    if (food.name.includes("脂身つき") || food.name.includes("皮下脂肪なし")) score += 28;
    if (food.name.includes("［大型種肉］") || food.name.includes("［若どり・")) score += 18;
    if (food.name.includes("［乳用肥育牛肉］")) score += 24;
    if (food.name.includes("［交雑牛肉］")) score -= 8;
    if (food.name.includes("［和牛肉］")) score -= 12;
    if (/\s脂身\s生$/.test(food.name)) score -= 420;
    if (food.name.includes("［副生物］")) score -= 180;
    return { food, presentation, score, matchKind: match.kind };
  }).filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name, "ja"))
    .slice(0, limit);
}

function getFoodCandidates(query) {
  const parsed = parseIngredientText(query);
  const catalog = searchCatalog(parsed.name);
  const usedIds = new Set(catalog.map((candidate) => String(candidate.food.id)));
  const official = rankOfficialFoodCandidates(parsed.name, 24)
    .filter((candidate) => !usedIds.has(String(candidate.food.id)))
    .map((candidate) => ({
      ...candidate.presentation,
      food: candidate.food,
      catalog: null,
      score: candidate.score,
      matchKind: candidate.matchKind,
      representative: false
    }));
  const combined = [
    ...catalog.map((candidate) => ({
      label: candidate.entry.label,
      detail: candidate.representative ? `${parsed.name}の代表候補` : "",
      food: candidate.food,
      catalog: candidate.entry,
      score: candidate.score,
      matchKind: candidate.matchKind,
      representative: candidate.representative
    })),
    ...official
  ];
  const seen = new Set();
  return combined.filter((candidate) => {
    const key = `${candidate.label}|${candidate.detail || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => b.score - a.score).slice(0, 8);
}

function getExactCatalogCandidate(query) {
  const normalized = normalizeFoodText(query);
  const exact = searchCatalog(query, commonFoodCatalog.length)
    .filter(({ entry }) => [entry.label, ...entry.aliases].some((term) => normalizeFoodText(term) === normalized));
  return exact[0] || null;
}

function getIngredientDisplayName(ingredient, officialFood = null) {
  const catalog = ingredient.foodId ? getCatalogCandidateByFoodId(ingredient.foodId) : getExactCatalogCandidate(ingredient.name)?.entry;
  return catalog?.label || ingredient.name || simplifyOfficialFoodName(officialFood);
}

function getIngredientProfile(name) {
  const normalized = normalizeFoodText(name);
  const exact = ingredientProfiles.find((profile) => profile.aliases.some((alias) => normalizeFoodText(alias) === normalized));
  if (exact) return { profile: exact, score: 1200, matchKind: "exact" };
  const ranked = ingredientProfiles.map((profile) => {
    const match = foodMatcher?.compare(name, profile.aliases) || { score: 0, kind: "none" };
    return { profile, score: match.score, matchKind: match.kind };
  }).sort((a, b) => b.score - a.score);
  return ranked[0]?.score >= 560 ? ranked[0] : null;
}

function resolveIngredient(ingredient) {
  const name = parseIngredientText(ingredient.name).name;
  if (!name) return null;
  if (ingredient.foodId && officialFoodById.has(String(ingredient.foodId))) {
    const food = officialFoodById.get(String(ingredient.foodId));
    return { food, profile: null, label: getIngredientDisplayName({ ...ingredient, name }, food), approximate: false, matchKind: "selected" };
  }
  const catalog = getExactCatalogCandidate(name);
  if (catalog?.food) {
    return {
      food: catalog.food,
      profile: null,
      label: catalog.entry.label,
      approximate: normalizeFoodText(catalog.entry.label) !== normalizeFoodText(name),
      matchKind: "alias"
    };
  }
  const normalized = normalizeFoodText(name);
  const exactOfficial = officialFoods.find((food) => {
    const presentation = getFoodPresentation(food);
    return normalizeFoodText(food.name) === normalized || normalizeFoodText(presentation.label) === normalized;
  });
  if (exactOfficial) {
    return { food: exactOfficial, profile: null, label: simplifyOfficialFoodName(exactOfficial), approximate: false, matchKind: "exact" };
  }
  const profileMatch = getIngredientProfile(name);
  if (profileMatch?.matchKind === "exact") {
    return {
      food: null,
      profile: profileMatch.profile,
      label: profileMatch.profile.label || profileMatch.profile.aliases[0],
      approximate: true,
      matchKind: "representative"
    };
  }
  const candidate = getFoodCandidates(name)[0];
  if (candidate?.score >= 520) {
    return {
      food: candidate.food,
      profile: null,
      label: candidate.label,
      approximate: true,
      matchKind: candidate.matchKind || "near"
    };
  }
  if (profileMatch) {
    return {
      food: null,
      profile: profileMatch.profile,
      label: profileMatch.profile.label || profileMatch.profile.aliases[0],
      approximate: true,
      matchKind: "near"
    };
  }
  return null;
}

function formatFoodMacros(food) {
  return `${formatNumber(food.kcal, 1)} kcal / P ${formatNumber(food.p)}g / F ${formatNumber(food.f)}g / C ${formatNumber(food.c)}g`;
}

function renderFoodDataSource() {
  const source = $("#foodDataSource");
  if (!source) return;
  source.textContent = officialFoods.length
    ? `${officialFoods.length.toLocaleString("ja-JP")}食品に対応。計算には${officialFoodData.source?.name || "食品成分表"}の100g当たりの値を使います。`
    : "食品データを読み込めませんでした。";
}

function renderIngredientSuggestions(row) {
  const input = row.querySelector(".ingredient-name");
  const list = row.querySelector(".ingredient-suggestions");
  if (!input || !list) return;
  const parsed = parseIngredientText(input.value);
  const candidates = getFoodCandidates(parsed.name);
  if (!candidates.length) {
    list.hidden = true;
    list.innerHTML = "";
    return;
  }
  list.hidden = false;
  list.innerHTML = candidates.map((candidate) => `
    <button type="button" data-food-choice="${escapeHtml(candidate.food.id)}" data-food-label="${escapeHtml(candidate.label)}">
      <strong>${escapeHtml(candidate.label)}</strong>
      <span>${candidate.detail ? `${escapeHtml(candidate.detail)} ・ ` : ""}${formatFoodMacros(candidate.food)} / 100g</span>
    </button>
  `).join("");
  Array.from(list.querySelectorAll("[data-food-choice]")).forEach((button) => {
    button.addEventListener("click", () => {
      const food = officialFoodById.get(button.dataset.foodChoice);
      if (!food) return;
      input.value = button.dataset.foodLabel || simplifyOfficialFoodName(food);
      input.dataset.foodId = food.id;
      const amountInput = row.querySelector(".ingredient-amount");
      const unitInput = row.querySelector(".ingredient-unit");
      if (parsed.amount && amountInput && !amountInput.value) amountInput.value = parsed.amount;
      if (parsed.unit && unitInput) unitInput.value = parsed.unit;
      list.hidden = true;
      list.innerHTML = "";
      updateIngredientEstimateNote({ autoApply: true });
    });
  });
}

function normalizeIngredientRow(row) {
  const input = row?.querySelector(".ingredient-name");
  if (!input) return;
  const parsed = parseIngredientText(input.value);
  if (parsed.name && parsed.name !== input.value.trim()) input.value = parsed.name;
  const amountInput = row.querySelector(".ingredient-amount");
  const unitInput = row.querySelector(".ingredient-unit");
  if (parsed.amount && amountInput && !amountInput.value) amountInput.value = parsed.amount;
  if (parsed.unit && unitInput) unitInput.value = parsed.unit;
  const resolution = resolveIngredient({ name: input.value, foodId: input.dataset.foodId || "" });
  if (resolution?.food) input.dataset.foodId = resolution.food.id;
}

function renderIngredientRows(ingredients = [{ name: "", amount: "", unit: "g" }]) {
  const container = $("#ingredientRows");
  if (!container) return;
  const rows = ingredients.length ? ingredients : [{ name: "", amount: "", unit: "g" }];
  container.innerHTML = rows.map((ingredient) => {
    const food = ingredient.foodId ? officialFoodById.get(String(ingredient.foodId)) : null;
    const visibleName = ingredient.foodId ? getIngredientDisplayName(ingredient, food) : ingredient.name || "";
    return `
    <div class="ingredient-row">
      <div class="ingredient-food-field">
        <label>食材
          <input class="ingredient-name" type="text" data-food-id="${escapeHtml(ingredient.foodId || "")}" value="${escapeHtml(visibleName)}" placeholder="例：豚こま切れ肉">
        </label>
        <div class="ingredient-suggestions" hidden></div>
      </div>
      <label>食べた量
        <input class="ingredient-amount" type="number" min="0" step="1" value="${escapeHtml(ingredient.amount ?? "")}" placeholder="100">
      </label>
      <label>単位
        <select class="ingredient-unit">
          ${["g", "本", "個", "枚", "パック", "杯"].map((unit) => `<option value="${unit}" ${ingredient.unit === unit ? "selected" : ""}>${unit}</option>`).join("")}
        </select>
      </label>
      <button class="ingredient-remove" type="button" aria-label="この食材を削除" title="この食材を削除">-</button>
    </div>
  `;
  }).join("");

  $$(".ingredient-remove").forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest(".ingredient-row");
      if (container.children.length === 1) {
        renderIngredientRows();
      } else {
        row?.remove();
        updateIngredientEstimateNote({ autoApply: true });
      }
    });
  });
  $$(".ingredient-row input, .ingredient-row select").forEach((input) => {
    input.addEventListener("input", () => {
      if (input.classList.contains("ingredient-name")) {
        input.dataset.foodId = "";
        renderIngredientSuggestions(input.closest(".ingredient-row"));
      }
      updateIngredientEstimateNote({ autoApply: true });
    });
    input.addEventListener("change", () => {
      normalizeIngredientRow(input.closest(".ingredient-row"));
      updateIngredientEstimateNote({ autoApply: true });
    });
  });
  $$(".ingredient-row").forEach(renderIngredientSuggestions);
  updateIngredientEstimateNote();
}

function renderCommonFoodChips() {
  const container = $("#commonFoodChips");
  if (!container) return;
  const labels = ["豚こま切れ肉", "豚バラ肉", "鶏むね肉", "長ねぎ", "青ねぎ", "炊いた白米", "卵", "木綿豆腐"];
  container.innerHTML = labels.map((label) => `<button type="button" data-common-food="${escapeHtml(label)}">${escapeHtml(label)}</button>`).join("");
  Array.from(container.querySelectorAll("[data-common-food]")).forEach((button) => {
    button.addEventListener("click", () => {
      const candidate = commonFoodCatalog.find((entry) => entry.label === button.dataset.commonFood);
      const food = getCatalogFood(candidate);
      const input = $(".ingredient-row .ingredient-name");
      if (!candidate || !food || !input) return;
      input.value = candidate.label;
      input.dataset.foodId = food.id;
      const suggestions = input.closest(".ingredient-row")?.querySelector(".ingredient-suggestions");
      if (suggestions) {
        suggestions.hidden = true;
        suggestions.innerHTML = "";
      }
      updateIngredientEstimateNote({ autoApply: true });
      input.focus();
    });
  });
}

function getIngredientRows() {
  return $$(".ingredient-row").map((row) => ({
    name: row.querySelector(".ingredient-name")?.value.trim() || "",
    foodId: row.querySelector(".ingredient-name")?.dataset.foodId || "",
    amount: Number(row.querySelector(".ingredient-amount")?.value || 0),
    unit: row.querySelector(".ingredient-unit")?.value || "g"
  })).filter((ingredient) => ingredient.name || ingredient.amount);
}

function estimateIngredientList(rows) {
  const result = {
    calories: 0,
    protein: 0,
    fat: 0,
    carb: 0,
    matched: [],
    approximations: [],
    unmatched: [],
    missingNames: [],
    missingAmounts: [],
    entered: rows.length
  };
  rows.forEach((ingredient) => {
    if (!ingredient.name) {
      result.missingNames.push("名称未入力の行");
      return;
    }
    if (!ingredient.amount) {
      result.missingAmounts.push(ingredient.name);
      return;
    }
    const resolution = resolveIngredient(ingredient);
    if (!resolution) {
      result.unmatched.push(ingredient.name);
      return;
    }
    const officialFood = resolution.food;
    const profile = resolution.profile || officialFood;
    const catalog = officialFood ? getCatalogCandidateByFoodId(officialFood.id) : getExactCatalogCandidate(ingredient.name)?.entry;
    const unitWeight = catalog?.unitWeights?.[ingredient.unit] || resolution.profile?.units?.[ingredient.unit];
    if (ingredient.unit !== "g" && !unitWeight) {
      result.unmatched.push(`${ingredient.name}（${ingredient.unit}では換算できません）`);
      return;
    }
    const grams = ingredient.unit === "g"
      ? ingredient.amount
      : ingredient.amount * unitWeight;
    const multiplier = grams / 100;
    const protein = officialFood ? officialFood.p : resolution.profile.protein;
    const fat = officialFood ? officialFood.f : resolution.profile.fat;
    const carb = officialFood ? officialFood.c : resolution.profile.carb;
    result.calories += profile.kcal * multiplier;
    result.protein += protein * multiplier;
    result.fat += fat * multiplier;
    result.carb += carb * multiplier;
    result.matched.push(`${resolution.label} ${formatNumber(grams, 1)}g`);
    if (resolution.approximate) result.approximations.push(`${ingredient.name} → ${resolution.label}`);
  });
  return {
    ...result,
    calories: Math.round(result.calories),
    protein: roundTo(result.protein),
    fat: roundTo(result.fat),
    carb: roundTo(result.carb)
  };
}

function estimateIngredients() {
  return estimateIngredientList(getIngredientRows());
}

function updateIngredientEstimateNote(options = {}) {
  const { autoApply = false } = options;
  const note = $("#ingredientEstimateNote");
  if (!note) return;
  const result = estimateIngredients();
  if (!result.entered) {
    note.textContent = "";
    return;
  }
  if (result.missingNames.length) {
    note.textContent = "食材名が空の行があります。";
    return;
  }
  if (result.missingAmounts.length) {
    note.textContent = `「${result.missingAmounts.join("・")}」の食べた量を入力してください。`;
    return;
  }
  if (result.unmatched.length) {
    note.textContent = `「${result.unmatched.join("・")}」に近い食品を特定できません。候補を選ぶか、gで入力してください。`;
    return;
  }
  const approximation = result.approximations.length ? ` 概算: ${result.approximations.join("、")}。` : "";
  note.textContent = `合計 ${formatNumber(result.calories, 0)} kcal / P ${formatNumber(result.protein)}g / F ${formatNumber(result.fat)}g / C ${formatNumber(result.carb)}g。${approximation}`;
  if (autoApply && result.matched.length) setNutritionFromIngredients(result, true);
}

function setNutritionFromIngredients(ingredients, silent = false) {
  $("#caloriesInput").value = formatNumber(ingredients.calories, 0);
  $("#proteinInput").value = formatNumber(ingredients.protein);
  $("#fatInput").value = formatNumber(ingredients.fat);
  $("#carbInput").value = formatNumber(ingredients.carb);
  $("#confidenceBadge").textContent = ingredients.approximations.length ? "食品成分表＋代表値" : "食品成分表から計算";
  $("#estimatePanel").classList.add("visible");
  nutritionEditedByUser = false;
  renderNutritionReview();
  if (!silent) showToast("材料から計算しました");
}

function applyIngredientEstimate() {
  const ingredients = estimateIngredients();
  if (!ingredients.entered) return showToast("食材を入力してください");
  if (ingredients.missingNames.length) return showToast("食材名が空の行があります");
  if (ingredients.missingAmounts.length) return showToast(`「${ingredients.missingAmounts[0]}」の量を入力してください`);
  if (ingredients.unmatched.length) return showToast(`「${ingredients.unmatched[0]}」を確認してください`);
  if (!ingredients.matched.length) return showToast("計算できる食材がありません");
  setNutritionFromIngredients(ingredients);
}

function renderAll() {
  $("#activeDate").value = state.activeDate;
  renderHome();
  renderMealList();
  renderCaptureState();
  renderAnalysis();
  renderProfile();
  renderInstallStatus();
}

function renderHome() {
  const day = calcDay(state.activeDate);
  const dateLabel = formatActiveDateLabel();
  const target = Number(state.profile.targetCalories || 0);
  const remaining = target ? target - day.calories : null;
  const progress = target ? Math.min(1.25, day.calories / target) : 0;
  const progressPercent = Math.round(progress * 100);
  const clampedProgress = Math.min(100, Math.round(progress * 100));
  const status = getCalorieStatus(progress);

  $("#remainingCalories").textContent = remaining === null ? "--" : formatKcal(Math.max(0, remaining));
  if (document.body.dataset.view === "home") $("#appTitle").textContent = `${dateLabel}の残り`;
  $("#mealLogTitle").textContent = `${dateLabel}の食事`;
  $("#heroLabel").textContent = progress > 1 ? `${dateLabel}の摂取量` : `${dateLabel}の残り`;
  $("#targetCaption").textContent = target
    ? status.caption
    : "1日の目安を設定すると、残りのカロリーが分かります。";
  $("#todayCalories").textContent = formatKcal(day.calories);
  $("#todayProtein").textContent = `${Math.round(day.protein)} g`;
  $("#todayCount").textContent = `${day.meals.length} 食`;
  $("#caloriePercent").textContent = target ? `${progressPercent}%` : "--";
  $("#calorieRing").style.setProperty("--progress", `${clampedProgress}%`);
  $("#calorieRing").style.setProperty("--ring-color", status.color);
  $("#calorieRing").dataset.status = status.level;

  const suggestion = $("#nextSuggestion");
  if (!day.meals.length) {
    suggestion.innerHTML = `
      <div class="suggestion-visual" aria-hidden="true">
        <span class="suggestion-object suggestion-bowl"><i></i></span><b></b>
        <span class="suggestion-object suggestion-egg"><i></i></span><b></b>
        <span class="suggestion-object suggestion-leaf"><i></i></span>
      </div>
      <p>まずは次の食事を1枚。写真、料理名、分かる食材のどれか一つから始められます。</p>
    `;
    return;
  }

  const proteinGoal = Math.round(Number(state.profile.weight || 60) * 1.2);
  const proteinGap = proteinGoal - day.protein;
  const calorieGap = target - day.calories;
  const items = [];

  if (proteinGap > 20) items.push("次は、卵・魚・鶏肉・豆腐などを足すと腹持ちを作りやすいです。");
  if (calorieGap < 250 && target) items.push("目安に近づいています。次は汁物や軽めのおかずにすると調整しやすいです。");
  if (calorieGap > 650 && target && day.meals.length >= 2) items.push("今日は少なめです。夜に崩れやすいので、小さめの主菜は入れておきたいところです。");
  if (!items.length) items.push("このペースなら大きく崩れていません。次も写真を入れて、今日の流れを残します。");

  suggestion.innerHTML = `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function getCalorieStatus(progress) {
  if (!Number.isFinite(progress) || progress <= 0) {
    return {
      level: "empty",
      color: "#9fd8bd",
      caption: "1日の目安を設定すると、残りのカロリーがここに出ます。"
    };
  }
  if (progress < 0.7) {
    return {
      level: "ok",
      color: "#9fd8bd",
      caption: "まだ余裕があります。次の食事は普通に入れて大丈夫です。"
    };
  }
  if (progress < 0.9) {
    return {
      level: "watch",
      color: "#dfa63b",
      caption: "目安の7割を超えています。ここからは主食と間食の量で差が出ます。"
    };
  }
  if (progress <= 1) {
    return {
      level: "near",
      color: "#e96845",
      caption: "目安に近づいています。次は軽めにすると調整しやすいです。"
    };
  }
  return {
    level: "over",
    color: "#d93d32",
    caption: "今日は目安を超えています。無理に帳尻を合わせず、次を軽くします。"
  };
}

function renderMealList() {
  const list = $("#mealList");
  const meals = mealsForDate(state.activeDate).sort(compareMealsByTime);

  if (!meals.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-plate" aria-hidden="true">
          <span class="empty-plate-main"></span>
          <span class="empty-plate-side"></span>
          <i></i>
        </div>
        <div><strong>${formatActiveDateLabel()}の食卓はまだ空です</strong><span>下の「記録」から、最初のひと皿を追加できます。</span></div>
      </div>
    `;
    return;
  }

  const slots = ["朝", "昼", "夜", "間食"];
  list.innerHTML = slots.map((slot) => {
    const slotMeals = meals.filter((meal) => (meal.slot || "朝") === slot);
    const total = slotMeals.reduce((sum, meal) => sum + Number(meal.calories || 0), 0);
    return `
      <section class="meal-slot-section">
        <div class="meal-slot-head">
          <strong>${slot}</strong>
          <span>${slotMeals.length ? `${slotMeals.length}件 ・ ${formatKcal(total)}` : "未入力"}</span>
        </div>
        <div class="meal-slot-list">
          ${slotMeals.length ? slotMeals.map((meal) => {
            const safeId = escapeHtml(meal.id);
            const safeName = escapeHtml(meal.name || meal.typeLabel || "食事");
            const safePhoto = normalizePhotoUrl(meal.photo);
            return `
            <article class="meal-card" data-id="${safeId}" role="button" tabindex="0" aria-label="${safeName}を編集">
                ${safePhoto ? `<img src="${safePhoto}" alt="${safeName}">` : '<div class="photo-thumb" aria-hidden="true">PHOTO</div>'}
                <div>
                  <h3>${safeName}</h3>
                <p class="meal-meta">${formatMealTime(meal)} ・ ${formatKcal(meal.calories)} ・ P ${meal.protein}g ・ F ${meal.fat}g ・ C ${meal.carb}g</p>
                <div class="meal-actions">
                  <span class="tag">${escapeHtml(meal.typeLabel)}</span>
                  ${meal.cooking && meal.cooking !== "plain" ? `<span class="tag muted-tag">${cookingFactors[meal.cooking]?.label || "調理あり"}</span>` : ""}
                  ${meal.eatenRatio && meal.eatenRatio !== "all" ? `<span class="tag muted-tag">${eatenRatios[meal.eatenRatio]?.label || "量調整"}</span>` : ""}
                  <button class="delete-button" type="button" data-delete="${safeId}">削除</button>
                </div>
              </div>
            </article>
          `;
          }).join("") : `<button class="quick-add" data-quick-slot="${slot}" type="button">${slot}を入れる</button>`}
        </div>
      </section>
    `;
  }).join("");

  $$("[data-delete]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!window.confirm("この食事記録を削除しますか？")) return;
      if ("indexedDB" in window) deleteMealPhoto(button.dataset.delete).catch(() => {});
      state.meals = state.meals.filter((meal) => meal.id !== button.dataset.delete);
      if (state.editingMealId === button.dataset.delete) clearCaptureForm();
      saveState();
      renderAll();
      showToast("削除しました");
    });
  });

  $$(".meal-card").forEach((card) => {
    const openEdit = () => startEditMeal(card.dataset.id);
    card.addEventListener("click", openEdit);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openEdit();
    });
  });

  $$("[data-quick-slot]").forEach((button) => {
    button.addEventListener("click", () => {
      clearCaptureForm({ resetSlot: false });
      state.selectedSlot = button.dataset.quickSlot;
      state.selectedMealTime = slotDefaultTimes[state.selectedSlot] || "08:00";
      saveState();
      renderCaptureState();
      setView("capture");
    });
  });
}

function compareMealsByTime(a, b) {
  const timeA = a.time || slotDefaultTimes[a.slot || "朝"] || "23:59";
  const timeB = b.time || slotDefaultTimes[b.slot || "朝"] || "23:59";
  if (timeA !== timeB) return timeA.localeCompare(timeB);
  return Number(a.createdAt || 0) - Number(b.createdAt || 0);
}

function formatMealTime(meal) {
  return meal.time || slotDefaultTimes[meal.slot || "朝"] || "--:--";
}

function renderCaptureState() {
  $$("#mealSlotGroup button").forEach((button) => {
    const active = button.dataset.slot === state.selectedSlot;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const timeInput = $("#mealTime");
  if (timeInput) timeInput.value = state.selectedMealTime || slotDefaultTimes[state.selectedSlot] || "";
  $$("#mealTypeGroup .chip").forEach((chip) => {
    const active = chip.dataset.type === state.selectedMealType;
    chip.classList.toggle("active", active);
    chip.setAttribute("aria-pressed", String(active));
  });
  $$("#cookingGroup button").forEach((button) => {
    const active = button.dataset.cooking === state.selectedCooking;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $$("#portionGroup button").forEach((button) => {
    const active = button.dataset.portion === state.selectedPortion;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $$("#eatenRatioGroup button").forEach((button) => {
    const active = button.dataset.eaten === state.selectedEatenRatio;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderPhotoState();
  renderVisionPanel();
  renderCaptureMode();
  renderNutritionReview();
}

function renderPhotoState() {
  const hasPhoto = Boolean(state.pendingPhoto);
  const preview = $("#photoPreview");
  const changeButton = $("#changePhoto");
  if (preview) {
    if (hasPhoto) {
      preview.src = state.pendingPhoto;
      if (!preview.alt) preview.alt = "選択した食事写真";
    } else {
      preview.removeAttribute("src");
      preview.alt = "";
    }
  }
  $(".photo-drop")?.classList.toggle("has-image", hasPhoto);
  $(".photo-drop")?.setAttribute("aria-busy", String(isPhotoAnalyzing));
  if (changeButton) changeButton.hidden = !hasPhoto;
}

function startEditMeal(mealId) {
  const meal = state.meals.find((item) => item.id === mealId);
  if (!meal) {
    showToast("この記録は見つかりませんでした");
    return;
  }

  state.editingMealId = meal.id;
  state.activeDate = meal.date || state.activeDate;
  state.selectedSlot = meal.slot || "朝";
  state.selectedMealType = meal.type === "fried" ? "setMeal" : (meal.type || "setMeal");
  state.selectedCooking = meal.cooking || (meal.type === "fried" ? "fried" : "plain");
  state.selectedPortion = meal.portion || "normal";
  state.selectedMealTime = meal.time || slotDefaultTimes[meal.slot || "朝"] || "08:00";
  state.selectedEatenRatio = meal.eatenRatio || "all";
  state.pendingPhoto = meal.photo || "";
  state.pendingVision = meal.vision || null;

  $("#activeDate").value = state.activeDate;
  $("#mealTime").value = state.selectedMealTime;
  $("#mealName").value = meal.name || "";
  $("#mealMemo").value = meal.memo || "";
  $("#caloriesInput").value = meal.calories ?? "";
  $("#proteinInput").value = meal.protein ?? "";
  $("#fatInput").value = meal.fat ?? "";
  $("#carbInput").value = meal.carb ?? "";

  $("#photoPreview").alt = meal.name || "編集中の食事写真";
  renderIngredientRows(meal.ingredients || []);

  $("#estimatePanel").classList.add("visible");
  renderCaptureState();
  saveState();
  setView("capture");
  showToast("記録を開きました");
}

function renderCaptureMode() {
  const meal = state.editingMealId ? state.meals.find((item) => item.id === state.editingMealId) : null;
  const editStatus = $("#editStatus");
  const cancelEdit = $("#cancelEdit");
  const saveMeal = $("#saveMeal");
  if (!editStatus || !cancelEdit || !saveMeal) return;

  if (meal) {
    editStatus.hidden = false;
    editStatus.querySelector("strong").textContent = "記録を編集中";
    editStatus.querySelector("span").textContent = `${meal.slot || "食事"} ・ ${meal.name || meal.typeLabel || "食事"}`;
    cancelEdit.hidden = false;
    saveMeal.textContent = "この内容で更新";
    saveMeal.classList.add("editing");
    return;
  }

  editStatus.hidden = true;
  cancelEdit.hidden = true;
  saveMeal.textContent = "記録に入れる";
  saveMeal.classList.remove("editing");
}

function renderAnalysis() {
  const isMonth = state.analysisRange === "month";
  const dates = getLastDays(isMonth ? 30 : 7);
  const target = Number(state.profile.targetCalories || 1800);
  const max = Math.max(target, ...dates.map((date) => calcDay(date).calories), 1);
  const chartDates = isMonth ? dates.filter((_, index) => index % 3 === 0 || index === dates.length - 1) : dates;

  $$(".analysis-switch button").forEach((button) => {
    const active = button.dataset.range === state.analysisRange;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  $("#analysisStats").innerHTML = buildAnalysisStats(dates, target, isMonth);
  $("#analysisTitle").textContent = isMonth ? "直近30日の傾向" : "直近7日の傾向";
  $("#analysisChart").innerHTML = chartDates.map((date) => {
    const day = calcDay(date);
    const width = Math.min(100, Math.round(day.calories / max * 100));
    const ratio = target ? day.calories / target : 0;
    const tone = day.calories === 0 ? "empty" : ratio >= 1 ? "over" : ratio >= 0.82 ? "near" : "ok";
    return `
      <div class="day-row">
        <span>${date.slice(5).replace("-", "/")}</span>
        <div class="bar-track"><div class="bar-fill ${tone}" style="width:${width}%"></div></div>
        <span>${Math.round(day.calories)} kcal</span>
      </div>
    `;
  }).join("");

  $("#analysisInsight").innerHTML = buildAnalysisInsight(dates, target, isMonth);
}

function buildAnalysisStats(dates, target, isMonth) {
  const days = dates.map((date) => ({ date, ...calcDay(date) }));
  const logged = days.filter((day) => day.meals.length);
  const comparableDays = logged.filter((day) => day.meals.length >= 2);
  const proteinGoal = Math.round(Number(state.profile.weight || 60) * 1.2);
  const slotAverages = ["朝", "昼", "夜", "間食"].map((slot) => {
    const meals = logged.flatMap((day) => day.meals.filter((meal) => (meal.slot || "朝") === slot));
    const calories = meals.reduce((sum, meal) => sum + Number(meal.calories || 0), 0);
    return { slot, count: meals.length, average: meals.length ? Math.round(calories / meals.length) : 0 };
  });
  const topSlot = slotAverages.sort((a, b) => b.average - a.average)[0];
  const avgCalories = logged.length
    ? Math.round(logged.reduce((sum, day) => sum + day.calories, 0) / logged.length)
    : 0;
  const avgProtein = comparableDays.length
    ? Math.round(comparableDays.reduce((sum, day) => sum + day.protein, 0) / comparableDays.length)
    : 0;
  const recordRate = Math.round(logged.length / dates.length * 100);
  const nearTargetDays = target
    ? comparableDays.filter((day) => day.calories >= target * 0.82 && day.calories <= target * 1.05).length
    : 0;

  const cards = [
    {
      label: "記録した日の平均",
      value: logged.length ? formatKcal(avgCalories) : "--",
      sub: `記録率 ${recordRate}%`
    },
    {
      label: "たんぱく質平均",
      value: comparableDays.length ? `${avgProtein} g` : "--",
      sub: `目安 ${proteinGoal} g/日`
    },
    {
      label: "目安内の日",
      value: target ? `${nearTargetDays}日` : "--",
      sub: "2食以上を記録した日で比較"
    },
    {
      label: "1食平均が高い時間帯",
      value: topSlot?.average ? topSlot.slot : "--",
      sub: topSlot?.average ? `${formatKcal(topSlot.average)} / ${topSlot.count}食` : "記録待ち"
    }
  ];

  return cards.map((card) => `
    <article>
      <span>${card.label}</span>
      <strong>${card.value}</strong>
      <small>${card.sub}</small>
    </article>
  `).join("");
}

function buildAnalysisInsight(dates, target, isMonth) {
  const days = dates.map((date) => ({ date, ...calcDay(date) }));
  const logged = days.filter((day) => day.meals.length);
  const comparableDays = logged.filter((day) => day.meals.length >= 2);
  const today = calcDay(state.activeDate);
  const selectedDateLabel = formatActiveDateLabel();
  const avgLogged = comparableDays.length
    ? Math.round(comparableDays.reduce((sum, day) => sum + day.calories, 0) / comparableDays.length)
    : 0;
  const todayRate = target ? Math.round(today.calories / target * 100) : 0;
  const rangeLabel = isMonth ? "30日" : "7日";
  const nextCount = isMonth ? "10日" : "3日";
  const proteinGoal = Math.round(Number(state.profile.weight || 60) * 1.2);
  const avgProtein = comparableDays.length
    ? Math.round(comparableDays.reduce((sum, day) => sum + day.protein, 0) / comparableDays.length)
    : 0;
  const slotAverages = ["朝", "昼", "夜", "間食"].map((slot) => {
    const meals = logged.flatMap((day) => day.meals.filter((meal) => (meal.slot || "朝") === slot));
    const calories = meals.reduce((sum, meal) => sum + Number(meal.calories || 0), 0);
    return { slot, count: meals.length, average: meals.length ? Math.round(calories / meals.length) : 0 };
  }).sort((a, b) => b.average - a.average);
  const topSlot = slotAverages[0];

  const recordBody = comparableDays.length
    ? `2食以上を記録した日の平均は${formatKcal(avgLogged)}です。記録が少ない日は平均に含めていません。`
    : logged.length
      ? "記録はありますが、1日の傾向を出すには食事数がまだ足りません。"
    : "まだ傾向を見る段階ではありません。まずは今日の食事を1枚残します。";

  let todayTitle = "未記録";
  let todayBody = `${selectedDateLabel}の食事を入れると、1日の目安との差がここに出ます。`;
  if (today.calories) {
    todayTitle = `${todayRate}%`;
    if (todayRate > 100) {
      todayBody = `${selectedDateLabel}は目安を超えています。間食、飲み物、揚げ物のどこで増えたか確認します。`;
    } else if (todayRate >= 82) {
      todayBody = `${selectedDateLabel}は目安に近いです。残りは軽めにすると調整しやすくなります。`;
    } else {
      todayBody = `${selectedDateLabel}はまだ余裕があります。食事を抜きすぎず、たんぱく質のあるものを選びます。`;
    }
  }

  let nextTitle = "記録を増やす";
  let nextBody = `${rangeLabel}のうち${logged.length}日分です。まずは${nextCount}分まで増えると、食べ方のクセが見えます。`;
  if (comparableDays.length >= dates.length * 0.35 && avgLogged > target * 1.1) {
    nextTitle = "増える場所を見る";
    nextBody = topSlot?.average
      ? `${topSlot.slot}で増えています。量を減らす前に、この時間帯の主食・油・間食を見ます。`
      : "平均が目安より高めです。量を減らす前に、増えている時間帯を見つけます。";
  } else if (comparableDays.length >= dates.length * 0.35 && avgLogged < target * 0.72) {
    nextTitle = "減らしすぎ注意";
    nextBody = "少なすぎる日が続くと反動が出やすいです。主菜は抜かない方が続きます。";
  } else if (logged.length >= dates.length * 0.75) {
    nextTitle = "入力内容を確認する";
    nextBody = "記録が続いています。次は、大きく外れた料理名や量だけ確認すれば十分です。";
  }

  let proteinTitle = "まだ判定できません";
  let proteinBody = "数日分たまると、腹持ちに関わるたんぱく質の不足が見えます。";
  if (comparableDays.length >= 3) {
    proteinTitle = `${avgProtein}/${proteinGoal} g`;
    proteinBody = avgProtein >= proteinGoal * 0.9
      ? "たんぱく質は大きく外れていません。次は脂質と主食量を見れば十分です。"
      : "たんぱく質が少なめです。食事量を減らすより、主菜を残す方が反動を抑えやすいです。";
  }

  let slotTitle = "偏りは未判定";
  let slotBody = "朝・昼・夜・間食の記録が増えると、1食平均が高い時間帯を確認できます。";
  if (logged.length >= 3 && topSlot?.average && topSlot.count >= 2) {
    slotTitle = `${topSlot.slot} 平均${formatKcal(topSlot.average)}`;
    if (topSlot.slot === "夜" || topSlot.slot === "間食") {
      slotBody = `${topSlot.slot}の1食平均が高めです。まずは主食、油、飲み物のどれが多かったか確認します。`;
    } else {
      slotBody = `${topSlot.slot}の1食平均が最も高くなっています。記録数も見ながら判断してください。`;
    }
  }

  const cards = [
    { label: "記録", title: `${logged.length}/${dates.length}日`, body: recordBody },
    { label: selectedDateLabel, title: todayTitle, body: todayBody },
    { label: "たんぱく質", title: proteinTitle, body: proteinBody },
    { label: "時間帯", title: slotTitle, body: slotBody },
    { label: "次の一歩", title: nextTitle, body: nextBody }
  ];

  return `
    <div class="insight-cards">
      ${cards.map((card) => `
        <article class="insight-card">
          <span>${card.label}</span>
          <strong>${card.title}</strong>
          <p>${card.body}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function renderProfile() {
  const splitActivity = inferSplitActivity(state.profile.activity);
  $("#sexInput").value = state.profile.sex;
  $("#ageInput").value = state.profile.age;
  $("#heightInput").value = state.profile.height;
  $("#weightInput").value = state.profile.weight;
  $("#targetWeightInput").value = state.profile.targetWeight;
  $("#workActivityInput").value = state.profile.workActivity ?? splitActivity.workActivity;
  $("#dailyActivityInput").value = state.profile.dailyActivity ?? splitActivity.dailyActivity;
  $("#paceInput").value = state.profile.pace;
  renderTargetPreview();
}

function renderTargetPreview() {
  const profile = getProfileFromForm();
  const targets = calcTargets(profile);
  const validation = validateProfile(profile);
  const warning = $("#profileWarning");
  const saveButton = $("#saveProfile");
  $("#targetWeightField").classList.toggle("is-invalid", validation.targetInvalid);
  warning.textContent = validation.messages[0] || "";
  warning.classList.toggle("visible", Boolean(validation.messages.length));
  if (saveButton) saveButton.disabled = !validation.valid;
  $("#targetPreview").classList.toggle("has-warning", !validation.valid);
  const proteinGoal = Math.round(Number(profile.weight || 0) * 1.2);
  $("#targetPreview").innerHTML = validation.valid
    ? `
      <strong>1日の目安 ${formatKcal(targets.targetCalories)}</strong>
      <span>維持の目安 ${formatKcal(targets.maintenanceCalories)}</span>
      <span>たんぱく質 ${proteinGoal}g/日を目安に記録</span>
    `
    : `
      <strong>入力を確認してください</strong><br>
      ${validation.messages[0]}
    `;
}

function getProfileFromForm() {
  const workActivity = Number($("#workActivityInput").value || 0);
  const dailyActivity = Number($("#dailyActivityInput").value || 0);
  const activity = Math.min(1.78, Math.max(1.2, 1.2 + workActivity + dailyActivity));
  return {
    sex: $("#sexInput").value,
    age: Number($("#ageInput").value || 0),
    height: Number($("#heightInput").value || 0),
    weight: Number($("#weightInput").value || 0),
    targetWeight: Number($("#targetWeightInput").value || 0),
    activity,
    workActivity,
    dailyActivity,
    pace: $("#paceInput").value
  };
}

function validateProfile(profile) {
  const messages = [];
  const targetInvalid = Boolean(
    profile.pace !== "maintain" &&
    profile.weight > 0 &&
    profile.targetWeight > 0 &&
    profile.targetWeight >= profile.weight
  );

  if (!profile.age || !profile.height || !profile.weight) {
    messages.push("年齢、身長、現在体重を入れると1日の目安を計算できます。");
  }

  if (targetInvalid) {
    messages.push("減量で使う場合、目標体重は現在体重より低くしてください。");
  }

  if (profile.height > 0 && profile.targetWeight > 0) {
    const heightM = profile.height / 100;
    const minWeight = Math.round(18.5 * heightM * heightM * 10) / 10;
    if (profile.targetWeight < minWeight) {
      messages.push(`目標体重が低すぎます。${profile.height}cmなら、まずは${minWeight}kg以上を目安にしてください。`);
    }
  }

  return {
    valid: messages.length === 0,
    targetInvalid: targetInvalid || messages.some((message) => message.includes("低すぎます")),
    messages
  };
}

function applyEstimateToInputs() {
  const estimate = estimateMeal();
  $("#caloriesInput").value = estimate.calories;
  $("#proteinInput").value = estimate.protein;
  $("#fatInput").value = estimate.fat;
  $("#carbInput").value = estimate.carb;
  $("#confidenceBadge").textContent = estimate.confidence;
  $("#estimatePanel").classList.add("visible");
  nutritionEditedByUser = false;
  renderNutritionReview();
  showToast("推定値を入力しました");
}

function refreshEstimateIfAuto() {
  if (!$("#estimatePanel").classList.contains("visible")) return;
  if (nutritionEditedByUser) {
    renderNutritionReview();
    return;
  }
  const estimate = estimateMeal();
  $("#caloriesInput").value = estimate.calories;
  $("#proteinInput").value = estimate.protein;
  $("#fatInput").value = estimate.fat;
  $("#carbInput").value = estimate.carb;
  $("#confidenceBadge").textContent = estimate.confidence;
  renderNutritionReview();
}

function renderNutritionReview() {
  const panel = $("#nutritionReview");
  if (!panel) return;
  const values = getNutritionInputValues();
  if (!values.calories && !values.protein && !values.fat && !values.carb) {
    panel.innerHTML = "";
    return;
  }

  const target = Number(state.profile.targetCalories || 0);
  const proteinGoal = Math.round(Number(state.profile.weight || 60) * 1.2);
  const dayWithoutCurrent = getDayTotalsWithoutEditingMeal();
  const projectedCalories = dayWithoutCurrent.calories + values.calories;
  const remainingAfter = target ? target - projectedCalories : null;
  const macroKcal = (values.protein * 4) + (values.fat * 9) + (values.carb * 4);
  const proteinPct = macroKcal ? Math.round(values.protein * 4 / macroKcal * 100) : 0;
  const fatPct = macroKcal ? Math.round(values.fat * 9 / macroKcal * 100) : 0;
  const carbPct = macroKcal ? Math.round(values.carb * 4 / macroKcal * 100) : 0;
  const notes = [];

  if (values.calories >= 750) notes.push("重めの一食");
  else if (values.calories <= 320) notes.push("軽めの一食");
  else notes.push("標準的な一食");

  if (values.protein < 15 && values.calories > 350) notes.push("P少なめ");
  else if (values.protein >= 25) notes.push("Pしっかり");

  if (fatPct >= 42) notes.push("脂質寄り");
  if (carbPct >= 62) notes.push("主食寄り");
  if (state.selectedEatenRatio !== "all") notes.push(eatenRatios[state.selectedEatenRatio]?.label || "量調整");
  if (remainingAfter !== null && remainingAfter < 0) notes.push("今日は目安超え");

  panel.innerHTML = `
    <div class="review-head">
      <span>${notes.map(escapeHtml).join(" / ")}</span>
      <strong>${target ? `保存後 ${Math.round(projectedCalories / target * 100)}%` : "保存前チェック"}</strong>
    </div>
    <div class="macro-balance" aria-label="PFCバランス">
      <i style="width:${proteinPct}%"></i>
      <i style="width:${fatPct}%"></i>
      <i style="width:${carbPct}%"></i>
    </div>
    <div class="review-grid">
      <span>P ${proteinPct}%</span>
      <span>F ${fatPct}%</span>
      <span>C ${carbPct}%</span>
      <span>${remainingAfter === null ? `P目安 ${proteinGoal}g/日` : `残り ${formatKcal(Math.max(0, remainingAfter))}`}</span>
    </div>
  `;
}

function getNutritionInputValues() {
  return {
    calories: Number($("#caloriesInput")?.value || 0),
    protein: Number($("#proteinInput")?.value || 0),
    fat: Number($("#fatInput")?.value || 0),
    carb: Number($("#carbInput")?.value || 0)
  };
}

function getDayTotalsWithoutEditingMeal() {
  const editingId = state.editingMealId;
  return mealsForDate(state.activeDate)
    .filter((meal) => meal.id !== editingId)
    .reduce((sum, meal) => ({
      calories: sum.calories + Number(meal.calories || 0),
      protein: sum.protein + Number(meal.protein || 0),
      fat: sum.fat + Number(meal.fat || 0),
      carb: sum.carb + Number(meal.carb || 0)
    }), { calories: 0, protein: 0, fat: 0, carb: 0 });
}

function renderVisionPanel() {
  const summary = $("#visionSummary");
  const chips = $("#visionChips");
  const breakdown = $("#visionBreakdown");
  const ingredientChoices = $("#visionIngredientChoices");
  if (!summary || !chips) return;

  if (!state.pendingVision) {
    summary.textContent = "初回は写真解析の準備に時間がかかります。写真自体は外部へ送信しません。";
    chips.innerHTML = "";
    if (ingredientChoices) {
      ingredientChoices.hidden = true;
      ingredientChoices.innerHTML = "";
    }
    if (breakdown) {
      breakdown.hidden = true;
      breakdown.innerHTML = "";
    }
    return;
  }

  const vision = state.pendingVision;
  summary.textContent = vision.summary;
  chips.innerHTML = (Array.isArray(vision.signals) ? vision.signals : []).map((signal) => `<span>${escapeHtml(signal)}</span>`).join("");
  if (ingredientChoices) {
    const ingredients = Array.isArray(vision.ingredients) ? vision.ingredients.filter((item) => item?.name) : [];
    ingredientChoices.hidden = !ingredients.length;
    ingredientChoices.innerHTML = ingredients.length ? `
      <p>写っている食材を選んでください。選んだ食材は下の入力欄に追加されます。</p>
      <div>${ingredients.map((item) => `<button type="button" data-vision-ingredient="${escapeHtml(item.name)}">${escapeHtml(item.name)}${item.certainty === "low" ? "（不確か）" : ""}</button>`).join("")}</div>
    ` : "";
    Array.from(ingredientChoices.querySelectorAll("[data-vision-ingredient]")).forEach((button) => {
      button.addEventListener("click", () => {
        const name = button.dataset.visionIngredient || "";
        const catalog = getExactCatalogCandidate(name);
        const nextIngredient = catalog?.food
          ? { name: catalog.entry.label, foodId: catalog.food.id, amount: "", unit: "g" }
          : { name, amount: "", unit: "g" };
        const rows = getIngredientRows();
        const exists = rows.some((ingredient) => normalizeFoodText(ingredient.name) === normalizeFoodText(nextIngredient.name));
        renderIngredientRows(exists ? rows : [...rows, nextIngredient]);
        showToast(exists ? "材料欄にあります" : "材料欄に追加しました");
      });
    });
  }
  renderVisionBreakdown(vision);
}

function renderVisionBreakdown(vision) {
  const breakdown = $("#visionBreakdown");
  if (!breakdown) return;
  if (vision.needsManual || !vision.componentScores) {
    breakdown.hidden = true;
    breakdown.innerHTML = "";
    return;
  }
  const rows = [
    ["主食", vision.componentScores.staple],
    ["主菜", vision.componentScores.proteinLike],
    ["野菜", vision.componentScores.veg],
    ["油の多さ", vision.componentScores.oil]
  ];
  breakdown.hidden = false;
  breakdown.innerHTML = rows.map(([label, value]) => {
    const width = Math.round(clamp(value) * 100);
    return `
      <div class="vision-meter">
        <span>${label}</span>
        <i><b style="width:${width}%"></b></i>
      </div>
    `;
  }).join("");
}

function clearCaptureForm(options = {}) {
  const { resetSlot = true } = options;
  photoAnalysisToken += 1;
  isPhotoAnalyzing = false;
  ["libraryPhoto", "cameraPhoto"].forEach((id) => {
    const input = $(`#${id}`);
    if (input) input.value = "";
  });
  $("#photoPreview").removeAttribute("src");
  $("#photoPreview").alt = "";
  $("#saveMeal").disabled = false;
  $(".photo-drop").classList.remove("has-image", "is-analyzing");
  $(".photo-drop").setAttribute("aria-busy", "false");
  $("#changePhoto").hidden = true;
  $("#mealName").value = "";
  $("#mealMemo").value = "";
  ["riceBoost", "oilBoost", "proteinBoost", "sauceBoost"].forEach((id) => {
    const input = $(`#${id}`);
    if (input) input.checked = false;
  });
  $("#caloriesInput").value = "";
  $("#proteinInput").value = "";
  $("#fatInput").value = "";
  $("#carbInput").value = "";
  nutritionEditedByUser = false;
  renderNutritionReview();
  $("#estimatePanel").classList.remove("visible");
  state.pendingPhoto = "";
  state.pendingVision = null;
  state.editingMealId = "";
  state.selectedMealType = "setMeal";
  state.selectedCooking = "plain";
  state.selectedPortion = "normal";
  state.selectedEatenRatio = "all";
  if (resetSlot) state.selectedSlot = "朝";
  state.selectedMealTime = slotDefaultTimes[state.selectedSlot] || "08:00";
  renderIngredientRows();
  saveState();
  renderCaptureState();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setupEvents() {
  const feedbackSelector = [
    "button",
    ".real-file-action",
    ".refine-grid label",
    ".secondary-action"
  ].join(",");

  document.addEventListener("pointerdown", (event) => {
    const target = event.target.closest(feedbackSelector);
    if (!target) return;
    target.classList.remove("tap-feedback");
    void target.offsetWidth;
    target.classList.add("tap-feedback");
  });

  $$(".bottom-nav button").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  $("#goCaptureHero").addEventListener("click", () => setView("capture"));

  $("#activeDate").addEventListener("change", (event) => {
    state.activeDate = event.target.value || todayIso();
    saveState();
    renderAll();
  });

  const handlePhoto = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const analysisToken = ++photoAnalysisToken;
    event.target.value = "";
    const reader = new FileReader();
    reader.addEventListener("load", async () => {
      const rawPhoto = reader.result;
      let analysisPhoto = rawPhoto;
      try {
        analysisPhoto = await withTimeout(compressPhoto(rawPhoto), 5000);
      } catch {
        if (String(rawPhoto).length > 900000) {
          if (analysisToken !== photoAnalysisToken) return;
          isPhotoAnalyzing = false;
          $(".photo-drop").classList.remove("is-analyzing");
          $(".photo-drop").setAttribute("aria-busy", "false");
          showToast("写真を小さくできませんでした。別の写真を選んでください");
          return;
        }
      }
      if (analysisToken !== photoAnalysisToken) return;
      state.pendingPhoto = analysisPhoto;
      state.pendingVision = null;
      $("#photoPreview").src = analysisPhoto;
      $("#photoPreview").alt = "選択した食事写真";
      renderPhotoState();
      isPhotoAnalyzing = true;
      $(".photo-drop").classList.add("is-analyzing");
      $(".photo-drop").setAttribute("aria-busy", "true");
      $("#visionSummary").textContent = "写真から食材候補を確認しています。";
      $("#visionChips").innerHTML = '<span>解析中</span>';
      try {
        const vision = await withTimeout(analyzeFoodPhoto(analysisPhoto, analysisToken), 300000);
        if (analysisToken !== photoAnalysisToken) return;
        state.pendingVision = vision;
      } catch {
        if (analysisToken !== photoAnalysisToken) return;
        state.pendingVision = getFallbackVision();
      }
      isPhotoAnalyzing = false;
      $(".photo-drop").classList.remove("is-analyzing");
      $(".photo-drop").setAttribute("aria-busy", "false");
      applyVisionHints(state.pendingVision);
      saveState();
      renderCaptureState();
      if (state.pendingVision.needsManual) {
        $("#estimatePanel").classList.remove("visible");
        showToast(state.pendingVision.semantic ? "食材候補を確認して量を入力してください" : "食材候補を確認して材料を入力してください");
        return;
      }
      applyEstimateToInputs();
      showToast(state.pendingVision.fallback ? "写真を入れました" : "写真から候補を入れました");
    });
    reader.addEventListener("error", () => {
      if (analysisToken !== photoAnalysisToken) return;
      isPhotoAnalyzing = false;
      $(".photo-drop").classList.remove("is-analyzing");
      $(".photo-drop").setAttribute("aria-busy", "false");
      state.pendingVision = getFallbackVision();
      renderCaptureState();
      showToast("この写真は読み込めませんでした");
    });
    reader.readAsDataURL(file);
  };

  ["libraryPhoto", "cameraPhoto"].forEach((id) => {
    const input = $(`#${id}`);
    if (input) input.addEventListener("change", handlePhoto);
  });

  $("#changePhoto").addEventListener("click", () => {
    const input = $("#libraryPhoto");
    input.value = "";
    input.click();
  });

  $$("#mealSlotGroup button").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedSlot = button.dataset.slot;
      state.selectedMealTime = slotDefaultTimes[state.selectedSlot] || state.selectedMealTime || "08:00";
      saveState();
      renderCaptureState();
    });
  });

  $("#mealTime").addEventListener("input", (event) => {
    state.selectedMealTime = event.target.value || slotDefaultTimes[state.selectedSlot] || "08:00";
    saveState();
  });

  $$("#mealTypeGroup .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.selectedMealType = chip.dataset.type;
      saveState();
      renderCaptureState();
      refreshEstimateIfAuto();
    });
  });

  $$("#cookingGroup button").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCooking = button.dataset.cooking;
      saveState();
      renderCaptureState();
      refreshEstimateIfAuto();
    });
  });

  $$("#portionGroup button").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedPortion = button.dataset.portion;
      saveState();
      renderCaptureState();
      refreshEstimateIfAuto();
    });
  });

  $$("#eatenRatioGroup button").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedEatenRatio = button.dataset.eaten;
      saveState();
      renderCaptureState();
      refreshEstimateIfAuto();
    });
  });

  $("#addIngredient").addEventListener("click", () => {
    renderIngredientRows([...getIngredientRows(), { name: "", amount: "", unit: "g" }]);
  });

  $("#estimateIngredients").addEventListener("click", applyIngredientEstimate);

  ["riceBoost", "oilBoost", "proteinBoost", "sauceBoost"].forEach((id) => {
    $(`#${id}`).addEventListener("change", refreshEstimateIfAuto);
  });

  ["caloriesInput", "proteinInput", "fatInput", "carbInput"].forEach((id) => {
    $(`#${id}`).addEventListener("input", () => {
      nutritionEditedByUser = true;
      renderNutritionReview();
    });
  });

  $("#estimateMeal").addEventListener("click", applyEstimateToInputs);

  $("#cancelEdit").addEventListener("click", () => {
    clearCaptureForm();
    showToast("新規記録に戻しました");
  });

  $$(".analysis-switch button").forEach((button) => {
    button.addEventListener("click", () => {
      state.analysisRange = button.dataset.range;
      saveState();
      renderAnalysis();
    });
  });

  $("#saveMeal").addEventListener("click", () => {
    $$(".ingredient-row").forEach(normalizeIngredientRow);
    const ingredientEstimate = estimateIngredients();
    const hasIngredients = ingredientEstimate.entered > 0;
    if (hasIngredients) {
      if (ingredientEstimate.missingNames.length) return showToast("食材名が空の行があります");
      if (ingredientEstimate.missingAmounts.length) return showToast(`「${ingredientEstimate.missingAmounts[0]}」の量を入力してください`);
      if (ingredientEstimate.unmatched.length) return showToast(`「${ingredientEstimate.unmatched[0]}」を確認してください`);
      if (!ingredientEstimate.matched.length) return showToast("計算できる食材がありません");
      setNutritionFromIngredients(ingredientEstimate, true);
    }
    const enteredName = $("#mealName").value.trim();
    if (!state.pendingPhoto && !enteredName && !hasIngredients) {
      showToast("写真、料理名、食材のどれかを入力してください");
      return;
    }
    if (isPhotoAnalyzing && !hasIngredients && !$("#caloriesInput").value) {
      showToast("写真を解析中です。待つか、材料を入力すると先に保存できます");
      return;
    }
    if (!hasIngredients && !$("#caloriesInput").value) applyEstimateToInputs();
    const estimate = estimateMeal();
    const editingMeal = state.editingMealId ? state.meals.find((meal) => meal.id === state.editingMealId) : null;
    const meal = {
      id: editingMeal?.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: state.activeDate,
      createdAt: editingMeal?.createdAt || Date.now(),
      updatedAt: editingMeal ? Date.now() : undefined,
      slot: state.selectedSlot,
      time: $("#mealTime").value || state.selectedMealTime || slotDefaultTimes[state.selectedSlot] || "",
      name: enteredName || (hasIngredients ? ingredientEstimate.matched.slice(0, 2).map((item) => item.replace(/\s+[\d.]+g$/, "")).join("と") : estimate.typeLabel),
      type: state.selectedMealType,
      typeLabel: hasIngredients ? "材料から計算" : estimate.typeLabel,
      cooking: state.selectedCooking,
      portion: state.selectedPortion,
      eatenRatio: state.selectedEatenRatio,
      ingredients: getIngredientRows(),
      photo: state.pendingPhoto,
      vision: state.pendingVision,
      calories: Number($("#caloriesInput").value || estimate.calories),
      protein: Number($("#proteinInput").value || estimate.protein),
      fat: Number($("#fatInput").value || estimate.fat),
      carb: Number($("#carbInput").value || estimate.carb),
      memo: $("#mealMemo").value.trim()
    };
    if (editingMeal) {
      state.meals = state.meals.map((item) => (item.id === meal.id ? meal : item));
    } else {
      state.meals.push(meal);
    }
    saveState();
    $("#saveMeal").classList.add("saved");
    setTimeout(() => $("#saveMeal").classList.remove("saved"), 450);
    clearCaptureForm();
    renderAll();
    showToast(editingMeal ? "記録を更新しました" : `${formatActiveDateLabel()}の記録に追加しました`);
    setView("home");
  });

  ["sexInput", "ageInput", "heightInput", "weightInput", "targetWeightInput", "workActivityInput", "dailyActivityInput", "paceInput"].forEach((id) => {
    $(`#${id}`).addEventListener("input", renderTargetPreview);
    $(`#${id}`).addEventListener("change", renderTargetPreview);
  });

  $("#profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const profile = getProfileFromForm();
    const validation = validateProfile(profile);
    if (!validation.valid) {
      renderTargetPreview();
      showToast(validation.messages[0] || "入力内容を確認してください");
      return;
    }
    const targets = calcTargets(profile);
    state.profile = { ...profile, ...targets };
    saveState();
    renderAll();
    showToast("1日の目安を保存しました");
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    renderInstallStatus();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    renderInstallStatus();
    showToast("アプリとして追加しました");
  });

  $("#installApp").addEventListener("click", async () => {
    if (isStandaloneApp()) {
      showToast("すでにアプリ表示です");
      return;
    }
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice.catch(() => null);
      deferredInstallPrompt = null;
      renderInstallStatus();
      return;
    }
    renderInstallStatus(true);
    showToast("追加方法を表示しました");
  });

  $("#exportData").addEventListener("click", () => {
    const json = JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), data: state }, null, 2);
    $("#dataOutput").value = `${state.meals.length}件の食事記録をバックアップしました。`;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `meallens-backup-${todayIso()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("バックアップファイルを書き出しました");
  });

  $("#importData").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      event.target.value = "";
      showToast("バックアップファイルが大きすぎます");
      return;
    }
    try {
      const imported = JSON.parse(await file.text());
      const data = imported?.schemaVersion === 1 ? imported.data : imported;
      if (!data || !Array.isArray(data.meals) || typeof data.profile !== "object") throw new Error("invalid backup");
      state = normalizeStateData(data);
      saveState();
      renderAll();
      event.target.value = "";
      showToast("バックアップを読み込みました");
    } catch {
      event.target.value = "";
      showToast("MealLensのバックアップファイルではありません");
    }
  });
}

function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function renderInstallStatus(showGuide = false) {
  const status = $("#installStatus");
  const button = $("#installApp");
  if (!status || !button) return;

  if (isStandaloneApp()) {
    status.textContent = "アプリとして起動中です。次からはホーム画面のアイコンから開けます。";
    button.hidden = true;
    return;
  }

  button.hidden = false;
  const ua = navigator.userAgent || "";
  const isIos = /iPhone|iPad|iPod/.test(ua);

  if (deferredInstallPrompt) {
    status.textContent = "この端末ではアプリとして追加できます。追加すると、ホーム画面から直接開けます。";
    button.textContent = "アプリとして追加";
    return;
  }

  if (isIos) {
    status.textContent = showGuide
      ? "iPhoneでは、Safariの共有ボタンから「ホーム画面に追加」を選んでください。"
      : "iPhoneでは、共有ボタンからホーム画面に追加できます。";
    button.textContent = "iPhoneでの追加方法";
    return;
  }

  status.textContent = showGuide
    ? "ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選んでください。"
    : "ホーム画面に追加すると、ブラウザを探さずに開けます。";
  button.textContent = "追加方法を見る";
}

async function analyzeFoodPhoto(dataUrl, analysisToken) {
  try {
    const semanticVision = await requestPhotoIngredientAnalysis(dataUrl, analysisToken);
    if (semanticVision) return semanticVision;
  } catch {
    // A model load failure must not turn color heuristics into ingredient claims.
  }
  return getFallbackVision("写真は保存しました。通信状態などにより端末内AIを使えませんでした。材料名を入力してください。");
}

async function requestPhotoIngredientAnalysis(dataUrl, analysisToken) {
  const { analyzeMealPhoto } = await import("./browser-vision.js?v=20260711-2");
  const result = await analyzeMealPhoto(dataUrl, ({ message }) => {
    if (analysisToken !== photoAnalysisToken) return;
    const summary = $("#visionSummary");
    if (summary && message) summary.textContent = message;
  });
  if (!result || !Array.isArray(result.ingredients)) throw new Error("vision response is invalid");
  const ingredients = result.ingredients
    .filter((item) => typeof item?.name === "string" && item.name.trim())
    .slice(0, 8)
    .map((item) => ({
      name: item.name.trim(),
      certainty: ["high", "medium", "low"].includes(item.certainty) ? item.certainty : "medium"
    }));
  const dishes = Array.isArray(result.dishes) ? result.dishes.filter((item) => typeof item?.name === "string").slice(0, 3) : [];
  if (!ingredients.length) return getFallbackVision(result.summary);
  return {
    foodRatio: 0,
    greenRatio: 0,
    whiteRatio: 0,
    warmRatio: 0,
    brownRatio: 0,
    darkRatio: 0,
    calorieDelta: 0,
    proteinDelta: 0,
    fatDelta: 0,
    carbDelta: 0,
    confidence: 0,
    ingredients,
    dishes,
    signals: [
      `食材候補 ${ingredients.length}件`,
      ...dishes.map((dish) => `料理候補: ${dish.name}`)
    ],
    summary: result.summary || "端末内AIが食材候補を出しました。候補を確認して、食べた量を入力してください。",
    label: "端末内AIの食材候補",
    semantic: true,
    needsManual: true
  };
}

async function analyzePhotoAppearance(dataUrl) {
  const image = await loadImage(dataUrl);
  const size = 96;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  canvas.width = size;
  canvas.height = size;
  const scale = Math.max(size / image.width, size / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, (size - drawWidth) / 2, (size - drawHeight) / 2, drawWidth, drawHeight);
  const { data } = ctx.getImageData(0, 0, size, size);

  let foodPixels = 0;
  let greenPixels = 0;
  let whitePixels = 0;
  let warmPixels = 0;
  let brownPixels = 0;
  let darkPixels = 0;
  let redPixels = 0;
  let palePixels = 0;
  let saturationSum = 0;
  let brightnessSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const { h, s, v } = rgbToHsv(r, g, b);
    saturationSum += s;
    brightnessSum += v;

    const likelyBackground = v > 0.9 && s < 0.13;
    const likelyShadow = v < 0.08;
    if (likelyBackground || likelyShadow) continue;

    foodPixels += 1;
    if (h >= 70 && h <= 165 && s > 0.22) greenPixels += 1;
    if (v > 0.72 && s < 0.22) whitePixels += 1;
    if (v > 0.58 && s < 0.16) palePixels += 1;
    if (h >= 18 && h <= 60 && s > 0.25 && v > 0.35) warmPixels += 1;
    if (h >= 15 && h <= 45 && s > 0.28 && v <= 0.62) brownPixels += 1;
    if ((h <= 12 || h >= 345) && s > 0.3 && v > 0.22) redPixels += 1;
    if (v < 0.23) darkPixels += 1;
  }

  const totalPixels = size * size;
  const foodRatio = foodPixels / totalPixels;
  const greenRatio = foodPixels ? greenPixels / foodPixels : 0;
  const whiteRatio = foodPixels ? whitePixels / foodPixels : 0;
  const warmRatio = foodPixels ? warmPixels / foodPixels : 0;
  const brownRatio = foodPixels ? brownPixels / foodPixels : 0;
  const darkRatio = foodPixels ? darkPixels / foodPixels : 0;
  const redRatio = foodPixels ? redPixels / foodPixels : 0;
  const paleRatio = foodPixels ? palePixels / foodPixels : 0;
  const avgSaturation = saturationSum / totalPixels;
  const avgBrightness = brightnessSum / totalPixels;

  if (foodRatio < 0.04) {
    return getUnclearVision("料理がはっきり写っていません。別の写真にするか、近い料理を選んでください。");
  }

  const componentScores = scoreFoodComponents({
    foodRatio,
    greenRatio,
    whiteRatio,
    warmRatio,
    brownRatio,
    darkRatio,
    redRatio,
    paleRatio,
    avgSaturation,
    avgBrightness
  });

  let calorieDelta = Math.round(componentScores.energy * 10) * 10;
  let proteinDelta = Math.round(componentScores.protein * 10) / 10;
  let fatDelta = Math.round(componentScores.fat * 10) / 10;
  let carbDelta = Math.round(componentScores.carb * 10) / 10;
  const signals = [];

  if (foodRatio > 0.58) {
    signals.push("量の見え方: 多め");
    state.selectedPortion = "large";
  } else if (foodRatio < 0.24) {
    signals.push("量の見え方: 軽め");
    state.selectedPortion = "light";
  } else {
    signals.push("量の見え方: ふつう");
    state.selectedPortion = "normal";
  }

  if (componentScores.staple > 0.55) {
    signals.push("主食が目立つ");
  }

  if (componentScores.oil > 0.56) {
    signals.push("焼き色や油が見える");
  }

  if (componentScores.veg > 0.36) {
    signals.push("野菜が見える");
  }

  if (componentScores.proteinLike > 0.5) {
    signals.push("肉・魚・卵の料理かも");
  }

  if (darkRatio > 0.18 && warmRatio < 0.2 && componentScores.oil > 0.34) {
    signals.push("濃い味つけかも");
  }

  if (avgBrightness > 0.74 && avgSaturation < 0.16 && foodRatio < 0.36) {
    signals.push("料理が小さめ");
  }

  const photoNotes = [];
  if (componentScores.veg > 0.68) photoNotes.push("野菜がしっかり写っています");
  if (componentScores.staple > 0.55) photoNotes.push("ご飯か麺が目立ちます");
  if (componentScores.oil > 0.56) photoNotes.push("焼き色・揚げ色が見えます");
  if (componentScores.proteinLike > 0.5) photoNotes.push("肉・魚・卵を使った料理に見えます");
  if (!photoNotes.length) photoNotes.push(foodRatio < 0.24 ? "料理が小さく写っています" : "写真全体から量を推定しています");
  const summary = `${photoNotes.join("。")}。料理名や正確な量は、写真だけでは決めません。`;

  return {
    foodRatio,
    greenRatio,
    whiteRatio,
    warmRatio,
    brownRatio,
    darkRatio,
    redRatio,
    paleRatio,
    avgSaturation,
    avgBrightness,
    componentScores,
    calorieDelta,
    proteinDelta,
    fatDelta,
    carbDelta,
    signals,
    summary,
    label: "写真の見え方を反映"
  };
}

function scoreFoodComponents(vision) {
  const density = clamp((vision.foodRatio - 0.18) / 0.5);
  const staple = clamp((vision.whiteRatio + vision.paleRatio * 0.45 - vision.greenRatio * 0.22 - 0.18) / 0.42);
  const veg = clamp((vision.greenRatio - 0.08) / 0.34);
  const oil = clamp((vision.brownRatio * 1.15 + vision.warmRatio * 0.58 + vision.darkRatio * 0.16 - vision.greenRatio * 0.2) / 0.52);
  const proteinLike = clamp((vision.brownRatio * 0.95 + vision.warmRatio * 0.32 + vision.redRatio * 0.35 - vision.whiteRatio * 0.18) / 0.36);
  const sauce = clamp((vision.darkRatio + vision.redRatio * 0.55 - vision.greenRatio * 0.14) / 0.3);

  return {
    density,
    staple,
    veg,
    oil,
    proteinLike,
    sauce,
    energy: (density * 110) + (staple * 150) + (oil * 170) + (proteinLike * 90) - (veg * 80) + (sauce * 45),
    protein: (proteinLike * 18) + (density * 5) + (veg * 3),
    fat: (oil * 18) + (proteinLike * 5) + (sauce * 2) - (veg * 4),
    carb: (staple * 40) + (density * 10) + (sauce * 8) - (veg * 8)
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.decoding = "async";
    image.src = src;
  });
}

async function compressPhoto(dataUrl) {
  const image = await loadImage(dataUrl);
  const maxSide = 640;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.68);
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), ms);
    })
  ]);
}

function getFallbackVision(summary = "写真を保存しました。食材や量は判定できなかったため、分かる範囲で入力してください。") {
  return {
    foodRatio: 0,
    greenRatio: 0,
    whiteRatio: 0,
    warmRatio: 0,
    brownRatio: 0,
    darkRatio: 0,
    avgSaturation: 0,
    avgBrightness: 0,
    calorieDelta: 0,
    proteinDelta: 0,
    fatDelta: 0,
    carbDelta: 0,
    confidence: 35,
    signals: ["写真は入っています", "食材の確認が必要"],
    summary,
    label: "食材を入力して計算",
    fallback: true,
    needsManual: true
  };
}

function getUnclearVision(summary) {
  const type = mealTypes[state.selectedMealType] || mealTypes.setMeal;
  return {
    foodRatio: 0,
    greenRatio: 0,
    whiteRatio: 0,
    warmRatio: 0,
    brownRatio: 0,
    darkRatio: 0,
    avgSaturation: 0,
    avgBrightness: 0,
    calorieDelta: 0,
    proteinDelta: 0,
    fatDelta: 0,
    carbDelta: 0,
    confidence: 20,
    signals: ["食事が見えにくい", "確認が必要"],
    summary,
    label: "写真からの概算",
    needsManual: true
  };
}

function rgbToHsv(r, g, b) {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === nr) h = 60 * (((ng - nb) / delta) % 6);
    else if (max === ng) h = 60 * ((nb - nr) / delta + 2);
    else h = 60 * ((nr - ng) / delta + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : delta / max;
  return { h, s, v: max };
}

function applyVisionHints(vision) {
  if (!vision) return;
  ["riceBoost", "oilBoost", "proteinBoost", "sauceBoost"].forEach((id) => {
    const input = $(`#${id}`);
    if (input) input.checked = false;
  });
}


window.MealLensTestApi = {
  getFoodCandidates,
  resolveIngredient,
  estimateIngredientList,
  parseIngredientText,
  normalizeMealRecord,
  normalizeStateData
};

if (!window.__MEALLENS_TEST__) {
  renderFoodDataSource();
  renderCommonFoodChips();
  renderIngredientRows();
  setupEvents();
  renderAll();
  migrateAndHydrateMealPhotos().catch(() => {});
}
