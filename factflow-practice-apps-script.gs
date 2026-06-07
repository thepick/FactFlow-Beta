// FactFlow / FactFlow Check - combined Google Sheets receiver
// Paste this entire file into Extensions > Apps Script in each class Google Sheet.
// Deploy as Web App:
//   Execute as: Me
//   Who has access: Anyone
// Use the V8 runtime.
// After deploying, paste the Web App URL into the TEACHERS map in FactFlow index.html.

function normalizeName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').split(' ').map(function (w) {
    return w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '';
  }).join(' ');
}

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function readJsonPayload(e) {
  var rawJson = '';
  if (e && e.postData && e.postData.contents) {
    rawJson = e.postData.contents;
  } else if (e && e.parameter && e.parameter.json) {
    rawJson = e.parameter.json;
  } else {
    throw new Error('No data received.');
  }
  return JSON.parse(rawJson);
}

function doPost(e) {
  try {
    var data = readJsonPayload(e);
    if (data && data.app === 'FactFlowPractice') {
      return handleFactFlowPractice(data);
    }
    return handleFactFlowCheck(data);
  } catch (err) {
    return json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}

function doGet() {
  return json({ ok: true, receiver: 'factflow-combined-v1', status: 'Receiver is online.' });
}

// -----------------------------------------------------------------------------
// FactFlow practice receiver
// -----------------------------------------------------------------------------

function ensureSheet(ss, name, headers, hidden, legacyName) {
  var sheet = ss.getSheetByName(name);
  var legacySheet;

  if (!sheet && legacyName) {
    legacySheet = ss.getSheetByName(legacyName);
    if (legacySheet) {
      try {
        legacySheet.setName(name);
        sheet = legacySheet;
      } catch (e) {
        sheet = legacySheet;
      }
    }
  }

  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    if (hidden) sheet.hideSheet();
  }
  return sheet;
}

function ensurePracticeRawSheet(ss) {
  return ensureSheet(ss, 'Practice Raw Data', [
    'Timestamp',
    'Student',
    'Email',
    'Student Key',
    'Class',
    'Round ID',
    'Round Started',
    'Round Ended',
    'Focus Table',
    'Order Mode',
    'Configured Duration Sec',
    'Elapsed Sec',
    'Completed Fully',
    'Stop Reason',
    'Attempted',
    'Correct',
    'Incorrect',
    'Accuracy %',
    'FPM',
    'Best Streak',
    'Timeouts',
    'Graduated',
    'Graduated From',
    'Graduated To',
    'Current Table',
    'Sessions Completed',
    'Fluent Facts',
    'Learning Facts',
    'Struggling Facts',
    'Total Facts',
    'Device ID'
  ], true);
}

function ensurePracticeSummarySheet(ss) {
  return ensureSheet(ss, 'FactFlow', [
    'Student',
    'Email',
    'Student Key',
    'Class',
    'Last Updated',
    'Current Table',
    'Sessions Completed',
    'Last Focus Table',
    'Last Accuracy %',
    'Last FPM',
    'Last Correct',
    'Last Attempted',
    'Best Streak',
    'All-Time Best Streak',
    'All-Time Best FPM',
    'Fluent Facts',
    'Learning Facts',
    'Struggling Facts',
    'Last Graduation',
    'Total Submitted Rounds',
    'Last Round ID'
  ], false, 'Practice Summary');
}

function hasRoundAlready(rawSheet, roundId) {
  var lastRow = rawSheet.getLastRow();
  var values;
  var i;
  if (!roundId || lastRow < 2) return false;
  values = rawSheet.getRange(2, 6, lastRow - 1, 1).getValues();
  for (i = 0; i < values.length; i += 1) {
    if (String(values[i][0]) === String(roundId)) return true;
  }
  return false;
}

function appendPracticeRaw(rawSheet, data) {
  rawSheet.appendRow([
    data.submittedAt ? new Date(data.submittedAt) : new Date(),
    normalizeName(data.studentName) || 'Unknown',
    data.studentEmail || '',
    normalizeKey(data.studentKey || data.studentEmail || data.studentName),
    data.teacherKey || '',
    data.roundId || '',
    data.roundStartedAt ? new Date(data.roundStartedAt) : '',
    data.roundEndedAt ? new Date(data.roundEndedAt) : '',
    data.focusTable != null ? data.focusTable : '',
    data.orderMode || '',
    data.configuredDurationSec != null ? data.configuredDurationSec : '',
    data.elapsedSec != null ? data.elapsedSec : '',
    data.completedFully ? 'Yes' : 'No',
    data.stopReason || '',
    data.attempted != null ? data.attempted : '',
    data.correct != null ? data.correct : '',
    data.incorrect != null ? data.incorrect : '',
    data.accuracy != null ? data.accuracy : '',
    data.fpm != null ? data.fpm : '',
    data.bestStreak != null ? data.bestStreak : '',
    data.timeoutsTriggered != null ? data.timeoutsTriggered : '',
    data.graduated ? 'Yes' : 'No',
    data.graduatedFrom != null ? data.graduatedFrom : '',
    data.graduatedTo != null ? data.graduatedTo : '',
    data.currentTable != null ? data.currentTable : '',
    data.sessionsCompleted != null ? data.sessionsCompleted : '',
    data.fluentFacts != null ? data.fluentFacts : '',
    data.learningFacts != null ? data.learningFacts : '',
    data.strugglingFacts != null ? data.strugglingFacts : '',
    data.totalFacts != null ? data.totalFacts : '',
    data.deviceId || ''
  ]);
}

function findPracticeSummaryRow(summary, studentKey, email, studentName) {
  var values = summary.getDataRange().getValues();
  var key = normalizeKey(studentKey);
  var mail = normalizeKey(email);
  var name = normalizeName(studentName);
  var i;

  for (i = 1; i < values.length; i += 1) {
    if (key && normalizeKey(values[i][2]) === key) return i + 1;
  }
  for (i = 1; i < values.length; i += 1) {
    if (mail && normalizeKey(values[i][1]) === mail) return i + 1;
  }
  for (i = 1; i < values.length; i += 1) {
    if (name && normalizeName(values[i][0]) === name) return i + 1;
  }
  return -1;
}

function getSubmittedRoundCount(rawSheet, studentKey, email, studentName) {
  var lastRow = rawSheet.getLastRow();
  var values;
  var key = normalizeKey(studentKey);
  var mail = normalizeKey(email);
  var name = normalizeName(studentName);
  var count = 0;
  var i;

  if (lastRow < 2) return 0;
  values = rawSheet.getRange(2, 1, lastRow - 1, 31).getValues();
  for (i = 0; i < values.length; i += 1) {
    if (key && normalizeKey(values[i][3]) === key) count += 1;
    else if (!key && mail && normalizeKey(values[i][2]) === mail) count += 1;
    else if (!key && !mail && name && normalizeName(values[i][1]) === name) count += 1;
  }
  return count;
}

function upsertPracticeSummary(summary, rawSheet, data) {
  var studentName = normalizeName(data.studentName) || 'Unknown';
  var studentEmail = data.studentEmail || '';
  var studentKey = normalizeKey(data.studentKey || studentEmail || studentName);
  var row = findPracticeSummaryRow(summary, studentKey, studentEmail, studentName);
  var graduationText = data.graduated ? String(data.graduatedFrom || '') + ' to ' + String(data.graduatedTo || '') : '';
  var totalSubmitted = getSubmittedRoundCount(rawSheet, studentKey, studentEmail, studentName);
  var rowValues = [
    studentName,
    studentEmail,
    studentKey,
    data.teacherKey || '',
    data.submittedAt ? new Date(data.submittedAt) : new Date(),
    data.currentTable != null ? data.currentTable : '',
    data.sessionsCompleted != null ? data.sessionsCompleted : '',
    data.focusTable != null ? data.focusTable : '',
    data.accuracy != null ? data.accuracy : '',
    data.fpm != null ? data.fpm : '',
    data.correct != null ? data.correct : '',
    data.attempted != null ? data.attempted : '',
    data.bestStreak != null ? data.bestStreak : '',
    data.allTimeBestStreak != null ? data.allTimeBestStreak : '',
    data.allTimeBestFpm != null ? data.allTimeBestFpm : '',
    data.fluentFacts != null ? data.fluentFacts : '',
    data.learningFacts != null ? data.learningFacts : '',
    data.strugglingFacts != null ? data.strugglingFacts : '',
    graduationText,
    totalSubmitted,
    data.roundId || ''
  ];

  if (row > 0) {
    summary.getRange(row, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    summary.appendRow(rowValues);
  }

  if (summary.getLastRow() > 1) {
    summary.getRange(2, 1, summary.getLastRow() - 1, summary.getLastColumn())
      .sort({ column: 1, ascending: true });
    summary.getRange(2, 5, summary.getLastRow() - 1, 1).setNumberFormat('yyyy-MM-dd HH:mm');
  }
}

function handleFactFlowPractice(data) {
  var lock = null;
  try {
    if (!data.roundId) throw new Error('Missing roundId.');
    if (!data.studentName && !data.studentEmail) throw new Error('Missing student identity.');

    lock = LockService.getScriptLock();
    lock.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var rawSheet = ensurePracticeRawSheet(ss);
    var summary = ensurePracticeSummarySheet(ss);

    if (!hasRoundAlready(rawSheet, data.roundId)) {
      appendPracticeRaw(rawSheet, data);
    }
    upsertPracticeSummary(summary, rawSheet, data);

    return json({ ok: true, receiver: 'factflow-practice-v1', student: normalizeName(data.studentName), roundId: data.roundId });
  } catch (err) {
    return json({ ok: false, receiver: 'factflow-practice-v1', error: err && err.message ? err.message : String(err) });
  } finally {
    if (lock) {
      try { lock.releaseLock(); } catch (e) {}
    }
  }
}

// -----------------------------------------------------------------------------
// Existing FactFlow Check receiver behavior
// -----------------------------------------------------------------------------

function handleFactFlowCheck(data) {
  var lock = null;
  try {
    var studentName = normalizeName(data.studentName) || 'Unknown';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var rawSheet = ss.getSheetByName('Raw Data');
    if (!rawSheet) {
      rawSheet = ss.insertSheet('Raw Data');
      rawSheet.appendRow([
        'Timestamp', 'Student', 'Code', 'Assessment',
        'Verified', 'Developing', 'Accuracy %', 'Fluent',
        'Slow', 'Wrong', 'Timeout', 'Questions',
        'Missed Facts', 'Restarted', 'Duration sec'
      ]);
      rawSheet.hideSheet();
    }

    rawSheet.appendRow([
      data.completedAt ? new Date(data.completedAt) : new Date(),
      studentName,
      data.code || '',
      data.assessmentName || '',
      data.verifiedBand || '',
      data.developingBand || '',
      data.accuracy != null ? data.accuracy : '',
      data.fluent != null ? data.fluent : '',
      data.slow != null ? data.slow : '',
      data.wrong != null ? data.wrong : '',
      data.timeout != null ? data.timeout : '',
      data.totalQuestions != null ? data.totalQuestions : '',
      (data.missedFacts || []).join(', '),
      data.restarted ? 'Yes (' + (data.restartCount || 0) + ')' : 'No',
      data.durationSec != null ? data.durationSec : ''
    ]);

    lock = LockService.getScriptLock();
    lock.waitLock(10000);

    var summary = ensureSheet(ss, 'Check', [
      'Student', 'Date', 'Code', 'Verified', 'Developing',
      'Accuracy %', 'Fluent', 'Slow', 'Missed', 'Facts to Review', 'Restart?'
    ], false, 'Summary');

    var summaryData = summary.getDataRange().getValues();
    var foundRow = -1;
    for (var i = 1; i < summaryData.length; i += 1) {
      if (normalizeName(summaryData[i][0]) === studentName) {
        foundRow = i;
        break;
      }
    }

    var rowValues = [
      studentName,
      data.completedAt ? new Date(data.completedAt) : new Date(),
      data.code || '',
      data.verifiedBand || '',
      data.developingBand || '',
      data.accuracy != null ? data.accuracy + '%' : '',
      data.fluent != null ? data.fluent : '',
      data.slow != null ? data.slow : '',
      (data.wrong || 0) + (data.timeout || 0),
      (data.missedFacts || []).join(', '),
      data.restarted ? 'Yes' : 'No'
    ];

    if (foundRow >= 0) {
      summary.getRange(foundRow + 1, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      summary.appendRow(rowValues);
    }

    var lastRow = summary.getLastRow();
    if (lastRow > 1) {
      summary.getRange(2, 1, lastRow - 1, summary.getLastColumn())
        .sort({ column: 1, ascending: true });
      summary.getRange(2, 2, lastRow - 1, 1).setNumberFormat('yyyy-MM-dd HH:mm');
    }

    return json({ ok: true, receiver: 'factflow-check-v1', student: studentName });
  } catch (err) {
    return json({ ok: false, receiver: 'factflow-check-v1', error: err && err.message ? err.message : String(err) });
  } finally {
    if (lock) {
      try { lock.releaseLock(); } catch (e) {}
    }
  }
}
