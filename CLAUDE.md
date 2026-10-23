# My finances

An offline money and tax notebook in one HTML file. README.md explains what it does for a user; this file is for whoever edits it with Claude.

## Never hand-edit the built pages

`My finances.html` and `Share/My finances.html` are build output. Change the sources and rebuild:

- `Originals (before redesign)/` holds the two original pages (Financial Advisor, Tax Coordinator).
- `Redesign build/` holds the files that are layered on top (`theme.css`, `notebook.css`, `notebook.js`, `statements-*.js`, `tax-years.js`, and so on).

```bash
node "Redesign build/build-one.js" "<project folder>" --share
```

`--share` writes `Share/My finances.html` and skips the personal overlay. Without `--share` it writes `My finances.html` in the project root and also reads `Redesign build/personal/` if it exists. The build recomputes the Content-Security-Policy script hashes, so never copy hashes by hand.

## Personal overlay (optional, git-ignored)

`Redesign build/personal/` is for one person's own details and is never committed or shared:

- `myplaces.js` has merchant regexes for "Your work suppliers".
- `tax.js` and `money.js` hold `[personal, generic]` text pairs, loaded by `personal.js`.

If the folder is missing, the app builds fine with the generic text.

## Tests

Headless-Chrome checks are in `Redesign build/tests/`; read `Redesign build/tests/README.txt` first. The main scripts are `sweep.mjs` (every tab, both volumes, light and dark, desktop and phone), `bk.mjs` (backup round trip, unlocked and locked) and `st2.mjs` (one screenshot). Set `S` to a scratch directory and `PAGE` to the file URL of the copy to test. Run the sweep and `bk.mjs` after any change, on the `--share` build as well.

## Design system

- `DESIGN.md` and `.impeccable/design.json` describe it. Read them before changing how anything looks.
- Fonts are Sitka (body) and Cascadia Mono (figures). There is no network, so no web fonts or CDN files.
- The "Notebook" hand-drawn style lives in `notebook.css` and `notebook.js`. It is the default; "Ledger" is the original printed look (preference key `fa-nb-view`). Check both when you change a page.
- Professional documents, such as the accountant report, stay plain.

## Hard rules

- The page must keep working with no network. Do not add anything that fetches from outside.
- Financial data, tax forms, statements and backups never go in the repo (`.gitignore` is an allow-list; `*.csv`, `*.pdf`, `*.png`, `*.jpg` and backup files are blocked). Mockups and briefs use made-up sample numbers only.
- It is not tax advice, and the app says so.

## Skills

`.claude/skills/` has the project's skills: `bmo-pdf` (BMO PDF statements to CSV), `sketchy` (hand-drawn redesigns), `web-design-engineer` and `no-ai-design-slop`. `sketchy-briefs/` holds the saved briefs and the root `*.html` files are the mockups they produced.

## Windows shell gotcha

Backslashes and backticks get mangled in Bash heredocs. Write scripts with a file-writing tool instead.
