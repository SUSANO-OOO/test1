(function attachMealLensFoodMatcher(root) {
  const synonymGroups = [
    { canonical: "うし", terms: ["牛肉", "ぎゅうにく", "牛にく", "ビーフ"] },
    { canonical: "ぶた", terms: ["豚肉", "ぶたにく", "豚にく", "ポーク"] },
    { canonical: "にわとり", terms: ["鶏肉", "とりにく", "鳥肉", "チキン"] },
    { canonical: "ねぎ", terms: ["ネギ", "葱"] },
    { canonical: "れんこん", terms: ["レンコン", "蓮根"] },
    { canonical: "じゃがいも", terms: ["じゃが芋", "ジャガイモ", "馬鈴薯"] },
    { canonical: "さつまいも", terms: ["さつま芋", "サツマイモ", "薩摩芋"] },
    { canonical: "たまねぎ", terms: ["玉ネギ", "タマネギ", "玉葱"] },
    { canonical: "たまご", terms: ["玉子", "タマゴ"] },
    { canonical: "ごはん", terms: ["ご飯", "白飯"] }
  ];

  function normalize(value) {
    return String(value || "")
      .normalize("NFKC")
      .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60))
      .replace(/[\s　＜＞［］【】・()（）「」『』,，.。:：/／\\\-〜~]/g, "")
      .toLowerCase();
  }

  function variants(value) {
    const base = normalize(value);
    const values = new Set(base ? [base] : []);
    synonymGroups.forEach((group) => {
      const normalizedTerms = group.terms.map(normalize);
      normalizedTerms.forEach((term) => {
        if (term && base.includes(term)) values.add(base.replace(term, group.canonical));
      });
    });
    return [...values];
  }

  function levenshtein(left, right) {
    if (left === right) return 0;
    if (!left.length) return right.length;
    if (!right.length) return left.length;
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let i = 1; i <= left.length; i += 1) {
      const current = [i];
      for (let j = 1; j <= right.length; j += 1) {
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1)
        );
      }
      previous.splice(0, previous.length, ...current);
    }
    return previous[right.length];
  }

  function bigrams(value) {
    if (value.length < 2) return value ? [value] : [];
    return Array.from({ length: value.length - 1 }, (_, index) => value.slice(index, index + 2));
  }

  function dice(left, right) {
    const a = bigrams(left);
    const b = bigrams(right);
    if (!a.length || !b.length) return 0;
    const remaining = [...b];
    let matches = 0;
    a.forEach((item) => {
      const index = remaining.indexOf(item);
      if (index < 0) return;
      matches += 1;
      remaining.splice(index, 1);
    });
    return (2 * matches) / (a.length + b.length);
  }

  function compare(query, targets) {
    const queryVariants = variants(query);
    let best = { score: 0, kind: "none" };
    for (const target of targets.filter(Boolean)) {
      const targetVariants = variants(target);
      for (const q of queryVariants) {
        for (const t of targetVariants) {
          let result = { score: 0, kind: "none" };
          if (q === t) result = { score: 1200, kind: "exact" };
          else if (t.startsWith(q) || q.startsWith(t)) result = { score: 820 + Math.min(q.length, t.length), kind: "prefix" };
          else if (t.includes(q) || q.includes(t)) result = { score: 680 + Math.min(q.length, t.length), kind: "partial" };
          else if (Math.min(q.length, t.length) >= 3) {
            const distance = levenshtein(q, t);
            const similarity = dice(q, t);
            if (distance <= 1) result = { score: 610 - distance * 30, kind: "near" };
            else if (similarity >= 0.62) result = { score: Math.round(420 + similarity * 120), kind: "near" };
          }
          if (result.score > best.score) best = result;
        }
      }
    }
    return best;
  }

  function parse(value) {
    const source = String(value || "").normalize("NFKC").trim();
    const unitPattern = "kg|キログラム|g|グラム|個|本|枚|パック|杯";
    const trailing = source.match(new RegExp(`^(.+?)[\\s:：,，]*(\\d+(?:\\.\\d+)?)\\s*(${unitPattern})$`, "i"));
    const leading = source.match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*(${unitPattern})\\s*(?:の)?\\s*(.+)$`, "i"));
    const match = trailing ? { name: trailing[1], amount: trailing[2], unit: trailing[3] }
      : leading ? { name: leading[3], amount: leading[1], unit: leading[2] }
        : null;
    if (!match) return { name: source, amount: null, unit: null };
    let amount = Number(match.amount);
    let unit = match.unit.toLowerCase();
    if (unit === "kg" || unit === "キログラム") {
      amount *= 1000;
      unit = "g";
    } else if (unit === "グラム") {
      unit = "g";
    }
    return { name: match.name.trim(), amount, unit };
  }

  root.MealLensFoodMatcher = { normalize, variants, compare, parse, levenshtein, dice };
})(typeof window !== "undefined" ? window : globalThis);
