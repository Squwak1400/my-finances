# My finances

A private, offline money and tax notebook in one HTML file. No account, no server, and no network access: the page's security policy blocks it from contacting anything.

## Use it

1. Download [`Share/My finances.html`](Share/My%20finances.html).
2. Open it in Chrome, Edge or Firefox.
3. Click **Try it with sample data** to look around, or **Start guided setup** to enter your own numbers.

Everything you enter is saved in your own browser's storage on your own computer. It never leaves it. To move it or keep a copy, use **Settings → Backups** to save a backup file. You can set a passphrase under **Settings → Lock**, and backups made while locked are encrypted.

It has two volumes:

- **My finances:** budget, net worth, debts, goals, and statements imported from your bank's CSV files.
- **Taxes:** help catching up on Canadian returns. It reads crypto exchange CSVs (Crypto.com, Kraken or a manual template) and works out the adjusted cost base. It also has year-by-year estimates and questions to bring to your accountant. Pick the years you're filing at the top of **Filing plan**; it has tax tables for 2021 to 2025 and for Ontario, BC, Alberta, Saskatchewan and Manitoba. It is not tax advice.

## Build it

The page is built from the originals plus the files in `Redesign build/`. Never edit `My finances.html` by hand.

```bash
node "Redesign build/build-one.js" "<this folder>" --share
```

This writes `Share/My finances.html`. Without `--share`, the build also reads `Redesign build/personal/` if it exists and writes `My finances.html` in the folder root. That copy is meant for one person: their own merchant names and work history. The folder is git-ignored and never shared.

Headless-Chrome checks live in `Redesign build/tests/` (see its README). The design system is in `DESIGN.md`.
