Headless-Chrome checks for My finances.html. Run from any folder with S set to a scratch directory for output:
  S=<scratch dir> node "Redesign build/tests/sweep.mjs"     -> every tab, both volumes, light/dark, desktop 1360 + phone 390.
                                                              Writes $S/sweep/sweep.json (overflow, clipped/overlapping chart labels, contrast, tap targets) + screenshots.
  S=<scratch dir> node "Redesign build/tests/st2.mjs" <width> <name> "<js to run after sample data + Statements tab>" [view]
                                                              -> one screenshot ($S/<name>.png); PAGE=<file url> to test another copy.
  S=<scratch dir> node "Redesign build/tests/bk.mjs"         -> backup save/clear/open round trip, unlocked and locked.
Notes: the contrast probe can't read color-mix() fills (calendar days) - measure those by drawing to a canvas.
Overview content fades in on scroll: scroll through before a full-page screenshot.
  Setup wizard: S=<scratch dir> node "Redesign build/tests/st2.mjs" <width> <name> "$(sed 's/STOP/99/' "Redesign build/tests/wzcheck.js")" view
                                                              -> walks every setup step; the page title (printed as "t") lists any box whose text is cut off. STOP=<n> stops on step n+1 for a screenshot.
Notebook (2026-10-12): the page opens in the Notebook style (preference key fa-nb-view; 'ledger' switches it off), so the sweep checks Notebook. To check Ledger, click '.nb-views [data-v=ledger]' first.
Known false positives: i.sr-only "clipped", native checkboxes and #showAll under 24px.
Shareable copy (2026-10-22): node "Redesign build/build-one.js" "<project dir>" --share writes Share/My finances.html without Redesign build/personal/.
  Test it with PAGE=file:///C:/Claude%20Projects/Financial%20Advisor/Share/My%20finances.html before any of the scripts above.
  Taxes years setting: state.years = {first, last} (tax-years.js); the Filing plan picker is #yrFirst/#yrLast.
