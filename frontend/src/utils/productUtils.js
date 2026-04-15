const BAD_NAME_PATTERNS = [
  /^uniqproduct[-_]/i,
  /^[a-f0-9-]{12,}$/i,
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
];

export const isProbablyBadName = (name) => {
  if (!name) return true;
  const trimmed = String(name).trim();
  if (trimmed.length < 3) return true;
  return BAD_NAME_PATTERNS.some((pattern) => pattern.test(trimmed));
};

export const sanitizeName = (name, fallback = "Premium Item") => {
  return isProbablyBadName(name) ? fallback : String(name).trim();
};

export const formatPrice = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "";
  return Math.round(numeric).toLocaleString();
};

export const dedupeById = (items = []) => {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    const key = item?.id ?? item?.product_id;
    if (key === undefined || key === null) return;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });
  return result;
};
