---
name: bmo-pdf
description: Convert BMO Mastercard PDF statements into a CSV that My finances can import. Use when the owner types /bmo-pdf, or asks to convert, turn or read BMO credit card statement PDFs for the app.
argument-hint: "<folder with the PDFs> [output name.csv]"
---

# BMO Mastercard PDFs → CSV for My finances

Turns BMO Mastercard PDF statements into one CSV (`Date,Description,Amount`, purchases negative) that
imports cleanly in `My finances.html` (Statements → Files). The work is done by
`Redesign build/tools-bmo-pdf.js` in this project (run from the project folder).

## Arguments

- First argument (required): the folder with the PDFs. If it is missing, ask the owner where the PDFs are.
- Second argument (optional): the output file name. Leave it out and the tool names the file from the
  statement months, e.g. `BMO Mastercard Aug-Oct 2026.csv`. If the owner gives a name, never let it contain
  the word "statement": the app strips month names and numbers from a file name to guess the account,
  and "statements" would break the "BMO Mastercard" match.

## Steps

1. List the PDFs in the folder (`ls`) and tell the owner which statements you found. If there are none,
   say so and stop.
2. Run the tool from the Bash tool (Git Bash, which has xpdf's `pdftotext`):
   ```bash
   node "Redesign build/tools-bmo-pdf.js" "<folder>" ["<output name>.csv"]
   ```
   If a file with that name already exists in the folder, tell the owner before overwriting it.
3. Each statement prints "adds up" or "OFF BY x". The tool writes nothing unless every statement's
   transactions add up to its own change in balance.
   - If one is off, extract that PDF with `pdftotext -table` into the scratchpad and find the lines the
     parser missed. Known quirks it already handles: glued dates (`May. 11May. 11`), descriptions that wrap
     onto one or two lines, and foreign purchases whose currency and rate come before the merchant.
   - Fix the parser in `tools-bmo-pdf.js` and rerun until every statement adds up.
4. Check the result before handing it over:
   - The row count matches the statements.
   - No description is only a currency and rate.
   - Nothing like the cardholder's name, "Subtotal" or "Page" ended up in a description.
5. Tell the owner, briefly:
   - The file's path, how many transactions and statements, and the date range.
   - That every statement adds up.
   - How to import it: reload `My finances.html`, go to Statements → Files → Add statement files, and pick
     the CSV. The account should come up as "BMO Mastercard". Choose "Don't update" for the balance,
     because a credit card isn't something they own.
   - That transactions already in the app are skipped. If they also imported BMO's own CSV download for the
     same dates, descriptions can differ, so those dates may come in twice. Offer to make a version without
     those dates.

## Notes

- The tool reads every PDF in the folder, so old months come along too. They're skipped on import. If the
  owner wants smaller files, suggest a separate folder for new statements.
- Leave the owner's PDFs and any Excel files in the folder untouched. Only write the new CSV.
- BMO **chequing** PDFs ("Everyday Banking", "For the period ending …") have their own tool:
  `node "Redesign build/tools-bmo-chq-pdf.js" "<folder>" ["<name>.csv"]`.
  It checks each statement against its "Closing totals" line and every printed running balance, and names
  the file "BMO Checking …" so it lands in the owner's existing BMO Checking account. If the owner also imported BMO's own chequing CSV export (`BMO Checking.csv`), its descriptions differ, so
  overlapping dates would come in twice.
- tools-bmo-pdf.js only understands BMO Mastercard statements (it looks for "Statement date" and "Previous total balance").
  For another bank, read a sample with `pdftotext -table` and write a parser the same way, with the same
  balance check.
