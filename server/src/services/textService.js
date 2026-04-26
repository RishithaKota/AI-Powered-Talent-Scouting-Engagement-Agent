const stopWords = new Set([
  "and",
  "the",
  "with",
  "for",
  "you",
  "are",
  "will",
  "this",
  "that",
  "role",
  "need",
  "from",
  "have",
  "has",
  "our",
  "your",
  "to",
  "of",
  "in",
  "a",
  "an"
]);

export function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !stopWords.has(word));
}

export function uniqueTerms(text) {
  return [...new Set(tokenize(text))];
}
