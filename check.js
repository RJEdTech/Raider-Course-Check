/*
  Raider Course Check: is this class set up the RJ way?
  Loaded by the bookmark button on https://rjedtech.github.io/Raider-Course-Check/
  READ ONLY: it makes GET requests to Canvas with the teacher's own login and
  never changes anything. Nothing is sent anywhere. The only thing saved is the
  teacher's own "I have this" ticks and excused weeks, in this browser.

  Every check comes from a page in the faculty PD course (course 5414):
    - What Every Course Must Have: the RJ Baseline  (Required, Expected)
    - One Route for Students: Pick Your Modules Pattern  (One route)
  A check that can't be traced to one of those pages doesn't belong here.

  Rule for red ("Needs a fix"): only when it is almost certainly wrong.
  Anything a teacher might have done on purpose is "Worth a look" at most.
*/
(function () {
'use strict';
var VERSION = '2.1.0';
var ID = 'rjCourseCheck';
var AUDIT = !!window.RJCC_AUDIT;

if (!AUDIT) {
  var old = document.getElementById(ID);
  if (old) { old.remove(); var oc = document.getElementById(ID + 'Css'); if (oc) oc.remove(); return; }
}

var PD = 'https://rjhs.instructure.com/courses/5414/pages/';
var TEAMS = 'https://teams.microsoft.com/l/chat/0/0?users=jbeyer@regisjesuit.com';
var DAY = 864e5;

/* ---------------------------------------------------------------------------
   School calendar, one entry per semester term. EDIT EACH SEMESTER.
   Key: the school year and semester from the Canvas term name
   ("2026/2027 - Regis Jesuit High School - 1st Semester" -> "2026/2027 1st").
   first: Monday of the first FULL week of classes.  last: Monday of the last week of classes.
   weeks: Mondays of weeks that aren't ordinary.
     off:   no classes all week. Never counted.
     short: a short week. Counted only if something graded was due.
   A semester missing from here still works: the check starts after the class's
   first graded due date and teachers mark breaks themselves.
--------------------------------------------------------------------------- */
var CAL = {
  '2026/2027 1st': {
    first: '2026-08-24',
    firstNote: 'Classes began Wed Aug 19, so that first partial week isn’t counted.',
    last: '2026-12-14',
    weeks: {
      '2026-10-12': { short: 'Fall break' },
      '2026-11-23': { off: 'Thanksgiving break' },
      '2026-12-21': { off: 'Christmas break' },
      '2026-12-28': { off: 'Christmas break' }
    }
  }
};

/* ---------------- helpers ---------------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
var base = location.origin;

async function fetchJson(url) {
  var r, text, tries = 0;
  while (true) {
    r = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    text = await r.text();
    if ((r.status === 429 || (r.status === 403 && /rate limit/i.test(text))) && tries < 5) await sleep(1500 * ++tries); else break;
  }
  var j = null;
  try { j = JSON.parse(text.replace(/^while\(1\);/, '')); } catch (e) {}
  return { status: r.status, ok: r.ok, json: j, link: r.headers.get('Link') || '' };
}
/* GET with paging. Throws on failure (e.status set). When Canvas says how
   many pages there are, the rest are fetched four at a time, not one by one. */
async function get(url) {
  var first = await fetchJson(base + url);
  if (!first.ok) { var e0 = new Error('HTTP ' + first.status); e0.status = first.status; throw e0; }
  if (!Array.isArray(first.json)) return first.json;
  var nx = first.link.match(/<([^>]+)>;\s*rel="next"/), last = first.link.match(/<([^>]+)>;\s*rel="last"/);
  var lp = last && last[1].match(/[?&]page=(\d+)/);
  if (!nx) return first.json;
  if (lp && +lp[1] > 1 && +lp[1] <= 80) {
    var n = +lp[1], urls = [];
    for (var pg = 2; pg <= n; pg++) urls.push(last[1].replace(/([?&]page=)\d+/, '$1' + pg));
    var pagesOut = new Array(urls.length), idx = 0;
    await Promise.all([0, 1, 2, 3].map(async function () {
      while (idx < urls.length) {
        var my = idx++, r = await fetchJson(urls[my]);
        if (!r.ok) { var e1 = new Error('HTTP ' + r.status); e1.status = r.status; throw e1; }
        pagesOut[my] = r.json || [];
      }
    }));
    return pagesOut.reduce(function (a, b) { return a.concat(b); }, first.json);
  }
  return first.json.concat(await getFrom(nx[1]));
}
async function getFrom(abs) {
  var out = [], next = abs, guard = 0;
  while (next && guard++ < 80) {
    var r = await fetchJson(next);
    if (!r.ok) { var e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
    if (!Array.isArray(r.json)) return r.json;
    out = out.concat(r.json);
    var mm = r.link.match(/<([^>]+)>;\s*rel="next"/);
    next = mm ? mm[1] : null;
  }
  return out;
}
/* GET that returns null instead of throwing. */
function soft(url) { return get(url).catch(function () { return null; }); }

function parse(iso) { if (!iso) return null; var d = new Date(iso); return isNaN(d) ? null : d; }
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function mondayOf(d) { var s = startOfDay(d); return addDays(s, -((s.getDay() + 6) % 7)); }
function dayKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function fromKey(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function fmtDay(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmtDayTime(d) { return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
function weekRange(mon) { var fri = addDays(mon, 4); return fmtDay(mon) + '–' + (fri.getMonth() === mon.getMonth() ? fri.getDate() : fmtDay(fri)); }
function isMidnight(d) { return d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0; }

/* Canvas's attendance tool (Roll Call) puts an undated assignment in every course. */
var ATTENDANCE = /^\s*roll call attendance\s*$/i;

/* Who a due date is for: the whole class, one section, or a few students.
   Some teachers assign to "19 students" (the whole class picked by name, often
   to leave out one student); half the class or more counts as the class. */
var CLASS_SIZE = 0;
function scopeOf(d) {
  if (d.base) return 'all';
  var t = (d.title || '').trim(), mm = t.match(/^(\d+) students?$/i);
  if (mm && CLASS_SIZE && +mm[1] >= CLASS_SIZE / 2) return 'all';
  if (d.set_type === 'ADHOC' || d.set_type === 'Group' || mm) return 'some';
  return 'section';
}
function datesOf(a) {
  if (a.all_dates && a.all_dates.length) return a.all_dates;
  return [{ base: true, due_at: a.due_at, lock_at: a.lock_at, unlock_at: a.unlock_at }];
}
/* Scored for a grade: worth points, not complete/incomplete, not "not graded", counts toward the final grade. */
function isScored(a) {
  return (a.points_possible || 0) > 0 && a.grading_type !== 'not_graded' && a.grading_type !== 'pass_fail' &&
    !a.omit_from_final_grade && (a.submission_types || []).indexOf('not_graded') < 0;
}
/* Counts toward the grade at all (includes complete/incomplete). */
function isGraded(a) {
  return (a.points_possible || 0) > 0 && a.grading_type !== 'not_graded' && !a.omit_from_final_grade && (a.submission_types || []).indexOf('not_graded') < 0;
}
/* Nothing to turn in in Canvas: paper, in class, or "no submission". */
function offline(a) {
  var t = a.submission_types || [];
  return !t.length || t.every(function (x) { return x === 'none' || x === 'on_paper' || x === 'not_graded'; });
}

/* ---------------- the checks ---------------- */
async function analyze(cid, now) {
  now = now || new Date();
  var C = '/api/v1/courses/' + cid;
  var course;
  try { course = await get(C + '?include[]=term&include[]=syllabus_body&include[]=total_students'); }
  catch (e) { e.where = 'course'; throw e; }

  /* Is this a class students take for a grade this semester? */
  var termName = (course.term && course.term.name) || '';
  var semester = /\b(1st|2nd)\s+semester\b/i.test(termName) && !/summer/i.test(termName) && !/^\s*x/i.test(termName);
  var termEnd = parse((course.restrict_enrollments_to_course_dates && course.end_at) || (course.term && course.term.end_at));
  var termStart = parse((course.restrict_enrollments_to_course_dates && course.start_at) || (course.term && course.term.start_at));
  /* Only classes students take for a grade this semester. Clubs, activities,
     PD and sandboxes live in other terms; IMPACT sits in the semester term. */
  var notClass = null;
  if (!semester) notClass = 'Raider Course Check is for classes students take for a grade. This course is in “' + (termName || 'no term') + '”, so it’s a club, activity, PD or practice course, and there’s nothing to check.';
  else if (/\bimpact\b/i.test(course.name || '')) notClass = 'Raider Course Check is for classes students take for a grade. IMPACT isn’t one, so there’s nothing to check.';
  else if (termEnd && termEnd < now) notClass = 'This class’s semester has ended, so there’s nothing to check. Open one of this semester’s classes.';
  if (notClass) return { version: VERSION, cid: cid, course: { id: course.id, name: course.name, term: termName }, notClass: notClass, results: [], skipped: true, checkedAt: now.toISOString() };
  CLASS_SIZE = course.total_students || 0;

  /* Submissions waiting to be graded: started now, read later. */
  var waitingP = Promise.all([
    get(C + '/students/submissions?student_ids[]=all&workflow_state=submitted&per_page=100'),
    get(C + '/students/submissions?student_ids[]=all&workflow_state=pending_review&per_page=100')
  ]);
  waitingP.catch(function () {});
  var all = await Promise.all([
    get(C + '/assignments?per_page=100&include[]=all_dates'),
    get(C + '/modules?per_page=100&include[]=items'),
    soft(C + '/tabs'),
    fetchJson(base + C + '/late_policy'),
    soft(C + '/pages?per_page=100&published=true&include[]=body'),
    soft(C + '/discussion_topics?per_page=100'),
    soft(C + '/quizzes?per_page=100'),
    soft(C + '/assignment_groups?per_page=100'),
    fetchJson(base + C + '/front_page'),
    soft(C + '/settings')
  ]);
  var assignments = all[0], modules = all[1], tabs = all[2], lpRes = all[3], pages = all[4] || [],
    topics = all[5] || [], quizzes = all[6] || [], groups = all[7] || [], front = all[8].ok ? all[8].json : null, settings = all[9] || {};
  for (var k = 0; k < modules.length; k++) {
    if (!modules[k].items && modules[k].items_count > 0) modules[k].items = await get(C + '/modules/' + modules[k].id + '/items?per_page=100');
  }

  var R = [];
  function add(o) { R.push(o); return o; }
  function aUrl(a) { return base + '/courses/' + cid + '/assignments/' + a.id; }
  function aLink(a, extra) { return '<a href="' + esc(aUrl(a)) + '" target="_blank" rel="noopener">' + esc(a.name) + '</a>' + (extra ? ' <span class="mu">' + esc(extra) + '</span>' : ''); }
  function aEdit(a, extra) { return '<a href="' + esc(aUrl(a) + '/edit') + '" target="_blank" rel="noopener">' + esc(a.name) + '</a>' + (extra ? ' <span class="mu">' + esc(extra) + '</span>' : ''); }
  function pLink(p) { return '<a href="' + esc(base + '/courses/' + cid + '/pages/' + p.url) + '" target="_blank" rel="noopener">' + esc(p.title) + '</a>'; }
  function ul(items, max) {
    max = max || 10;
    var h = '<ul>' + items.slice(0, max).map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>';
    if (items.length > max) h += '<div class="mu">…and ' + (items.length - max) + ' more.</div>';
    return h;
  }
  var MODS = base + '/courses/' + cid + '/modules';


  var pubAsg = assignments.filter(function (a) { return a.published && !ATTENDANCE.test(a.name || ''); });

  /* ============ REQUIRED 1: modules hold everything ============ */
  var pubMods = modules.filter(function (m) { return m.published; });
  var inMod = {};
  pubMods.forEach(function (mo) {
    (mo.items || []).forEach(function (it) {
      if (it.published === false) return;
      if (it.type === 'Assignment') inMod['A' + it.content_id] = 1;
      else if (it.type === 'Quiz') inMod['Q' + it.content_id] = 1;
      else if (it.type === 'Discussion') inMod['D' + it.content_id] = 1;
      else if (it.type === 'Page') inMod['P' + it.page_url] = 1;
    });
  });
  function asgInModule(a) {
    return inMod['A' + a.id] || (a.quiz_id && inMod['Q' + a.quiz_id]) || (a.discussion_topic && inMod['D' + a.discussion_topic.id]);
  }
  /* Pages students can reach: in a module, the home page, or linked (up to 3 links deep) from those or the syllabus. */
  var byUrl = {}; pages.forEach(function (p) { byUrl[p.url] = p; });
  var frontUrl = front && front.url;
  var reach = {}, queue = [];
  function linksIn(html) {
    var out = [], re = /\/pages\/([a-z0-9][a-z0-9\-%_.+]*)/gi, mm;
    while ((mm = re.exec(html || ''))) { try { out.push(decodeURIComponent(mm[1]).toLowerCase()); } catch (e) { out.push(mm[1].toLowerCase()); } }
    return out;
  }
  pages.forEach(function (p) { if (inMod['P' + p.url] || p.url === frontUrl) { reach[p.url] = 0; queue.push(p.url); } });
  linksIn(course.syllabus_body).concat(front ? linksIn(front.body) : []).forEach(function (u) { if (byUrl[u] && reach[u] == null) { reach[u] = 1; queue.push(u); } });
  while (queue.length) {
    var u = queue.shift(), p = byUrl[u];
    if (!p || reach[u] >= 3) continue;
    linksIn(p.body).forEach(function (v) { if (byUrl[v] && reach[v] == null) { reach[v] = reach[u] + 1; queue.push(v); } });
  }
  var loosePages = pages.filter(function (p) { return !inMod['P' + p.url] && p.url !== frontUrl; });
  var orphanPages = loosePages.filter(function (p) { return reach[p.url] == null; });
  var linkedPages = loosePages.filter(function (p) { return reach[p.url] != null; });

  var outA = pubAsg.filter(function (a) { return !asgInModule(a); });
  var mainOut = outA.filter(function (a) { return isGraded(a) && !offline(a); });
  var minorOut = outA.filter(function (a) { return !(isGraded(a) && !offline(a)); });
  function minorWhy(a) {
    if (!isGraded(a)) return (a.points_possible || 0) > 0 ? '(not graded)' : '(0 points)';
    var t = a.submission_types || [];
    if (t.indexOf('on_paper') >= 0) return '(on paper)';
    return '(nothing to turn in online)';
  }
  var outTopics = topics.filter(function (t) { return t.published && !t.assignment_id && !inMod['D' + t.id]; });
  var outQuizzes = quizzes.filter(function (q) { return q.published && (q.quiz_type === 'practice_quiz' || q.quiz_type === 'survey') && !inMod['Q' + q.id]; });
  var minorCount = minorOut.length + outTopics.length + outQuizzes.length + orphanPages.length;
  var MW = 'Every assignment, quiz, discussion and page lives inside a published module, so students find everything in one place.';
  var r1detail = '', r1more = '';
  if (mainOut.length) r1detail += '<div>In Modules, click <strong>+</strong> on the module and pick the item. A link on a page isn’t enough.</div>' + ul(mainOut.map(function (a) { return aLink(a); }));
  if (minorCount) {
    r1more += '<div>Ungraded work, paper work and pages. They still belong in the module for that day:</div>' +
      ul(minorOut.map(function (a) { return aLink(a, minorWhy(a)); })
        .concat(outTopics.map(function (t) { return '<a href="' + esc(t.html_url) + '" target="_blank" rel="noopener">' + esc(t.title) + '</a> <span class="mu">(discussion)</span>'; }))
        .concat(outQuizzes.map(function (q) { return '<a href="' + esc(q.html_url) + '" target="_blank" rel="noopener">' + esc(q.title) + '</a> <span class="mu">(' + (q.quiz_type === 'survey' ? 'survey' : 'practice quiz') + ')</span>'; }))
        .concat(orphanPages.map(function (p) { return pLink(p) + ' <span class="mu">(page; nothing links to it)</span>'; })), 12) +
      (orphanPages.length ? '<div class="mu">A page from an old version of the course? Unpublish it instead.</div>' : '');
  }
  if (linkedPages.length) r1more += '<div class="mu">' + plural(linkedPages.length, 'page') + ' outside modules ' + (linkedPages.length === 1 ? 'is' : 'are') + ' linked from your home page, syllabus or a module page, so students can reach ' + (linkedPages.length === 1 ? 'it' : 'them') + '. That’s fine.</div>';
  var anything = pubAsg.length + pages.length + topics.length;
  if (!anything) add({ key: 'mod', group: 'req', status: 'chk', name: 'Modules hold everything, in order', why: MW, result: 'Nothing is published yet.', fixHref: PD + 'module-setup', fixText: 'Module setup' });
  else if (mainOut.length) add({ key: 'mod', group: 'req', status: 'bad', name: 'Modules hold everything, in order', why: MW,
    result: plural(mainOut.length, 'graded item isn’t', 'graded items aren’t') + ' in a module.',
    detail: r1detail, more: r1more, moreLabel: minorCount ? 'Show ' + plural(minorCount, 'smaller item') : (linkedPages.length ? 'Pages outside modules' : ''), fixHref: MODS, fixText: 'Open my Modules' });
  else if (minorCount) add({ key: 'mod', group: 'req', status: 'warn', name: 'Modules hold everything, in order', why: MW,
    result: plural(minorCount, 'smaller item isn’t', 'smaller items aren’t') + ' in a module.',
    detail: r1more, fixHref: MODS, fixText: 'Open my Modules' });
  else add({ key: 'mod', group: 'req', status: 'ok', name: 'Modules hold everything, in order', why: MW, result: 'Everything students need is in a published module.', detail: r1detail });

  /* ============ REQUIRED 2: missing policy (automatic zero) ============ */
  var MPW = 'Missing work counts as a 0 automatically, so grades stay honest all term and families aren’t surprised at report-card time.';
  var MPFIX = PD + 'setting-up-our-automatic-missing-slash-late-policy-in-canvas';
  if (lpRes.status === 404 || (lpRes.ok && lpRes.json && lpRes.json.late_policy && !lpRes.json.late_policy.missing_submission_deduction_enabled)) {
    add({ key: 'missing', group: 'req', status: 'bad', name: 'Automatic zero for missing work', why: MPW, result: 'Off. Turn it on in the Gradebook.',
      detail: '<div>Gradebook → gear (Settings) → <strong>Late Policies</strong> → turn on <em>Automatically apply grade for missing submissions</em> and set it to 0%. Tell your classes before you turn it on.</div>',
      fixHref: MPFIX, fixText: 'How to set the policy' });
  } else if (lpRes.ok && lpRes.json && lpRes.json.late_policy) {
    var ded = Number(lpRes.json.late_policy.missing_submission_deduction);
    if (ded >= 100) add({ key: 'missing', group: 'req', status: 'ok', name: 'Automatic zero for missing work', why: MPW, result: 'On.' });
    else add({ key: 'missing', group: 'req', status: 'warn', name: 'Automatic zero for missing work', why: MPW,
      result: 'On, but missing work gets ' + Math.round(100 - ded) + '% instead of 0.',
      detail: '<div>The RJ expectation is an automatic zero for missing work. In Late Policies, set <em>Grade for missing submissions</em> to 0%. (Late penalties are a separate setting, decided by your level.)</div>',
      fixHref: MPFIX, fixText: 'How to set the policy' });
  } else add({ key: 'missing', group: 'req', status: 'chk', name: 'Automatic zero for missing work', why: MPW, result: 'Couldn’t read your late policy. Check Gradebook → gear → Late Policies yourself.', fixHref: MPFIX, fixText: 'How to set the policy' });

  /* ============ REQUIRED 3: due dates and grades in Canvas ============ */
  var graded = pubAsg.filter(isGraded);
  var DW = 'A due date puts the work on each student’s List View and To Do, where they plan their week. Paper work too (a No Submission assignment is fine).';
  var noDueAll = [], noDueSome = [];
  graded.forEach(function (a) {
    var ds = datesOf(a), missAll = false, missSome = false, who = [];
    ds.forEach(function (d) {
      if (d.due_at) return;
      var s = scopeOf(d);
      if (s === 'some') { missSome = true; who.push(d.title || 'some students'); }
      else { missAll = true; if (s === 'section') who.push(d.title); }
    });
    if (missAll) noDueAll.push(aEdit(a, who.length && ds.length > 1 ? '(no date for ' + who.filter(Boolean).join(', ') + ')' : ''));
    else if (missSome) noDueSome.push(aEdit(a, '(no date for ' + who.join(', ') + ')'));
  });
  var DFIX = PD + 'every-kind-of-work-on-the-students-list';
  if (!graded.length) add({ key: 'due', group: 'req', status: 'chk', name: 'Every graded item has a due date', why: DW, result: 'No published graded work yet.' });
  else if (noDueAll.length) add({ key: 'due', group: 'req', status: 'bad', name: 'Every graded item has a due date', why: DW,
    result: plural(noDueAll.length, 'graded item') + (noDueAll.length === 1 ? ' has' : ' have') + ' no due date' + (noDueSome.length ? ', and ' + noDueSome.length + ' more ' + (noDueSome.length === 1 ? 'is' : 'are') + ' missing one for a few students.' : '.'),
    detail: '<div>Open each one, click <strong>Edit</strong>, and add a due date. Work done on paper still gets one.</div>' + ul(noDueAll.concat(noDueSome)), fixHref: DFIX, fixText: 'Every kind of work, on the student’s list' });
  else if (noDueSome.length) add({ key: 'due', group: 'req', status: 'warn', name: 'Every graded item has a due date', why: DW,
    result: 'Every item has a due date for the class, but ' + plural(noDueSome.length, 'item has', 'items have') + ' a date for a few students with no due date.',
    detail: '<div>Usually an extension where the due date was left blank. Those students won’t see it on their list.</div>' + ul(noDueSome), fixHref: DFIX, fixText: 'Every kind of work, on the student’s list' });
  else add({ key: 'due', group: 'req', status: 'ok', name: 'Every graded item has a due date', why: DW, result: 'All ' + graded.length + ' have one.' });

  /* Dates that keep work off the list or make it late before students can turn it in. */
  var dBad = [], dWarn = [];
  var soon = now.getTime() + 3 * DAY, recent = now.getTime() - 14 * DAY, horizon = now.getTime() + 21 * DAY;
  assignments.forEach(function (a) {
    if (ATTENDANCE.test(a.name || '')) return;
    var ds = datesOf(a);
    if (!a.published) {
      if (!isGraded(a)) return;
      var close = ds.map(function (d) { return parse(d.due_at); }).filter(function (d) { return d && d.getTime() <= soon && d.getTime() >= recent; }).sort(function (x, y) { return x - y; })[0];
      if (close) dWarn.push(aEdit(a, close < now ? '(not published, and it was due ' + fmtDayTime(close) + ')' : '(not published, and it’s due ' + fmtDayTime(close) + ')'));
      return;
    }
    for (var i = 0; i < ds.length; i++) {
      var d = ds[i], due = parse(d.due_at), lock = parse(d.lock_at), open = parse(d.unlock_at);
      var who = scopeOf(d) !== 'all' && d.title ? ' for ' + d.title : '';
      if (due && lock && lock < due) { dBad.push(aEdit(a, '(locks ' + fmtDayTime(lock) + who + ', before it’s due ' + fmtDayTime(due) + ')')); return; }
      if (due && open && open > due) { dBad.push(aEdit(a, '(opens ' + fmtDayTime(open) + who + ', after it’s due ' + fmtDayTime(due) + ')')); return; }
    }
    if (termStart && termEnd && semester) {
      var outside = ds.filter(function (d) { return scopeOf(d) !== 'some'; }).map(function (d) { return parse(d.due_at); })
        .filter(function (d) { return d && (d.getTime() < termStart.getTime() - DAY || d.getTime() > termEnd.getTime() + DAY); })[0];
      if (outside) { dBad.push(aEdit(a, '(due ' + outside.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', outside this semester; often left over from copying a course)')); return; }
    }
    if (isGraded(a)) {
      var mid = ds.filter(function (d) { return scopeOf(d) !== 'some'; }).map(function (d) { return parse(d.due_at); })
        .filter(function (d) { return d && d > now && d.getTime() <= horizon && isMidnight(d); })[0];
      if (mid) { var nb = addDays(mid, -1); dWarn.push(aEdit(a, '(due 12:00 AM ' + fmtDay(mid) + ', the very start of ' + mid.toLocaleDateString('en-US', { weekday: 'long' }) + '. If you meant ' + nb.toLocaleDateString('en-US', { weekday: 'long' }) + ' night, 11:59 PM is clearer.)')); }
    }
  });
  var UW = 'A date that locks early, opens late or sits outside the semester makes work late before students can turn it in, or keeps it off their list.';
  if (dBad.length) add({ key: 'dates', group: 'req', status: 'bad', name: 'Due dates students can use', why: UW,
    result: plural(dBad.length, 'item has a date', 'items have dates') + ' that can’t work.',
    detail: '<div>Open each one, click <strong>Edit</strong>, and fix the dates under <em>Assign</em>:</div>' + ul(dBad), more: dWarn.length ? ul(dWarn) : '', moreLabel: dWarn.length ? 'Show ' + plural(dWarn.length, 'more to look at', 'more to look at') : '' });
  else if (dWarn.length) add({ key: 'dates', group: 'req', status: 'warn', name: 'Due dates students can use', why: UW,
    result: plural(dWarn.length, 'item') + ' worth a look.', detail: ul(dWarn) });
  else if (graded.length) add({ key: 'dates', group: 'req', status: 'ok', name: 'Due dates students can use', why: UW, result: 'Every date works.' });

  /* Grades kept up to date, and posted where students can see them. */
  var GW = 'Students and families see where they stand through each six-week grading period. A hidden grade is the same as no grade.';
  var GFIX = PD + 'set-up-your-gradebook';
  var gmap = {}; assignments.forEach(function (a) { gmap[a.id] = a; });
  try {
    var waiting = await waitingP;
    var wcut = now.getTime() - 14 * DAY, wl = {}, seen = {};
    waiting[0].concat(waiting[1]).forEach(function (s) {
      var a = gmap[s.assignment_id];
      if (!a || !isGraded(a) || s.excused || !s.submitted_at) return;
      var kk = s.assignment_id + ':' + s.user_id; if (seen[kk]) return; seen[kk] = 1;
      if (new Date(s.submitted_at).getTime() < wcut) wl[a.id] = (wl[a.id] || 0) + 1;
    });
    var hidden = {}, hcut7 = now.getTime() - 7 * DAY, hcut14 = now.getTime() - 14 * DAY, oldHidden = 0;
    var manual = graded.filter(function (a) { return a.post_manually; }).map(function (a) { return a.id; });
    if (manual.length) {
      var gsubs = [];
      for (var b = 0; b < manual.length; b += 40) {
        gsubs = gsubs.concat(await get(C + '/students/submissions?student_ids[]=all&workflow_state=graded&per_page=100&' + manual.slice(b, b + 40).map(function (x) { return 'assignment_ids[]=' + x; }).join('&')));
      }
      gsubs.forEach(function (s) {
        if (s.posted_at || s.excused || s.score == null) return;
        var at = parse(s.graded_at); if (!at || at.getTime() > hcut7) return;
        var h = hidden[s.assignment_id] || (hidden[s.assignment_id] = { n: 0, oldest: at });
        h.n++; if (at < h.oldest) h.oldest = at;
      });
      /* Red only when several grades on one item have been hidden over two weeks; one or two is worth a look. */
      Object.keys(hidden).forEach(function (id) { if (hidden[id].oldest.getTime() < hcut14 && hidden[id].n >= 3) oldHidden++; });
    }
    var wList = Object.keys(wl).map(function (id) { return { a: gmap[id], n: wl[id] }; }).sort(function (x, y) { return y.n - x.n; });
    var hList = Object.keys(hidden).map(function (id) { return { a: gmap[id], h: hidden[id] }; }).sort(function (x, y) { return x.h.oldest - y.h.oldest; });
    var gd = '';
    if (hList.length) gd += '<div><strong>Graded but hidden from students</strong> (posting is set to manual). Open the assignment in the Gradebook, click <strong>⋮</strong>, then <strong>Post grades</strong>:</div>' +
      ul(hList.map(function (x) { return '<a href="' + esc(base + '/courses/' + cid + '/gradebook') + '" target="_blank" rel="noopener">' + esc(x.a.name) + '</a> <span class="mu">(' + plural(x.h.n, 'grade') + ', hidden since ' + fmtDay(x.h.oldest) + ')</span>'; }));
    if (wList.length) gd += '<div><strong>Turned in over two weeks ago, not graded yet:</strong></div>' +
      ul(wList.map(function (w) { return '<a href="' + esc(base + '/courses/' + cid + '/gradebook/speed_grader?assignment_id=' + w.a.id) + '" target="_blank" rel="noopener">' + esc(w.a.name) + '</a> <span class="mu">(' + w.n + ' waiting)</span>'; })) +
      '<div class="mu">Graded on paper and entered later? Then this is just a reminder to enter the scores.</div>';
    var gr = [];
    if (hList.length) gr.push(plural(hList.length, 'item has', 'items have') + ' grades hidden from students for over a week');
    if (wList.length) gr.push(plural(wList.length, 'item has', 'items have') + ' work waiting more than two weeks for a grade');
    if (!gr.length) add({ key: 'grades', group: 'req', status: 'ok', name: 'Grades kept up to date, and posted', why: GW, result: 'Nothing waiting, nothing hidden.' });
    else add({ key: 'grades', group: 'req', status: oldHidden ? 'bad' : 'warn', name: 'Grades kept up to date, and posted', why: GW,
      result: gr.join('; ') + '.', detail: gd, fixHref: GFIX, fixText: 'Set up your gradebook' });
  } catch (e) {
    add({ key: 'grades', group: 'req', status: 'chk', name: 'Grades kept up to date, and posted', why: GW, result: 'Couldn’t read submissions. Check your Gradebook yourself.', fixHref: GFIX, fixText: 'Set up your gradebook' });
  }

  /* The gradebook does the math you mean (Canvas is the single source of truth for grades). */
  var mBad = [], mWarn = [];
  var weighted = !!course.apply_assignment_group_weights;
  var AIX = base + '/courses/' + cid + '/assignments';
  /* Weights only matter once the class has graded work in Canvas. */
  if (weighted && groups.length && graded.length) {
    var tot = groups.reduce(function (s, g) { return s + (g.group_weight || 0); }, 0);
    if (tot === 0) mBad.push('<a href="' + esc(AIX) + '" target="_blank" rel="noopener">Assignment group weights</a> <span class="mu">(“Weight final grade based on assignment groups” is on, but every group is set to 0%. Set the weights, or turn weighting off.)</span>');
    else if (Math.abs(tot - 100) > 0.05) mBad.push('<a href="' + esc(AIX) + '" target="_blank" rel="noopener">Assignment group weights</a> <span class="mu">(add up to ' + Math.round(tot * 100) / 100 + '%, not 100%' + (tot < 100 ? '; Canvas scales them up, so each group counts for more than it says)' : '; grades can come out higher than they should)') + '</span>');
    groups.forEach(function (g) {
      if ((g.group_weight || 0) !== 0) return;
      var n = graded.filter(function (a) { return String(a.assignment_group_id) === String(g.id); }).length;
      if (n) mWarn.push('<a href="' + esc(AIX) + '" target="_blank" rel="noopener">' + esc(g.name) + '</a> <span class="mu">(weighted 0%, so its ' + plural(n, 'graded item') + (n === 1 ? ' doesn’t' : ' don’t') + ' count)</span>');
    });
  }
  if (!weighted && groups.length > 1 && graded.length) {
    var wsum = groups.reduce(function (s, g) { return s + (g.group_weight || 0); }, 0);
    if (wsum > 0) mWarn.push('<a href="' + esc(AIX) + '" target="_blank" rel="noopener">Assignment group weights</a> <span class="mu">(your groups have weights, but “Weight final grade based on assignment groups” is off, so Canvas grades by total points. Fine if they’re leftovers from a copied course.)</span>');
  }
  pubAsg.forEach(function (a) {
    var rp = a.rubric_settings && a.rubric_settings.points_possible, pts = a.points_possible || 0;
    /* Many teachers type the score and never fill in the rubric, so a mismatch is only worth a look. */
    if (a.use_rubric_for_grading && typeof rp === 'number' && rp > 0 && pts > 0 && Math.abs(rp - pts) > 0.001)
      mWarn.push(aEdit(a, '(the rubric adds up to ' + rp + ' points but the assignment is worth ' + pts + '. If you score with the rubric, a perfect score shows as ' + rp + ' out of ' + pts + '.)'));
    if (a.omit_from_final_grade && a.grading_type !== 'not_graded' && pts > 0)
      mWarn.push(aEdit(a, '(worth ' + pts + ' points, but set not to count toward the final grade)'));
  });
  var byName = {};
  pubAsg.forEach(function (a) { var kk = (a.name || '').trim().toLowerCase().replace(/\s+/g, ' '); if (kk) (byName[kk] = byName[kk] || []).push(a); });
  Object.keys(byName).forEach(function (kk) { if (byName[kk].length > 1) mWarn.push(aLink(byName[kk][0], '(' + byName[kk].length + ' published assignments have this name; students can turn work in to the wrong one)')); });
  var MW2 = 'Canvas is the single source of truth for grades, so the setup behind the number has to do the math you mean.';
  if (mBad.length) add({ key: 'math', group: 'req', status: 'bad', name: 'The gradebook does the math you mean', why: MW2,
    result: plural(mBad.length, 'setting makes', 'settings make') + ' grades come out wrong.',
    detail: ul(mBad), more: mWarn.length ? ul(mWarn) : '', moreLabel: mWarn.length ? 'Show ' + plural(mWarn.length, 'more to look at', 'more to look at') : '', fixHref: GFIX, fixText: 'Set up your gradebook' });
  else if (mWarn.length) add({ key: 'math', group: 'req', status: 'warn', name: 'The gradebook does the math you mean', why: MW2,
    result: plural(mWarn.length, 'thing', 'things') + ' worth a look.', detail: ul(mWarn), fixHref: GFIX, fixText: 'Set up your gradebook' });
  else if (graded.length) add({ key: 'math', group: 'req', status: 'ok', name: 'The gradebook does the math you mean', why: MW2,
    result: weighted ? 'Weights add up to 100%.' : 'Nothing that skews a grade.' });

  /* ============ REQUIRED 4 + 5, EXPECTED 2: things only the teacher can confirm ============ */
  var aiHits = [];
  var AIRE = /\b(A\.?I\.?|artificial intelligence|chat ?gpt|generative)\b/;
  var POLRE = /polic|guideline|expectation|integrity|use of|acceptable/i;
  function textOf(html) { return String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' '); }
  if (AIRE.test(textOf(course.syllabus_body)) && POLRE.test(textOf(course.syllabus_body))) aiHits.push('<a href="' + esc(base + '/courses/' + cid + '/assignments/syllabus') + '" target="_blank" rel="noopener">Syllabus</a>');
  pages.forEach(function (p) {
    var t = textOf(p.body);
    if ((AIRE.test(p.title) && POLRE.test(p.title)) || (/syllabus/i.test(p.title) && AIRE.test(t)) || (AIRE.test(t) && /\bAI policy\b|policy on (the use of )?(AI|artificial)/i.test(t))) aiHits.push(pLink(p));
  });
  add({ key: 'ai', group: 'req', self: true, name: 'A written AI policy in your syllabus', why: 'Where AI helps a student and where it gets in the way, said plainly at the start of the term. Your syllabus can be a Canvas page, a file or a handout.',
    result: 'Only you can confirm this one. Your syllabus can be a handout, so the checker can’t rule it out.',
    detail: (aiHits.length ? '<div>These look like they mention it:</div>' + ul(aiHits.slice(0, 4)) : ''),
    yes: 'I have one', fixHref: PD + 'write-your-course-ai-policy', fixText: 'Write your course AI policy' });

  var timed = quizzes.filter(function (q) { return q.published && q.time_limit; }).length;
  var nq = pubAsg.filter(function (a) { return a.is_quiz_lti_assignment; }).length;
  add({ key: 'acc', group: 'req', self: true, name: 'Accommodation plans set up ahead', why: 'Extended time set once in Moderate (New Quizzes) or on every Classic quiz, before the student has to ask.',
    result: 'Only you can confirm this one: Canvas doesn’t say which students have a plan.',
    detail: (timed || nq ? '<div>This class has ' + [timed ? plural(timed, 'timed Classic quiz', 'timed Classic quizzes') : '', nq ? plural(nq, 'New Quiz', 'New Quizzes') : ''].filter(Boolean).join(' and ') + '.</div>' : ''),
    yes: 'They’re set up', fixHref: PD + 'extended-time-the-five-minute-reference', fixText: 'Extended time: the five-minute reference' });

  /* ============ EXPECTED 1: one graded item a week ============ */
  var cal = null, tm = termName.match(/(\d{4}\/\d{4}).*?\b(1st|2nd)\s+semester/i);
  if (tm) cal = CAL[tm[1] + ' ' + tm[2].toLowerCase()] || null;
  function weekDates(a) {
    return datesOf(a).filter(function (d) { return scopeOf(d) !== 'some'; }).map(function (d) { return parse(d.due_at); }).filter(Boolean);
  }
  var scoredDates = [];
  pubAsg.forEach(function (a) { if (isScored(a)) scoredDates = scoredDates.concat(weekDates(a)); });
  var weeks = null;
  if (semester) {
    var firstMon = null, lastMon = null, calNote = '';
    if (cal) { firstMon = fromKey(cal.first); lastMon = fromKey(cal.last); calNote = cal.firstNote || ''; }
    else if (scoredDates.length) {
      firstMon = addDays(mondayOf(new Date(Math.min.apply(null, scoredDates))), 7);
      calNote = 'School breaks for this semester aren’t loaded in the checker yet. If a week is empty because of a break, mark it below.';
    }
    if (firstMon) {
      weeks = { note: calNote, list: [] };
      var thisMon = mondayOf(now);
      for (var w = new Date(firstMon); w <= thisMon && (!lastMon || w <= lastMon); w = addDays(w, 7)) {
        var key = dayKey(w), end = addDays(w, 7), special = cal && cal.weeks[key];
        var wk = { key: key, label: fmtDay(w), range: weekRange(w), kind: special ? (special.off ? 'off' : 'short') : (w.getTime() === thisMon.getTime() ? 'now' : 'normal'), note: special ? (special.off || special.short) : '', scored: [], other: [] };
        if (w.getTime() === thisMon.getTime() && wk.kind === 'short') wk.now = true;
        pubAsg.forEach(function (a) {
          var hit = weekDates(a).some(function (d) { return d >= w && d < end; });
          if (!hit) return;
          if (isScored(a)) wk.scored.push(a.name);
          else wk.other.push(a.name + (a.grading_type === 'pass_fail' ? ' (complete/incomplete)' : !(a.points_possible > 0) ? ' (0 points)' : ' (not graded)'));
        });
        weeks.list.push(wk);
      }
    }
  }
  if (weeks && noDueAll.length) weeks.undated = noDueAll.length;
  add({ key: 'weekly', group: 'exp', weekly: true, name: 'One graded item a week', why: 'Every week, at least one grade goes into the gradebook, and it’s something you actually assess, not a completion check.', weeks: weeks,
    fixHref: PD + 'should-this-be-graded', fixText: 'Should this be graded?' });

  add({ key: 'own', group: 'exp', self: true, name: 'You assess every submission yourself', why: 'AI doesn’t grade, and it doesn’t plan and deliver a whole lesson without you. If you use AI in your class, tell students and parents how.',
    result: 'Only you can confirm this one.', yes: 'I do', fixHref: PD + 'integrity-in-our-work-ai-in-grading-and-feedback', fixText: 'AI in grading and feedback' });

  /* ============ ONE ROUTE FOR STUDENTS (One Route page) ============ */
  var ROUTE = PD + 'one-route-for-students-pick-your-modules-pattern';
  var SIX = { assignments: 1, quizzes: 1, files: 1, pages: 1, discussions: 1, people: 1 };
  if (tabs && tabs.length) {
    var showing = tabs.filter(function (t) { return SIX[t.id] && !t.hidden && t.visibility !== 'admins' && t.visibility !== 'none'; });
    var modsOk = R.filter(function (r) { return r.key === 'mod'; })[0];
    var TW = 'Students see a short menu (Home, Modules, Grades, plus any tool you use), so there’s one place to look. Hiding a menu link doesn’t delete or lock anything.';
    if (!showing.length) add({ key: 'menu', group: 'route', status: 'ok', name: 'A short menu: one route', why: TW, result: 'Students see the short menu.' });
    else if (modsOk && modsOk.status === 'bad') add({ key: 'menu', group: 'route', status: 'chk', name: 'A short menu: one route', why: TW,
      result: 'After modules are done, hide ' + showing.map(function (t) { return t.label; }).join(', ') + '.',
      detail: '<div>If an item isn’t in a module, hiding its menu link leaves students no way to browse to it. Finish the modules item above first.</div>', fixHref: ROUTE + '#steps', fixText: 'One route: 3 steps' });
    else add({ key: 'menu', group: 'route', status: 'warn', name: 'A short menu: one route', why: TW,
      result: 'Hide ' + showing.map(function (t) { return t.label; }).join(', ') + '.',
      detail: '<div><strong>Settings → Navigation</strong>. Beside each one, click <strong>⋮</strong>, then <strong>Disable</strong>. Click <strong>Save</strong> at the bottom. Items still open from Modules, from links and from each student’s List View and To Do.</div>' +
        (showing.some(function (t) { return t.id === 'files'; }) ? '<div class="mu">Answer keys or old tests in Files? Hiding the menu link doesn’t protect them. Unpublish those files.</div>' : ''),
      fixHref: ROUTE + '#steps', fixText: 'One route: 3 steps' });
  }

  var MON = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|ene|abr|ago|dic|janv|févr|avr|mai|juin|juil|août|déc)';
  var dateRe = new RegExp('\\b' + MON + '[a-zéû]*\\.?\\s*\\d|\\b\\d{1,2}\\s+(de\\s+)?' + MON + '|\\b\\d{1,2}\\/\\d{1,2}\\b|\\b(mon|tue|tues|wed|thu|thur|thurs|fri|monday|tuesday|wednesday|thursday|friday|lunes|martes|miércoles|jueves|viernes|lundi|mardi|mercredi|jeudi|vendredi)\\b', 'i');
  var workMods = pubMods.filter(function (mo) { return (mo.items || []).some(function (it) { return it.published !== false && (it.type === 'Assignment' || it.type === 'Quiz' || it.type === 'Discussion'); }); });
  if (workMods.length) {
    var undated = workMods.filter(function (mo) {
      if (dateRe.test(mo.name)) return false;
      return !(mo.items || []).some(function (it) { return (it.type === 'SubHeader' || it.type === 'Page') && dateRe.test(it.title || ''); });
    });
    var DTW = 'An absent student opens Modules, finds the date they missed, and sees the notes, the work and when it’s due.';
    if (!undated.length) add({ key: 'dated', group: 'route', status: 'ok', name: 'Each class or week has its date on it', why: DTW, result: 'Every module shows its dates.' });
    else add({ key: 'dated', group: 'route', status: 'chk', name: 'Each class or week has its date on it', why: DTW,
      result: undated.length + ' of ' + workMods.length + ' modules show no date.',
      detail: '<div>Put the date where students look: in the module name (“Week 10: Oct 20–23”), or a text header or page for each class (“Tue 10/20 (R) · Wed 10/21 (W)”). The checker can miss a date written another way, so look before you change anything.</div>' + ul(undated.map(function (mo) { return esc(mo.name); })),
      fixHref: ROUTE, fixText: 'Pick your modules pattern' });
  }

  var emptyMods = pubMods.filter(function (mo) { return !(mo.items || []).some(function (it) { return it.published !== false && it.type !== 'SubHeader'; }); });
  if (emptyMods.length) add({ key: 'empty', group: 'route', status: 'warn', name: 'No empty modules', why: 'An empty module looks like missing work to a student.',
    result: plural(emptyMods.length, 'module is', 'modules are') + ' empty.',
    detail: ul(emptyMods.map(function (mo) { return esc(mo.name); })) + '<div>Fill it, or unpublish it until it’s ready.</div>', fixHref: MODS, fixText: 'Open my Modules' });
  else if (pubMods.length) add({ key: 'empty', group: 'route', status: 'ok', name: 'No empty modules', why: 'An empty module looks like missing work to a student.', result: 'None empty.' });

  /* ============ NEXT STEP on the PD ladder ============ */
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
  var ladder = { verbShare: verbShare, usesHeaders: usesHeaders, usesOrder: usesOrder, usesMinScore: usesMinScore, withRubric: withRubric, graded: graded.length, rubricShare: rubricShare, mastery: !!(settings && settings.conditional_release) };

  return { version: VERSION, cid: cid, course: { id: course.id, name: course.name, term: termName, students: course.total_students }, notClass: notClass, results: R, ladder: ladder, checkedAt: now.toISOString() };
}

/* ---------------- statuses that depend on the teacher's own ticks ---------------- */
function storeKey(cid) { return 'rjCourseCheck:v2:' + cid; }
function loadStore(cid) { try { var s = JSON.parse(localStorage.getItem(storeKey(cid)) || '{}'); s.self = s.self || {}; s.wk = s.wk || {}; return s; } catch (e) { return { self: {}, wk: {} }; } }
function saveStore(cid, s) { try { localStorage.setItem(storeKey(cid), JSON.stringify(s)); } catch (e) {} }

/* Fill in status/result for self-checks and the weekly row. */
function evaluate(data, store) {
  store = store || { self: {}, wk: {} };
  if (data.skipped) return data;
  data.results.forEach(function (r) {
    if (r.self) {
      var when = store.self[r.key];
      r.status = when ? 'ok' : 'chk';
      r.done = when || null;
    }
    if (r.weekly) {
      var W = r.weeks;
      if (!W || !W.list.length) { r.status = 'chk'; r.result = 'Not enough of the semester has gone by to check yet.'; return; }
      var counted = 0, hit = 0, gaps = [], excused = 0;
      W.list.forEach(function (wk) {
        wk.state = null;
        if (wk.kind === 'off') { wk.state = 'off'; return; }
        if (wk.scored.length) { wk.state = 'ok'; if (wk.kind !== 'now') { counted++; hit++; } return; }
        if (wk.kind === 'now' || wk.now) { wk.state = 'now'; return; }
        if (wk.kind === 'short') { wk.state = 'short'; return; }
        if (store.wk[wk.key]) { wk.state = 'exc'; excused++; return; }
        wk.state = 'gap'; counted++; gaps.push(wk);
      });
      r.gaps = gaps;
      var exNote = excused ? ' Not counting ' + plural(excused, 'week') + ' you marked as having a reason.' : '';
      if (!counted) { r.status = 'chk'; r.result = 'No full week of classes has finished yet.' + exNote; }
      else if (!gaps.length) { r.status = 'ok'; r.result = 'Every week so far.'; }
      else {
        r.status = 'warn';
        var g = gaps[0];
        var why1 = g.other.length ? 'only ' + plural(g.other.length, 'ungraded or completion item') + ' ' + (g.other.length === 1 ? 'was' : 'were') + ' due' : 'nothing was due';
        r.result = plural(gaps.length, 'week', 'weeks') + ' with nothing graded due' + (gaps.length === 1 ? ' (' + g.range + ', ' + why1 + ').' : '.');
      }
    }
  });
  return data;
}

/* ---------------- panel ---------------- */
var CSS = [
'#ID{--ink:#1a1a1a;--ink2:#444;--mute:#6E6A64;--bg:#fff;--panel:#f7f7f4;--line:#e2e2dd;--char:#2a2a2a;--red:#C11430;--ok:#1e7a3c;--warn:#a15c00;--bad:#C11430;--chk:#2a5fa8;--offbg:#ecebe7;',
'--okbg:#e8f3ec;--warnbg:#fbf0e1;--badbg:#fbe7ea;--chkbg:#e7eef8;',
'position:fixed;top:0;right:0;bottom:0;width:min(560px,100vw);z-index:2147483000;background:var(--bg);color:var(--ink);',
'box-shadow:-6px 0 30px rgba(0,0,0,.25);overflow:auto;font:15px/1.45 "Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif;text-align:left}',
'@media (prefers-color-scheme:dark){#ID{--ink:#f2f1ee;--ink2:#cfcdc7;--mute:#a6a29b;--bg:#15161a;--panel:#1d1f24;--line:#35353c;--ok:#5fd08a;--warn:#f0b04a;--bad:#ff6b80;--chk:#8bb6ff;--offbg:#2a2b30;--okbg:#17291f;--warnbg:#2e2414;--badbg:#33171c;--chkbg:#172238}}',
'#ID *{box-sizing:border-box}',
'#ID .hd{background:var(--char);color:#fff;padding:12px 16px;border-bottom:5px solid var(--red);position:sticky;top:0;z-index:2}',
'#ID .hd .t{font-size:17px;font-weight:700}',
'#ID .hd .s{font-size:12px;color:#cfcfcf;margin-top:1px}',
'#ID .hd button{position:absolute;top:10px;background:none;border:1px solid #777;color:#fff;border-radius:6px;padding:3px 10px;cursor:pointer;font-size:14px}',
'#ID .hd .x{right:12px} #ID .hd .p{right:56px}',
'#ID .bd{padding:12px 16px 40px}',
'#ID .cname{font-size:16px;font-weight:700;margin:0 0 8px}',
'#ID .tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0 0 6px}',
'#ID .tile{border:0;border-radius:9px;padding:8px 6px 7px;cursor:pointer;text-align:center;font:inherit;color:var(--ink);display:flex;flex-direction:column;align-items:center;gap:3px}',
'#ID .tile .ti{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px}',
'#ID .tile .tl{font-size:12.5px;font-weight:600;line-height:1.2}',
'#ID .tile.ok{background:var(--okbg)} #ID .tile.warn{background:var(--warnbg)} #ID .tile.bad{background:var(--badbg)} #ID .tile.chk{background:var(--chkbg)}',
'#ID .ok .ic,#ID .ok .ti{background:var(--ok)} #ID .warn .ic,#ID .warn .ti{background:var(--warn)} #ID .bad .ic,#ID .bad .ti{background:var(--bad)} #ID .chk .ic,#ID .chk .ti{background:var(--chk)}',
'#ID .tile:hover{outline:2px solid var(--line)}',
'#ID .when{font-size:12px;color:var(--mute);margin:2px 0 4px}',
'#ID h3{font-size:12px;letter-spacing:.1em;text-transform:uppercase;margin:18px 0 6px;display:flex;align-items:center;gap:7px}',
'#ID h3.bad{color:var(--bad)} #ID h3.warn{color:var(--warn)} #ID h3.chk{color:var(--chk)} #ID h3.ok{color:var(--ok)}',
'#ID .row{border:1px solid var(--line);border-radius:9px;margin:0 0 6px;background:var(--panel)}',
'#ID .row>summary{list-style:none;cursor:pointer;display:flex;gap:10px;align-items:center;padding:8px 11px}',
'#ID .row>summary::-webkit-details-marker{display:none}',
'#ID .ic{flex:0 0 22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px}',
'#ID .txt{flex:1;min-width:0}',
'#ID .nm{font-weight:700;color:var(--ink);font-size:14.5px}',
'#ID .res{font-size:13px;color:var(--ink2)}',
'#ID .bad .res{color:var(--bad)} #ID .warn .res{color:var(--warn)}',
'#ID .tag{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);border:1px solid var(--line);border-radius:4px;padding:0 5px;margin-left:6px;font-weight:600;vertical-align:1px}',
'#ID .chev{color:var(--mute);font-size:12px}',
'#ID details[open]>summary .chev{transform:rotate(90deg)}',
'#ID .det{padding:0 12px 10px 43px;font-size:13.5px;color:var(--ink2)}',
'#ID .det .why{color:var(--mute);font-size:12.5px;margin:0 0 6px}',
'#ID .det ul{margin:4px 0 8px;padding-left:18px} #ID .det li{margin:2px 0}',
'#ID .more>summary{cursor:pointer;color:var(--chk);font-size:13px;margin:2px 0}',
'#ID .mu{color:var(--mute)}',
'#ID a{color:var(--chk)}',
'#ID .fix{display:inline-block;margin-top:4px;font-weight:700}',
'#ID .note{font-size:12px;color:var(--mute);margin-top:18px}',
'#ID .banner{border:1px solid var(--warn);border-radius:9px;padding:8px 11px;margin:8px 0 0;font-size:13px;color:var(--ink)}',
'#ID .teams{display:inline-block;background:#5B5FC7;color:#fff!important;text-decoration:none;border-radius:5px;padding:4px 11px;font-weight:700}',
'#ID .load{padding:30px 0;color:var(--ink2)}',
'#ID .yes{flex:0 0 auto;background:var(--ok);color:#fff;border:0;border-radius:6px;padding:5px 11px;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap}',
'#ID .undo{background:none;border:0;color:var(--chk);text-decoration:underline;cursor:pointer;font-size:12.5px;padding:0}',
'#ID .strip{display:flex;flex-wrap:wrap;gap:3px;margin:2px 0 4px 43px}',
'#ID .wk{width:38px;border:1px solid var(--line);border-radius:5px;text-align:center;padding:2px 0 1px;background:var(--bg)}',
'#ID .wk b{display:block;font-size:13.5px;line-height:1.2} #ID .wk span{display:block;font-size:9.5px;color:var(--mute)}',
'#ID .wk.ok b{color:var(--ok)} #ID .wk.gap{border-color:var(--warn);background:var(--warnbg)} #ID .wk.gap b{color:var(--warn)}',
'#ID .wk.off,#ID .wk.short,#ID .wk.exc{background:var(--offbg)} #ID .wk.off b,#ID .wk.short b,#ID .wk.exc b{color:var(--mute)}',
'#ID .wk.now{border-style:dashed}',
'#ID .gap-row{border-top:1px solid var(--line);padding:6px 0}',
'#ID .gap-row label{display:flex;gap:7px;align-items:center;margin-top:3px;color:var(--ink)}',
'#ID .donel{margin:0;padding:0;list-style:none} #ID .donel li{display:flex;gap:8px;align-items:center;padding:3px 0;font-size:13.5px} #ID .donel .ic{flex-basis:18px;height:18px;font-size:11px}',
'#ID .next{border-left:5px solid var(--ok);background:var(--panel);border-radius:0 9px 9px 0;padding:9px 12px;margin:14px 0 4px;font-size:13.5px}',
'@media print{body>*:not(#ID){display:none!important}#ID{position:static;width:auto;box-shadow:none;overflow:visible}#ID .hd{position:static}#ID .hd button,#ID .yes,#ID .undo{display:none}#ID details{break-inside:avoid}}'
].join('\n').replace(/#ID/g, '#' + ID);

var ICON = { ok: '✓', warn: '!', bad: '✕', chk: '?' };
var LABEL = { ok: 'Done', warn: 'Worth a look', bad: 'Needs a fix', chk: 'Check yourself' };
/* The tile word for each check: what a teacher scans for. */
var TILE = { mod: 'Modules', missing: 'Zero for missing', due: 'Due dates', dates: 'Usable dates', grades: 'Grades posted', math: 'Gradebook math',
  ai: 'AI policy', acc: 'Accommodations', weekly: 'Graded weekly', own: 'You grade it', menu: 'Short menu', dated: 'Dated classes', empty: 'No empty modules' };
var TAG = { req: 'Required', exp: 'Expected', route: 'Recommended' };
var BASELINE = PD + 'what-every-course-must-have-the-rj-baseline';

function nextStep(data) {
  var L = data.ladder;
  var enh = [];
  if (L.verbShare < 0.5) enh.push('Start each title with what students do: READ, DO, REFLECT, SHOW.');
  if (!L.usesHeaders) enh.push('Add a text header for each lesson inside your modules.');
  if (!L.usesOrder) enh.push('Make students go in order where the order matters.');
  if (enh.length >= 2) return { level: 'Enhance', color: '#2a6ebb', tip: enh[0], link: [PD + 'build-a-week-an-ipp-module-stage-by-stage', 'Build a Week, Stage by Stage'] };
  if (!L.usesMinScore) return { level: 'Deepen', color: '#2e7d32', tip: 'Add a short check students pass to move on (8 of 10), with retakes.', link: [PD + 'two-things-called-mastery', 'Two Things Called Mastery'] };
  if (L.rubricShare < 0.25) return { level: 'Deepen', color: '#2e7d32', tip: 'Put a rubric on your bigger assignments.', link: [PD + 'quiz-data-coach-reading-your-own-numbers', 'Reading Your Own Quiz Numbers'] };
  return { level: 'Innovate', color: '#7b3fa0', tip: 'Let a score on one check send each student to the next step that fits them.', link: [PD + 'mastery-paths-step-by-step-each-student-gets-the-next-step-that-fits', 'Mastery Paths, Step by Step'] };
}

function strip(r) {
  var W = r.weeks;
  if (!W || !W.list.length) return '';
  return '<div class="strip" title="Each box is a week; the number is graded items due">' + W.list.map(function (wk) {
    var n = wk.scored.length, title = 'Week of ' + wk.range + ': ' + (wk.state === 'off' ? wk.note : plural(n, 'graded item') + ' due' + (wk.note ? ' (' + wk.note + ')' : '') + (wk.state === 'exc' ? ' (you marked a reason)' : ''));
    return '<div class="wk ' + wk.state + '" title="' + esc(title) + '"><b>' + (wk.state === 'off' ? '–' : n) + '</b><span>' + esc(wk.label) + '</span></div>';
  }).join('') + '</div>';
}
function weeklyDetail(r) {
  var W = r.weeks;
  if (!W || !W.list.length) return '';
  var h = '<div class="mu" style="font-size:12.5px">Each box is a week with the number of graded items due. Grey: a break' + (W.list.some(function (w) { return w.state === 'exc'; }) ? ' or a week you marked' : '') + '. Dashed: this week.</div>';
  if (W.undated) h += '<div class="mu" style="font-size:12.5px">' + plural(W.undated, 'graded item has', 'graded items have') + ' no due date, so ' + (W.undated === 1 ? 'it isn’t' : 'they aren’t') + ' counted in any week yet.</div>';
  if (r.gaps && r.gaps.length) {
    h += r.gaps.map(function (g) {
      return '<div class="gap-row"><strong>' + esc(g.range) + '</strong>: ' +
        (g.other.length ? 'only ' + plural(g.other.length, 'complete/incomplete or 0-point item') + ' due.' : 'nothing due.') +
        '<label><input type="checkbox" data-wk="' + esc(g.key) + '"> This week had a reason (retreat, immersion, testing)</label></div>';
    }).join('');
  }
  var ex = W.list.filter(function (w) { return w.state === 'exc'; });
  if (ex.length) h += '<div class="gap-row mu">Marked: ' + ex.map(function (w) { return esc(w.range) + ' <button class="undo" type="button" data-unwk="' + esc(w.key) + '">undo</button>'; }).join(', ') + '</div>';
  return h;
}

function render(box, data, store) {
  var body = box.querySelector('.bd');
  if (data.skipped) { body.innerHTML = '<div class="cname">' + esc(data.course.name) + '</div><p class="load" style="padding-top:6px">' + esc(data.notClass) + '</p><p class="note">Questions? <a class="teams" href="' + TEAMS + '" target="_blank" rel="noopener">Teams Jason Beyer</a></p>'; return; }
  evaluate(data, store);
  var rs = data.results;
  var h = '<div class="cname">' + esc(data.course.name) + '</div>';
  /* Scorecard: one tile per check, in the Baseline's order. */
  h += '<div class="tiles">' + rs.map(function (r) {
    return '<button class="tile ' + r.status + '" type="button" data-go="' + esc(r.key) + '" title="' + esc(LABEL[r.status] + ': ' + r.name) + '"><span class="ti">' + ICON[r.status] + '</span><span class="tl">' + esc(TILE[r.key] || r.name) + '</span></button>';
  }).join('') + '</div>';
  h += '<div class="when">Checked ' + new Date(data.checkedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + '. Click a tile or a row for details.</div>';
  if (!data.course.students) h += '<div class="banner">No students are enrolled yet, so some checks have nothing to look at.</div>';

  function row(r, open) {
    var detail = '';
    if (r.weekly) detail = weeklyDetail(r);
    else {
      detail = '<div class="why">' + esc(r.why) + '</div>' + (r.detail || '');
      if (r.more) detail += '<details class="more"><summary>' + esc(r.moreLabel || 'Show more') + '</summary>' + r.more + '</details>';
    }
    if (r.self && r.done) detail = '<div>Marked done on ' + esc(fmtDay(new Date(r.done))) + '. <button class="undo" type="button" data-unself="' + esc(r.key) + '">Undo</button></div>';
    if (r.fixHref && !(r.self && r.done)) detail += '<div><a class="fix" href="' + esc(r.fixHref) + '" target="_blank" rel="noopener">' + esc(r.fixText) + ' →</a></div>';
    var res = r.self ? (r.done ? 'You confirmed this.' : 'Only you can confirm this.') : r.result;
    var yes = r.self && !r.done ? '<button class="yes" type="button" data-self="' + esc(r.key) + '">✓ ' + esc(r.yes) + '</button>' : '';
    return '<details class="row ' + r.status + '"' + (open ? ' open' : '') + ' id="rjcc-' + esc(r.key) + '"><summary><span class="ic" aria-label="' + LABEL[r.status] + '">' + ICON[r.status] + '</span><span class="txt"><span class="nm">' + esc(r.name) + '</span><span class="tag">' + TAG[r.group] + '</span><div class="res">' + esc(res) + '</div></span>' + yes + '<span class="chev">▶</span></summary>' +
      (r.weekly ? strip(r) : '') + (detail ? '<div class="det">' + detail + '</div>' : '') + '</details>';
  }
  var bad = rs.filter(function (r) { return r.status === 'bad'; }),
    warn = rs.filter(function (r) { return r.status === 'warn'; }),
    chk = rs.filter(function (r) { return r.status === 'chk'; }),
    ok = rs.filter(function (r) { return r.status === 'ok'; });
  if (bad.length) h += '<h3 class="bad">✕ Needs a fix · ' + bad.length + '</h3>' + bad.map(function (r) { return row(r, bad.length <= 2); }).join('');
  if (warn.length) h += '<h3 class="warn">! Worth a look · ' + warn.length + '</h3>' + warn.map(function (r) { return row(r, false); }).join('');
  if (chk.length) h += '<h3 class="chk">? Check yourself · ' + chk.length + '</h3>' + chk.map(function (r) { return row(r, false); }).join('');
  if (!bad.length) { var nx = nextStep(data); h += '<div class="next" style="border-left-color:' + nx.color + '"><strong>Next step · ' + esc(nx.level) + ':</strong> ' + esc(nx.tip) + ' <a href="' + esc(nx.link[0]) + '" target="_blank" rel="noopener">' + esc(nx.link[1]) + ' →</a></div>'; }
  if (ok.length) h += '<h3 class="ok">✓ Done · ' + ok.length + '</h3><details class="row ok" id="rjcc-done"><summary><span class="txt"><span class="res">' + esc(ok.map(function (r) { return TILE[r.key] || r.name; }).join(' · ')) + '</span></span><span class="chev">▶</span></summary><div class="det" style="padding-left:12px">' +
    ok.map(function (r) { return row(r, false); }).join('') + '</div></details>';
  h += '<p class="note">Checks come from <a href="' + BASELINE + '" target="_blank" rel="noopener">the RJ Baseline</a> and <a href="' + PD + 'one-route-for-students-pick-your-modules-pattern" target="_blank" rel="noopener">One Route for Students</a>. Read only; your ticks stay on this computer. <a class="teams" href="' + TEAMS + '" target="_blank" rel="noopener">Teams Jason Beyer</a> · ' + VERSION + '</p>';
  body.innerHTML = h;
  function rerender() { saveStore(data.cid, store); render(box, data, store); }
  body.querySelectorAll('[data-self]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); store.self[b.dataset.self] = new Date().toISOString(); rerender(); }; });
  body.querySelectorAll('[data-unself]').forEach(function (b) { b.onclick = function () { delete store.self[b.dataset.unself]; rerender(); }; });
  body.querySelectorAll('input[data-wk]').forEach(function (cb) { cb.onchange = function () { if (cb.checked) store.wk[cb.dataset.wk] = 1; rerender(); var el = box.querySelector('#rjcc-weekly'); if (el) { el.open = true; } }; });
  body.querySelectorAll('[data-unwk]').forEach(function (b) { b.onclick = function () { delete store.wk[b.dataset.unwk]; rerender(); var el = box.querySelector('#rjcc-weekly'); if (el) { el.open = true; } }; });
  body.querySelectorAll('[data-go]').forEach(function (t) { t.onclick = function () {
    var el = box.querySelector('#rjcc-' + t.dataset.go); if (!el) return;
    var done = box.querySelector('#rjcc-done'); if (done && done.contains(el)) done.open = true;
    el.open = true; box.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' });
  }; });
}

function open() {
  var css = document.createElement('style');
  css.id = ID + 'Css';
  css.textContent = CSS;
  document.head.appendChild(css);
  var box = document.createElement('div');
  box.id = ID;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Raider Course Check');
  box.innerHTML = '<div class="hd"><div class="t">Raider Course Check</div><div class="s">Read only. Nothing in your course is changed.</div>' +
    '<button class="p" type="button">Print</button><button class="x" type="button" aria-label="Close">✕</button></div><div class="bd"><div class="load">Checking your class… (a few seconds)</div></div>';
  document.body.appendChild(box);
  box.querySelector('.x').onclick = function () { box.remove(); css.remove(); };
  box.querySelector('.p').onclick = function () { box.querySelectorAll('details').forEach(function (d) { d.open = true; }); window.print(); };
  var m = /(^|\.)instructure\.com$/.test(location.hostname) && location.pathname.match(/\/courses\/(\d+)/);
  var body = box.querySelector('.bd');
  if (!m) { body.innerHTML = '<p class="load">Open one of your classes in Canvas first (any page in the class), then click <strong>Raider Course Check</strong> again.</p>'; return; }
  analyze(m[1]).then(function (data) { render(box, data, loadStore(m[1])); }).catch(function (e) {
    var why = e && (e.status === 401 || e.status === 403 || e.status === 404) ? 'You need to be a teacher in this course to check it.' : 'Something went wrong (' + esc(e && e.message) + ').';
    body.innerHTML = '<p class="load">Couldn’t check this course. ' + why + ' Still stuck? <a class="teams" href="' + TEAMS + '" target="_blank" rel="noopener">Teams Jason Beyer</a></p>';
  });
}

window.RJCourseCheck = { version: VERSION, analyze: analyze, evaluate: evaluate, CAL: CAL };
if (!AUDIT) open();
})();
