# FactFlow Classroom Submission Setup

This patch adds classroom submission to the regular FactFlow practice app.

## URL behavior

For beta testing:

- `https://factflowbeta.mtomlinson.ca` stays personal practice only.
- `https://factflowbeta.mtomlinson.ca?t=IP5/8` enables classroom mode for IP5/8.
- `https://factflowbeta.mtomlinson.ca?t=IP5/9` enables classroom mode for IP5/9.
- Invalid `?t=` values fail closed and do not submit anywhere.

For final production, the same rules apply on `https://factflow.mtomlinson.ca`.

## What has already been filled in

The `TEACHERS` map in `index.html` now contains the existing class Apps Script Web App URLs from the FactFlow Check app:

```javascript
var TEACHERS = {
  'IP5/9': {
    name: 'Ajarn Michael - IP5/9',
    url: 'https://script.google.com/macros/s/AKfycbxZAjDgNmpEdCohLeZ5kuCwC6J1VacejRacQn8MRIgwYVhoKaxmSexK-UdhqNXeMsX50g/exec'
  },
  'IP5/8': {
    name: 'Ajarn Jordan - IP5/8',
    url: 'https://script.google.com/macros/s/AKfycbz0Au2YhXQgyzM4b5OTSmhtKxSn2JKsGItNY_4o7vFCdN5pHuIYShHdkaQkyBERNMD9tA/exec'
  }
};
```

Important: those URLs are filled in, but the Google Apps Script projects behind those URLs still need to use the combined receiver included in this zip. If the old FactFlow Check-only receiver is still deployed, the beta app will now fail closed: it checks the receiver first and will not send practice data unless the receiver reports `factflow-combined-v1`.

## Required Google Apps Script update

For each class spreadsheet/script project:

1. Open the class Google Sheet.
2. Go to Extensions > Apps Script.
3. Replace the existing script with `factflow-practice-apps-script.gs` from this zip.
4. Confirm the project uses the V8 runtime.
5. Deploy the updated Web App.
   - Execute as: Me
   - Who has access: Anyone
6. Confirm the Web App URL still matches the URL in the `TEACHERS` map.
7. If Google gives you a new Web App URL, paste the new URL into the matching `TEACHERS` entry in `index.html` and redeploy/upload FactFlow again.

The included Apps Script is designed to preserve the existing FactFlow Check behavior while adding separate practice tabs for the regular FactFlow practice app. The FactFlow practice app performs a safety check before POSTing practice data, so the combined receiver must be deployed before classroom practice submissions can be accepted.

## Required Google OAuth check for beta testing

Because this app uses Google sign-in/Drive sync, make sure this origin is allowed in the Google OAuth client used by FactFlow:

```text
https://factflowbeta.mtomlinson.ca
```

Keep the production origin too:

```text
https://factflow.mtomlinson.ca
```

If the beta origin is missing, Google sign-in or Drive sync may fail on the beta site.

## CNAME for this beta zip

This zip has `CNAME` set to:

```text
factflowbeta.mtomlinson.ca
```

Before making this the main production app, change `CNAME` back to:

```text
factflow.mtomlinson.ca
```

## What gets submitted

When a student opens a valid classroom link and signs in with Google, FactFlow sends one submission after each completed practice round.

Each submission includes:

- Student name
- Student email
- Student key
- Class key
- Round ID
- Round start/end time
- Configured round duration
- Actual elapsed time
- Whether the round completed fully
- Stop reason
- Attempted, correct, incorrect
- Accuracy
- Facts per minute
- Best streak
- Timeout count
- Graduation information
- Current table
- Overall fluent, learning, and struggling fact counts

## Sheet tabs created

The Apps Script creates separate practice tabs:

- `Practice Raw Data`: one row per completed round
- `FactFlow`: one row per student, updated after each completed practice round

The same script still preserves the existing FactFlow Check behavior using the original `Raw Data` tab and the renamed `Check` summary tab.

## Suggested beta test links

Test these links in this order:

```text
https://factflowbeta.mtomlinson.ca
https://factflowbeta.mtomlinson.ca?t=IP5/8
https://factflowbeta.mtomlinson.ca?t=IP5/9
https://factflowbeta.mtomlinson.ca?t=INVALID
```

Expected behavior:

- The first link has no classroom submission UI.
- IP5/8 and IP5/9 show classroom mode and auto-submit after completed rounds.
- The invalid class link fails closed and does not submit anywhere.
