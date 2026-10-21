(function () {
'use strict';
var ID = 'rjCourseCheck';
var old = document.getElementById(ID);
if (old) { old.remove(); var oc = document.getElementById(ID + 'Css'); if (oc) oc.remove(); return; }

var PD = 'https://rjhs.instructure.com/courses/5414/pages/';
var TEAMS = 'https://teams.microsoft.com/l/chat/0/0?users=jbeyer@regisjesuit.com';
var m = location.pathname.match(/\/courses\/(\d+)/);

/* ---------- styles ---------- */
var css = document.createElement('style');
css.id = ID + 'Css';
css.textContent = [
'#' + ID + '{--ink:#1a1a1a;--ink2:#444;--mute:#6E6A64;--bg:#fff;--panel:#f7f7f4;--line:#e2e2dd;--char:#2a2a2a;--red:#C11430;--ok:#1e7a3c;--warn:#a15c00;--bad:#C11430;--chk:#2a5fa8;',
'position:fixed;top:0;right:0;bottom:0;width:min(560px,100vw);z-index:2147483000;background:var(--bg);color:var(--ink);',
'box-shadow:-6px 0 30px rgba(0,0,0,.25);overflow:auto;font:15px/1.5 "Helvetica Neue",Helvetica,Arial,sans-serif}',
'@media (prefers-color-scheme:dark){#' + ID + '{--ink:#f2f1ee;--ink2:#cfcdc7;--mute:#a6a29b;--bg:#15161a;--panel:#1d1f24;--line:#35353c;--ok:#5fd08a;--warn:#f0b04a;--bad:#ff6b80;--chk:#8bb6ff}}',
'#' + ID + ' *{box-sizing:border-box}',
'#' + ID + ' .hd{background:var(--char);color:#fff;padding:14px 18px;border-bottom:5px solid var(--red);position:sticky;top:0;z-index:2}',
'#' + ID + ' .hd .t{font-size:18px;font-weight:700}',
'#' + ID + ' .hd .s{font-size:12.5px;color:#cfcfcf;margin-top:2px}',
'#' + ID + ' .hd .x{position:absolute;right:12px;top:10px;background:none;border:1px solid #777;color:#fff;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:14px}',
'#' + ID + ' .hd .p{position:absolute;right:62px;top:10px;background:none;border:1px solid #777;color:#fff;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:14px}',
'#' + ID + ' .bd{padding:14px 18px 40px}',
'#' + ID + ' .sum{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 6px}',
'#' + ID + ' .pill{border-radius:999px;padding:3px 11px;font-size:13px;font-weight:700;border:1px solid var(--line);background:var(--panel)}',
'#' + ID + ' h3{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);margin:22px 0 8px;padding-bottom:5px;border-bottom:1px solid var(--line)}',
'#' + ID + ' .row{border:1px solid var(--line);border-radius:9px;margin:0 0 9px;background:var(--panel)}',
'#' + ID + ' .row>summary{list-style:none;cursor:pointer;display:flex;gap:11px;align-items:flex-start;padding:11px 13px}',
'#' + ID + ' .row>summary::-webkit-details-marker{display:none}',
'#' + ID + ' .ic{flex:0 0 26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px;margin-top:1px}',
'#' + ID + ' .ok .ic{background:var(--ok)} #' + ID + ' .warn .ic{background:var(--warn)} #' + ID + ' .bad .ic{background:var(--bad)} #' + ID + ' .chk .ic{background:var(--chk)}',
'#' + ID + ' .nm{font-weight:700;color:var(--ink)}',
'#' + ID + ' .why{font-size:13.5px;color:var(--ink2)}',
'#' + ID + ' .res{font-size:13.5px;margin-top:2px}',
'#' + ID + ' .ok .res{color:var(--ok)} #' + ID + ' .warn .res{color:var(--warn)} #' + ID + ' .bad .res{color:var(--bad)} #' + ID + ' .chk .res{color:var(--chk)}',
'#' + ID + ' .det{padding:0 13px 12px 50px;font-size:13.5px;color:var(--ink2)}',
'#' + ID + ' .det ul{margin:4px 0 8px;padding-left:18px}',
'#' + ID + ' .det li{margin:2px 0}',
'#' + ID + ' a{color:var(--chk)}',
'#' + ID + ' .fix{display:inline-block;margin-top:4px;font-weight:700}',
'#' + ID + ' .note{font-size:12.5px;color:var(--mute);margin-top:18px}',
'#' + ID + ' .teams{display:inline-block;background:#5B5FC7;color:#fff!important;text-decoration:none;border-radius:5px;padding:5px 12px;font-weight:700}',
'#' + ID + ' .load{padding:30px 0;color:var(--ink2)}',
'#' + ID + ' label.mine{display:flex;gap:7px;align-items:center;font-size:13.5px;margin-top:6px;color:var(--ink)}',
'@media print{body>*:not(#' + ID + '){display:none!important}#' + ID + '{position:static;width:auto;box-shadow:none;overflow:visible}#' + ID + ' .hd{position:static}#' + ID + ' .hd button{display:none}#' + ID + ' details{break-inside:avoid}}'
].join('\n');
document.head.appendChild(css);

var box = document.createElement('div');
box.id = ID;
box.setAttribute('role', 'dialog');
box.setAttribute('aria-label', 'Raider Course Check');
box.innerHTML = '<div class="hd"><div class="t">Raider Course Check</div><div class="s">Read only. Nothing in your course is changed.</div>' +
  '<button class="p" type="button">Print</button><button class="x" type="button" aria-label="Close">✕</button></div><div class="bd"><div class="load">Checking your course…</div></div>';
document.body.appendChild(box);
box.querySelector('.x').onclick = function () { box.remove(); css.remove(); };
box.querySelector('.p').onclick = function () { box.querySelectorAll('details').forEach(function (d) { d.open = true; }); window.print(); };
var body = box.querySelector('.bd');

if (!m) { body.innerHTML = '<p class="load">Open one of your Canvas courses first (any page in the course), then click <strong>Raider Course Check</strong> again.</p>'; return; }
var cid = m[1];
var base = location.origin;

/* ---------- helpers ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
async function get(url) {
  var out = [], next = base + url, guard = 0;
  while (next && guard++ < 60) {
    var r, tries = 0;
    do { r = await fetch(next, { credentials: 'same-origin', headers: { Accept: 'application/json' } }); if (r.status === 403 || r.status === 429) await sleep(1500 * ++tries); } while ((r.status === 403 || r.status === 429) && tries < 5);
    if (!r.ok) { var e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
    var j = JSON.parse((await r.text()).replace(/^while\(1\);/, ''));
    if (!Array.isArray(j)) return j;
    out = out.concat(j);
    var lk = r.headers.get('Link') || '', mm = lk.match(/<([^>]+)>;\s*rel="next"/);
    next = mm ? mm[1] : null;
  }
  return out;
}
function link(href, text) { return '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(text) + '</a>'; }
function list(items, max) {
  max = max || 12;
  var h = '<ul>' + items.slice(0, max).map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>';
  if (items.length > max) h += '<div>…and ' + (items.length - max) + ' more.</div>';
  return h;
}
function fmtDay(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmtTime(iso) { return new Date(iso).toLocaleTimeString('en-US', { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit' }); }

var results = [];
function add(group, status, name, why, result, detail, fixHref, fixText) {
  results.push({ group: group, status: status, name: name, why: why, result: result, detail: detail || '', fixHref: fixHref, fixText: fixText });
}

(async function run() {
  try {
    var course = await get('/api/v1/courses/' + cid + '?include[]=term');
    var assignments, modules, tabs, latePolicy, pages;
    var all = await Promise.all([
      get('/api/v1/courses/' + cid + '/assignments?per_page=100&include[]=all_dates'),
      get('/api/v1/courses/' + cid + '/modules?per_page=100&include[]=items'),
      get('/api/v1/courses/' + cid + '/tabs').catch(function () { return []; }),
      get('/api/v1/courses/' + cid + '/late_policy').catch(function () { return {}; }),
      get('/api/v1/courses/' + cid + '/pages?per_page=100&published=true').catch(function () { return []; })
    ]);
    assignments = all[0]; modules = all[1]; tabs = all[2]; latePolicy = all[3]; pages = all[4];
    for (var k = 0; k < modules.length; k++) {
      if (!modules[k].items && modules[k].items_count > 0) modules[k].items = await get('/api/v1/courses/' + cid + '/modules/' + modules[k].id + '/items?per_page=100');
    }

    var now = new Date();
    var pubMods = modules.filter(function (x) { return x.published; });
    var inMod = {};
    var unpubInPub = [];
    pubMods.forEach(function (mo) {
      (mo.items || []).forEach(function (it) {
        if (it.published === false) { if (it.type !== 'SubHeader') unpubInPub.push(it.title + ' <span style="color:var(--mute)">(' + esc(mo.name) + ')</span>'); return; }
        if (it.type === 'Assignment') inMod['A' + it.content_id] = 1;
        if (it.type === 'Quiz') inMod['Q' + it.content_id] = 1;
        if (it.type === 'Discussion') inMod['D' + it.content_id] = 1;
        if (it.type === 'Page') inMod['P' + it.page_url] = 1;
      });
    });

    var graded = assignments.filter(function (a) {
      return a.published && a.points_possible > 0 && (a.submission_types || []).indexOf('not_graded') < 0 && !a.omit_from_final_grade;
    });
    function inModule(a) {
      return inMod['A' + a.id] || (a.quiz_id && inMod['Q' + a.quiz_id]) || (a.discussion_topic && inMod['D' + a.discussion_topic.id]);
    }
    function aLink(a) { return link(base + '/courses/' + cid + '/assignments/' + a.id, a.name); }
    function aEdit(a) { return link(base + '/courses/' + cid + '/assignments/' + a.id + '/edit', a.name); }

    /* ---- REQUIRED 1: everything in modules ---- */
    var notIn = graded.filter(function (a) { return !inModule(a); });
    function offline(a) { var t = a.submission_types || []; return t.every(function (x) { return x === 'none' || x === 'on_paper'; }); }
    var notInOnline = notIn.filter(function (a) { return !offline(a); });
    var notInOffline = notIn.filter(offline);
    var MW = 'Every assignment, quiz and discussion lives inside a published module, so students find everything in one place.';
    if (!graded.length) add('req', 'warn', 'Modules hold all your graded work', MW, 'No published graded work yet.', '', PD + 'module-setup', 'Module setup');
    else if (!notIn.length) add('req', 'ok', 'Modules hold all your graded work', MW, 'All ' + graded.length + ' graded items are in a published module.');
    else if (!notInOnline.length) add('req', 'warn', 'Modules hold all your graded work', MW,
      notInOffline.length + ' graded item' + (notInOffline.length > 1 ? 's' : '') + ' with nothing to turn in online ' + (notInOffline.length > 1 ? 'are' : 'is') + ' not in a module.',
      '<div>Students don’t need to open these, so this is minor. Adding them to the module for that day keeps everything in one place.</div>' + list(notInOffline.map(aLink)),
      base + '/courses/' + cid + '/modules', 'Open my Modules');
    else add('req', 'bad', 'Modules hold all your graded work', MW,
      notInOnline.length + ' graded item' + (notInOnline.length > 1 ? 's' : '') + ' students turn in online ' + (notInOnline.length > 1 ? 'are' : 'is') + ' not in any published module' + (notInOffline.length ? ' (plus ' + notInOffline.length + ' done on paper or in class).' : '.'),
      '<div>Add these to a module (Modules → <strong>+</strong> on the module). A link on a page is not enough — the item itself goes in the module.</div>' + list(notInOnline.map(aLink)) +
      (notInOffline.length ? '<div>Also not in a module (nothing to turn in online, so minor):</div>' + list(notInOffline.map(aLink), 6) : ''),
      base + '/courses/' + cid + '/modules', 'Open my Modules');

    /* ---- REQUIRED 2: missing policy ---- */
    var lp = latePolicy && latePolicy.late_policy;
    if (lp && lp.missing_submission_deduction_enabled) add('req', 'ok', 'Automatic Missing policy is on', 'Work not turned in by the due date shows as Missing and counts, so grades stay honest all term.', 'On.');
    else add('req', 'bad', 'Automatic Missing policy is on', 'Work not turned in by the due date shows as Missing and counts, so grades stay honest all term.', 'Off.',
      '<div>Gradebook → gear (Settings) → <strong>Late Policies</strong> → turn on <em>Automatically apply grade for missing submissions</em>. Tell your classes before you turn it on.</div>',
      PD + 'setting-up-our-automatic-missing-slash-late-policy-in-canvas', 'How to set the policy');

    /* ---- REQUIRED 3: due dates ---- */
    function hasDue(a) {
      if (a.all_dates && a.all_dates.length) return a.all_dates.every(function (d) { return !!d.due_at; });
      return !!a.due_at;
    }
    var noDue = graded.filter(function (a) { return !hasDue(a); });
    if (!graded.length) {}
    else if (!noDue.length) add('req', 'ok', 'Every graded item has a due date', 'A due date puts the work on each student’s List View and To Do, where they plan their week.', 'All ' + graded.length + ' have a due date.');
    else add('req', 'bad', 'Every graded item has a due date', 'A due date puts the work on each student’s List View and To Do, where they plan their week.',
      noDue.length + ' graded item' + (noDue.length > 1 ? 's have' : ' has') + ' no due date (for at least one section).',
      '<div>Open each one, click <strong>Edit</strong>, and add a due date. Work done on paper still gets a due date.</div>' + list(noDue.map(aEdit)),
      PD + 'every-kind-of-work-on-the-students-list', 'Every kind of work, on the student’s list');

    /* ---- REQUIRED 4: grades kept up to date ---- */
    try {
      var subs = await get('/api/v1/courses/' + cid + '/students/submissions?student_ids[]=all&workflow_state=submitted&per_page=100');
      var gmap = {}; graded.forEach(function (a) { gmap[a.id] = a; });
      var cutoff = new Date(now.getTime() - 14 * 864e5);
      var waiting = {};
      subs.forEach(function (s) {
        var a = gmap[s.assignment_id]; if (!a || !s.submitted_at) return;
        if (new Date(s.submitted_at) < cutoff) waiting[a.id] = (waiting[a.id] || 0) + 1;
      });
      var wl = Object.keys(waiting).map(function (id) { return { a: gmap[id], n: waiting[id] }; }).sort(function (x, y) { return y.n - x.n; });
      if (!wl.length) add('req', 'ok', 'Grades are kept up to date', 'Students and families see where they stand through each six-week grading period.', 'Nothing has been waiting more than two weeks for a grade.');
      else add('req', 'warn', 'Grades are kept up to date', 'Students and families see where they stand through each six-week grading period.',
        wl.length + ' item' + (wl.length > 1 ? 's have' : ' has') + ' work turned in over two weeks ago and not yet graded.',
        list(wl.map(function (w) { return link(base + '/courses/' + cid + '/gradebook/speed_grader?assignment_id=' + w.a.id, w.a.name) + ' — ' + w.n + ' waiting'; })) +
        '<div>Graded on paper and entered later? Then this is just a reminder to enter the scores.</div>',
        PD + 'set-up-your-gradebook', 'Set up your gradebook');
    } catch (e) { add('req', 'chk', 'Grades are kept up to date', 'Students and families see where they stand through each six-week grading period.', 'Could not read submissions — check your Gradebook yourself.'); }

    /* ---- EXPECTED: one graded item a week ---- */
    /* Canvas terms open in July so teachers can build; classes start mid-August.
       Count from the first FULL week of classes and skip short weeks.
       Update CAL each semester (Mondays, YYYY-MM-DD). */
    var CAL = {
      firstFullWeek: { '2026-07': '2026-08-24' },   /* Fall 2026: classes began Wed Aug 19 */
      skipWeeks: ['2026-10-12']                     /* Fall break after Tue Oct 13 */
    };
    var termStart = course.start_at || (course.term && course.term.start_at);
    var tkey = termStart ? termStart.slice(0, 7) : '';
    var ffw = CAL.firstFullWeek[tkey];
    var start = ffw ? new Date(ffw + 'T00:00:00') : null;
    if (start) {
      var s0 = new Date(start); var day = s0.getDay(); var mon = new Date(s0); mon.setDate(s0.getDate() - ((day + 6) % 7)); mon.setHours(0, 0, 0, 0);
      var weeks = [];
      for (var w = new Date(mon); w < now; w = new Date(w.getTime() + 7 * 864e5)) {
        var end = new Date(w.getTime() + 7 * 864e5);
        if (end > now) break;
        var wkey = w.getFullYear() + '-' + String(w.getMonth() + 1).padStart(2, '0') + '-' + String(w.getDate()).padStart(2, '0');
        if (CAL.skipWeeks.indexOf(wkey) >= 0) continue;
        var has = graded.some(function (a) {
          if (a.grading_type === 'pass_fail') return false;
          var dates = (a.all_dates && a.all_dates.length) ? a.all_dates.map(function (d) { return d.due_at; }) : [a.due_at];
          return dates.some(function (d) { if (!d) return false; var t = new Date(d); return t >= w && t < end; });
        });
        weeks.push({ w: w, has: has });
      }
      var empty = weeks.filter(function (x) { return !x.has; });
      if (!weeks.length) {}
      else if (!empty.length) add('exp', 'ok', 'One graded item each week', 'At least one assessed grade goes in every week (from the principal’s expectations).', 'All ' + weeks.length + ' full weeks of classes so far have a graded item due.');
      else add('exp', 'warn', 'One graded item each week', 'At least one assessed grade goes in every week (from the principal’s expectations).',
        empty.length + ' of ' + weeks.length + ' full weeks of classes had no graded item due.',
        '<div>Counting full weeks of classes since ' + fmtDay(start) + ' (the first partial week and fall break are left out). Weeks with no graded item due:</div>' +
        list(empty.map(function (x) { var e2 = new Date(x.w.getTime() + 4 * 864e5); return 'Week of ' + fmtDay(x.w) + ' – ' + fmtDay(e2); }), 20),
        PD + 'set-up-your-gradebook', 'Why and how');
    }

    /* ---- CHECK YOURSELF ---- */
    add('self', 'chk', 'A written AI policy in your syllabus', 'Say plainly, at the start of the term, where AI helps and where it gets in the way. Your syllabus can be a page, a file or a handout.', 'This tool can’t see your syllabus — check it yourself.', '', PD + 'write-your-course-ai-policy', 'Write your course AI policy');
    add('self', 'chk', 'Accommodation plans are set up ahead', 'Extended time set once in Moderate for New Quizzes, or on every Classic quiz, before the student has to ask.', 'Check your quizzes against your students’ plans.', '', PD + 'access-star-the-minimum-accommodations-what-to-do', 'Accommodations — what to do');

    /* ---- RECOMMENDED: one route ---- */
    var hideable = { assignments: 'Assignments', quizzes: 'Quizzes', files: 'Files', pages: 'Pages', discussions: 'Discussions', people: 'People', announcements: 'Announcements', syllabus: 'Syllabus', outcomes: 'Outcomes', collaborations: 'Collaborations', conferences: 'BigBlueButton', rubrics: 'Rubrics' };
    var visible = tabs.filter(function (t) { return !t.hidden && t.visibility !== 'admins' && t.visibility !== 'none' && t.id !== 'settings'; });
    var extra = visible.filter(function (t) { return hideable[t.id]; });
    if (tabs.length) {
      if (!extra.length) add('rec', 'ok', 'A short menu: one route for students', 'Fewer menu links means fewer places a student or parent hunts and doesn’t find. Modules can hold everything.', 'Students see: ' + visible.map(function (t) { return t.label; }).join(', ') + '.');
      else add('rec', 'warn', 'A short menu: one route for students', 'Fewer menu links means fewer places a student or parent hunts and doesn’t find. Modules can hold everything.',
        'Students see ' + visible.length + ' menu links, including ' + extra.map(function (t) { return t.label; }).join(', ') + '.',
        '<div>Once everything is in Modules: <strong>Settings → Navigation</strong>, click <strong>⋮</strong> beside each, choose <strong>Disable</strong>, then <strong>Save</strong>. Hiding a link doesn’t delete anything.</div>',
        PD + 'one-route-for-students-pick-your-modules-pattern', 'One route for students');
    }

    var frontUrl = null; try { var fp = await get('/api/v1/courses/' + cid + '/front_page'); frontUrl = fp && fp.url; } catch (e) {}
    var loose = (pages || []).filter(function (p) { return p.url !== frontUrl && !inMod['P' + p.url]; });
    var pagesHidden = tabs.some(function (t) { return t.id === 'pages' && t.hidden; });
    if (!loose.length) add('rec', 'ok', 'Pages live in modules too', 'A page that isn’t in a module can only be found through the Pages menu or a link.', 'All published pages are in a module (or are your home page).');
    else add('rec', pagesHidden ? 'warn' : 'chk', 'Pages live in modules too', 'A page that isn’t in a module can only be found through the Pages menu or a link.',
      loose.length + ' published page' + (loose.length > 1 ? 's are' : ' is') + ' not in any module' + (pagesHidden ? ' and your Pages menu is hidden.' : '.'),
      '<div>Fine if you link to them from somewhere students go. Otherwise add them to the module where they belong.</div>' + list(loose.map(function (p) { return link(base + '/courses/' + cid + '/pages/' + p.url, p.title); })));

    var emptyMods = pubMods.filter(function (mo) { return !(mo.items || []).some(function (it) { return it.published !== false && it.type !== 'SubHeader'; }); });
    if (emptyMods.length) add('rec', 'warn', 'No empty modules', 'An empty module looks like missing work to a student.', emptyMods.length + ' published module' + (emptyMods.length > 1 ? 's have' : ' has') + ' nothing students can open.',
      list(emptyMods.map(function (mo) { return esc(mo.name); })) + '<div>Fill it, or unpublish it until it’s ready.</div>', base + '/courses/' + cid + '/modules', 'Open my Modules');
    else if (pubMods.length) add('rec', 'ok', 'No empty modules', 'An empty module looks like missing work to a student.', 'Every published module has something in it.');

    var MON = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|ene|abr|ago|dic|janv|févr|avr|mai|juin|juil|août|déc)';
    var dateRe = new RegExp('\\b' + MON + '[a-zéû]*\\.?\\s*\\d|\\b\\d{1,2}\\s+(de\\s+)?' + MON + '|\\b\\d{1,2}\\/\\d{1,2}\\b|\\b(mon|tue|wed|thu|fri|lunes|martes|miércoles|jueves|viernes|lundi|mardi|mercredi|jeudi|vendredi)|\\bweek\\s*\\d|\\bsemana\\b|\\bclase\\s*\\d', 'i');
    var dated = pubMods.filter(function (mo) {
      if (dateRe.test(mo.name)) return true;
      return (mo.items || []).some(function (it) { return it.type === 'SubHeader' && dateRe.test(it.title); });
    });
    var content = pubMods.filter(function (mo) { return (mo.items || []).some(function (it) { return it.type === 'Assignment' || it.type === 'Quiz' || it.type === 'Discussion'; }); });
    if (content.length) {
      var undated = content.filter(function (mo) { return dated.indexOf(mo) < 0; });
      if (!undated.length) add('rec', 'ok', 'Each class or week has its date on it', 'A student who was absent goes to Modules and finds the date they missed.', 'Every module with work has a date in its name or headers.');
      else add('rec', 'chk', 'Each class or week has its date on it', 'A student who was absent goes to Modules and finds the date they missed.',
        undated.length + ' of ' + content.length + ' modules with work have no date in the name or a header.',
        '<div>Add the date to the module name ("Week 10: Oct 20–23") or to a text header for each lesson ("Lesson 2 · R 10/22 · W 10/23").</div>' + list(undated.map(function (mo) { return esc(mo.name); })),
        PD + 'one-route-for-students-pick-your-modules-pattern', 'Pick your pattern');
    }

    var times = {}, nd = 0;
    graded.forEach(function (a) { var d = (a.all_dates && a.all_dates[0] && a.all_dates[0].due_at) || a.due_at; if (!d) return; nd++; var t = fmtTime(d); times[t] = (times[t] || 0) + 1; });
    var top = Object.keys(times).sort(function (x, y) { return times[y] - times[x]; })[0];
    if (top && nd >= 5) {
      var share = Math.round(times[top] / nd * 100);
      add('rec', share >= 70 ? 'ok' : 'chk', 'One usual due time', 'When most work is due at the same time, students stop guessing.', share + '% of your dated work is due at ' + top + '.',
        share >= 70 ? '' : '<div>Times you use: ' + Object.keys(times).sort(function (x, y) { return times[y] - times[x]; }).slice(0, 6).map(function (t) { return t + ' (' + times[t] + ')'; }).join(', ') + '</div>');
    }

    if (unpubInPub.length) add('rec', 'chk', 'Hidden items inside published modules', 'Students can’t see unpublished items. That’s fine for work you’re still building.', unpubInPub.length + ' unpublished item' + (unpubInPub.length > 1 ? 's' : '') + ' inside published modules.',
      list(unpubInPub.map(esc).map(function (s) { return s.replace(/&lt;span style=&quot;color:var\(--mute\)&quot;&gt;|&lt;\/span&gt;/g, ''); })) + '<div>Publish them when students should see them.</div>');

    /* ---- NEXT STEP ON THE LADDER ---- */
    var settings = {}; try { settings = await get('/api/v1/courses/' + cid + '/settings'); } catch (e) {}
    var verbRe = /^\s*(read|watch|listen|do|reflect|practice|write|share|ask|apply|show|discuss|prepare|review|study|create|analyze|annotate|explore|investigate|present|revise|draft|leer|escribir|escuchar|practicar|ver|hablar|lire|écrire|écouter|parler)\b\s*[·:\-–—|]/i;
    var openItems = [], usesHeaders = false, usesOrder = false, usesMinScore = false;
    pubMods.forEach(function (mo) {
      if (mo.require_sequential_progress) usesOrder = true;
      (mo.items || []).forEach(function (it) {
        if (it.published === false) return;
        if (it.type === 'SubHeader') { usesHeaders = true; return; }
        openItems.push(it);
        if (it.completion_requirement) { usesOrder = true; if (it.completion_requirement.type === 'min_score') usesMinScore = true; }
      });
    });
    var verbShare = openItems.length ? openItems.filter(function (it) { return verbRe.test(it.title); }).length / openItems.length : 0;
    var withRubric = graded.filter(function (a) { return a.rubric || a.use_rubric_for_grading; }).length;
    var rubricShare = graded.length ? withRubric / graded.length : 0;
    var usesMastery = !!(settings && settings.conditional_release);
    var reqBad = results.some(function (r) { return r.group === 'req' && r.status === 'bad'; });
    var LV = PD + 'one-route-for-students-pick-your-modules-pattern#levels';
    var next;
    if (reqBad) {
      next = { level: 'Foundations', color: '#555', line: 'Finish the red items above first. They are what every RJ course needs, and they take care of you as well as your students.', tips: [] };
    } else {
      var enh = [];
      if (verbShare < 0.5) enh.push('<strong>Start each title with what students do</strong> &mdash; READ, DO, REFLECT, SHOW. Right now about ' + Math.round(verbShare * 100) + '% of your module items do.');
      if (!usesHeaders) enh.push('<strong>Add text headers inside your modules</strong> for each lesson or each step of the Ignatian pattern (Context, Experience, Reflection, Action, Evaluation).');
      if (!usesOrder) enh.push('<strong>Make students go in order</strong> where the order matters: the next item opens when they finish the one before it.');
      if (enh.length >= 2) next = { level: 'Enhance', color: '#2a6ebb', line: 'Your course is easy to find your way around. Next: turn each week or unit into a learning arc.', tips: enh,
        links: [[PD + 'the-ipp-your-way', 'The IPP, Your Way'], [PD + 'build-a-week-an-ipp-module-stage-by-stage', 'Build a Week, Stage by Stage'], [PD + 'module-requirements-make-your-order-the-path', 'Make Students Go in Order']] };
      else {
        var dep = [];
        if (!usesMinScore) dep.push('<strong>Add a short check students must pass to move on</strong> (for example 8 of 10), with retakes allowed and a re-teach video just before it.');
        if (rubricShare < 0.25) dep.push('<strong>Put a rubric on your bigger assignments</strong> so you can see the thinking, not just whether it was turned in. ' + withRubric + ' of ' + graded.length + ' graded items have one now.');
        dep.push('<strong>Read your quiz numbers</strong> after each check to decide what to re-teach.');
        if (!usesMinScore || rubricShare < 0.25) next = { level: 'Deepen', color: '#2e7d32', line: 'Your modules are shaped well. Next: build in ways to know if it’s working.', tips: dep,
          links: [[PD + 'quiz-data-coach-reading-your-own-numbers', 'Reading Your Own Quiz Numbers'], [PD + 'two-things-called-mastery', 'Two Things Called Mastery'], [PD + 'a-student-is-stuck-in-a-module', 'A Student Is Stuck in a Module']] };
        else next = { level: 'Innovate', color: '#7b3fa0', line: 'You are using the tools well. What would you like to try? This part is yours — one possibility:', tips: [
          usesMastery ? '<strong>Mastery Paths is on in this course.</strong> Try letting a score on one check send each student to the next step that fits them.' : '<strong>Mastery Paths</strong> lets a score on one check send each student to the next step that fits them.',
          '<strong>Let students choose</strong> how they investigate a question, or <strong>write the review questions</strong> themselves.'],
          links: [[PD + 'mastery-paths-what-it-does-and-what-it-costs', 'Mastery Paths: What It Does and What It Costs'], [PD + 'designing-the-thinking', 'Designing the Thinking']] };
      }
    }
    window.__rjccNext = next;
    render(course);
  } catch (e) {
    body.innerHTML = '<p class="load">Couldn’t check this course (' + esc(e.message) + '). Make sure you’re a teacher in this course. Still stuck? <a class="teams" href="' + TEAMS + '" target="_blank" rel="noopener">Teams Jason Beyer</a></p>';
  }
})();

function render(course) {
  var icon = { ok: '✓', warn: '!', bad: '✕', chk: '?' };
  var label = { ok: 'Done', warn: 'Worth a look', bad: 'Needs a fix', chk: 'Check yourself' };
  var count = { ok: 0, warn: 0, bad: 0, chk: 0 };
  results.forEach(function (r) { count[r.status]++; });
  var groups = [
    ['req', 'Required in every RJ course'],
    ['exp', 'Expected by the principal'],
    ['self', 'Check yourself'],
    ['rec', 'Recommended: one route for students']
  ];
  var store = 'rjCourseCheck:' + cid;
  var mine = {}; try { mine = JSON.parse(localStorage.getItem(store) || '{}'); } catch (e) {}
  var h = '<div style="font-size:16px;font-weight:700;margin:0 0 6px">' + esc(course.name) + '</div>' +
    '<div class="sum">' + ['bad', 'warn', 'chk', 'ok'].filter(function (s) { return count[s]; }).map(function (s) { return '<span class="pill ' + s + '" style="color:var(--' + (s === 'chk' ? 'chk' : s) + ')">' + icon[s] + ' ' + count[s] + ' ' + label[s] + '</span>'; }).join('') + '</div>' +
    '<div class="why">Checked ' + new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + '. Click any row for details and the fix.</div>';
  var nx = window.__rjccNext;
  if (nx) {
    h += '<div style="border-left:6px solid ' + nx.color + ';background:var(--panel);border-radius:0 9px 9px 0;padding:11px 14px;margin:14px 0 4px">' +
      '<div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--mute)">Your next step</div>' +
      '<div style="font-weight:700;font-size:16px;margin:2px 0 4px"><span style="background:' + nx.color + ';color:#fff;border-radius:4px;padding:1px 8px;font-size:13px;margin-right:6px">' + esc(nx.level.toUpperCase()) + '</span>' + esc(nx.line) + '</div>' +
      (nx.tips.length ? '<ul style="margin:6px 0 6px;padding-left:18px;font-size:13.5px;color:var(--ink2)">' + nx.tips.map(function (t) { return '<li style="margin:3px 0">' + t + '</li>'; }).join('') + '</ul>' : '') +
      (nx.links ? '<div style="font-size:13.5px">Show me how: ' + nx.links.map(function (l) { return '<a href="' + esc(l[0]) + '" target="_blank" rel="noopener">' + esc(l[1]) + '</a>'; }).join(' · ') + ' · <a href="' + PD + 'one-route-for-students-pick-your-modules-pattern#levels" target="_blank" rel="noopener">See the same week at four levels</a></div>' : '') +
      '</div>';
  }
  groups.forEach(function (g) {
    var rs = results.filter(function (r) { return r.group === g[0]; });
    if (!rs.length) return;
    h += '<h3>' + g[1] + '</h3>';
    rs.forEach(function (r, i) {
      var key = g[0] + i;
      var detail = r.detail || '';
      if (r.fixHref) detail += '<div>' + '<a class="fix" href="' + esc(r.fixHref) + '" target="_blank" rel="noopener">' + esc(r.fixText) + ' →</a></div>';
      if (g[0] === 'self') detail += '<label class="mine"><input type="checkbox" data-k="' + key + '"' + (mine[key] ? ' checked' : '') + '> I’ve checked this</label>';
      h += '<details class="row ' + r.status + '"' + (r.status === 'bad' ? ' open' : '') + '><summary><span class="ic" aria-label="' + label[r.status] + '">' + icon[r.status] + '</span><span><span class="nm">' + esc(r.name) + '</span><div class="res">' + r.result.replace(/</g, '&lt;') + '</div><div class="why">' + esc(r.why) + '</div></span></summary>' +
        (detail ? '<div class="det">' + detail + '</div>' : '') + '</details>';
    });
  });
  h += '<p class="note">Based on <a href="' + PD + 'what-every-course-must-have-the-rj-baseline" target="_blank" rel="noopener">What Every Course Must Have — the RJ Baseline</a>. This tool only reads your course; it never changes anything. Questions? <a class="teams" href="' + TEAMS + '" target="_blank" rel="noopener">Teams Jason Beyer</a></p>';
  body.innerHTML = h;
  body.querySelectorAll('input[data-k]').forEach(function (cb) {
    cb.onchange = function () { mine[cb.dataset.k] = cb.checked; try { localStorage.setItem(store, JSON.stringify(mine)); } catch (e) {} };
  });
}
})();
