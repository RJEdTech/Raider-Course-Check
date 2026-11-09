# Raider Course Check

Is my Canvas course set up the RJ way? One click on any of your Canvas courses shows what's done, what's worth a look and what needs a fix, with a link to each fix. Built for Regis Jesuit High School.

**[Set up Raider Course Check →](https://rjedtech.github.io/Raider-Course-Check/)**

## What it checks

Based on *What Every Course Must Have — the RJ Baseline* in the faculty PD course.

| Group | Check |
|---|---|
| Required | Modules hold all graded work (items with nothing to turn in online count as minor) |
| Required | Automatic Missing policy is on |
| Required | Every graded item has a due date (every section) |
| Required | Grades kept up to date (work waiting over two weeks) |
| Expected | One graded item each week — counts full weeks of classes from the date in `CAL.firstFullWeek`, skipping `CAL.skipWeeks`. **Update `CAL` in check.js each semester.** |
| Check yourself | Written AI policy · accommodation plans set up ahead |
| Next step | One suggestion from the PD ladder (Enhance → Deepen → Innovate) once required items are done, based on verb-first titles, text headers, required order, minimum-score checks, rubrics and Mastery Paths |
| Recommended | Short student menu · dates on each class or week · pages in modules · no empty modules · one usual due time · unpublished items in published modules |

## How it's built

- `check.js` — readable source. `check.min.js` — minified (terser 5.31.0), embedded in the bookmark link on `index.html`.
- Runs inside Canvas as the signed-in teacher and reads the Canvas REST API with their session. **Read only:** it makes only GET requests and never changes the course.
- Nothing is sent anywhere. The only thing saved is the "I've checked this" boxes, in the browser's localStorage, per course.
- Light/dark follows the operating system.

## Changing the checks

Edit `check.js`, then re-minify and rebuild the bookmark link:

```
npx terser@5.31.0 check.js -c -m -o check.min.js
```

Then replace the `href` of `#bm` in `index.html` with `javascript:` + the URL-encoded contents of `check.min.js`. Teachers must drag the new button again to get the update.

## License

© 2026 Jason Beyer, RJ Ed Tech. Licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/): free to share and adapt for non-commercial use with credit. See [LICENSE](LICENSE) for what the license does not cover.
