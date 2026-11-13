# Raider Course Check

Is my Canvas class set up the RJ way? One click on any of your Canvas classes shows what's done, what's worth a look and what needs a fix, with a link to each fix. Built for Regis Jesuit High School.

**[Set up Raider Course Check →](https://rjedtech.github.io/Raider-Course-Check/)**

## Where the checks come from

Every check traces to a page in the faculty PD course. If it can't, it doesn't belong here.

- **Required** and **Expected**: *What Every Course Must Have: the RJ Baseline*
- **Recommended**: *One Route for Students: Pick Your Modules Pattern*

| Group | Check | Red ("Needs a fix") only when |
|---|---|---|
| Required | Modules hold everything, in order | graded work students turn in on Canvas is outside every published module (paper work, ungraded items and orphan pages are "worth a look") |
| Required | Automatic zero for missing work | the missing policy is off ("worth a look" if it's on but not 0%) |
| Required | Every graded item has a due date | a graded item has no due date for the class or a whole section (a blank date on one student's extension is "worth a look") |
| Required | Due dates students can use | it locks before it's due, opens after it's due, or is dated outside the semester |
| Required | Grades kept up to date, and posted | 3+ grades on one item have been hidden from students for over two weeks (work waiting 2+ weeks is "worth a look") |
| Required | The gradebook does the math you mean | weights don't add to 100% (or are all 0%) while weighting is on, or a rubric used for grading doesn't match the points |
| Required | AI policy · accommodation plans | never: the teacher confirms these with "I have this" |
| Expected | One graded item a week | never: a row of week boxes; empty weeks say why, and the teacher can mark a week as having a reason |
| Expected | You assess every submission yourself | never: teacher confirms |
| Recommended | Short menu · a date on each class or week · no empty modules | never |

Only classes are checked: courses in a "1st/2nd Semester" term. IMPACT, clubs, activities, PD and sandboxes get a short note and no checks.

## How it's built

- `index.html`: the setup page. The bookmark button is a short loader that pulls `check.js` from this site (cache-busted hourly), so a change here reaches every teacher without re-dragging the button.
- `check.js`: the checker. Runs inside Canvas as the signed-in teacher and reads the Canvas REST API with their session. **Read only:** GET requests only.
- Nothing is sent anywhere. The only things saved are the teacher's own ticks ("I have this", weeks marked as having a reason), in the browser's localStorage, per class (`rjCourseCheck:v2:<course id>`).
- Light/dark follows the operating system.

## Each semester

Update `CAL` near the top of `check.js`: the first full week of classes, the last week, and the break weeks (`off`) and short weeks (`short`). A semester missing from `CAL` still works: the weekly check starts after the class's first graded due date, and teachers mark breaks themselves.

## Testing against real classes

Set `window.RJCC_AUDIT = true` before loading `check.js` and it won't open the panel; instead `RJCourseCheck.analyze(courseId)` returns the results and `RJCourseCheck.evaluate(data)` fills in the statuses.

## License

© 2026 Jason Beyer, RJ Ed Tech. Licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/): free to share and adapt for non-commercial use with credit. See [LICENSE](LICENSE) for what the license does not cover.
