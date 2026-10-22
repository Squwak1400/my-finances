// Statement import word matching. "merci" and "paiement" must be whole words: COMERCIAL (part of a store name)
// was read as a card payment, which flipped the signs of a whole file. And "pending" followed by a dot is a web
// address in a merchant name (BIRD* PENDING.BIRD.CO), not a pending transaction. Called by build-fa.js.
module.exports = function importFixes(h) {
  const all = (from, to, n, label) => { const c = h.split(from).length - 1; if (c !== n) throw new Error(`import fixes: expected ${n}, found ${c}: ${label}`); h = h.split(from).join(to); };
  all("|paiement|merci/", "|\\bpaiement\\b|\\bmerci\\b/", 2, "payment words (mapper, card accounts)");
  all("|paiement|merci)", "|\\bpaiement\\b|\\bmerci\\b)", 1, "payment words (card-ish)");
  all("/payment|paiement|merci|thank you/", "/payment|\\bpaiement\\b|\\bmerci\\b|thank you/", 1, "payment words (card check)");
  all("/\\bpending\\b/i.test(", "/\\bpending\\b(?!\\.)/i.test(", 2, "pending (import, balance)");
  return h;
};
