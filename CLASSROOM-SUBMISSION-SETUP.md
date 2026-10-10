# FactFlow Classroom Submission Setup

## Gmail-owned reporting (10 October 2026)

Class reporting uses the Gmail-owned Sheets below and reporting scripts deployed under pickripper@gmail.com. Classroom app links, teacher access and class keys stay the same; teachers must use these new Sheet URLs. All active reporting Sheets and scripts are owned by pickripper@gmail.com. Edit the Gmail-owned script projects below, preserving each class's existing reporting and quiz behavior.

- IP5/8: https://docs.google.com/spreadsheets/d/1tM8s5BpZjMEYUrmYHPi7wMIIS2MACTZB9T_hcrTF2Yw/edit
- IP5/9: https://docs.google.com/spreadsheets/d/1xNXKEVpKZ5AuDVKb129iqWYg2oYkTKT-_oCOoyUC2bg/edit
- IP6/8: https://docs.google.com/spreadsheets/d/1G-ZGJKlb4EHaOiFpP-ooYl-AvpvFNt-nMS_Pa6QNqKw/edit
- IP6/9: https://docs.google.com/spreadsheets/d/1EQCbeb6fBZxXeHwXDG59nwPPD0XtGQowCPgVMNAfcio/edit

This patch adds classroom submission to the regular FactFlow practice app.

## URL behavior

For beta testing:

- `https://factflowbeta.mtomlinson.ca` stays personal practice only.
- `https://factflowbeta.mtomlinson.ca?t=IP5/8` enables classroom mode for IP5/8.
- `https://factflowbeta.mtomlinson.ca?t=IP5/9` enables classroom mode for IP5/9.
- Invalid `?t=` values fail closed and do not submit anywhere.

For final production, the same rules apply on `https://factflow.mtomlinson.ca`.

## What has already been filled in

The `TEACHERS` map in `index.html` now contains the Gmail-owned class Apps Script Web App URLs:

```javascript
var TEACHERS = {
  'IP5/9': {
    name: 'Ajarn Michael - IP5/9',
    url: 'https://script.google.com/macros/s/AKfycbxa_GuiAo3_fYujGi5UC9J0e7EQhGtuanbFqQd13E5-wQ0t42jQAl2m2NZcWOhKJ-bcRw/exec'
  },
  'IP5/8': {
    name: 'Ajarn Jordan - IP5/8',
    url: 'https://script.google.com/macros/s/AKfycbxMQhKQ2Zu9YwDOHO6eUI0s530_AJaIAYvAxwAwHcoM5sv3alX284KvDd_sOmShWdn1Rw/exec'
  }
};
```

The Gmail deployments already use the migrated class-specific combined receivers. The beta app checks the receiver before sending practice data and fails closed if the receiver does not support combined reporting.

## Future Google Apps Script updates

- IP5/8: https://script.google.com/home/projects/1akqvhOPR1SCWwNqjFB8otWB3yc2ZPjMk5TUan4JIsxTYgu4eIJIsZe1G/edit
- IP5/9: https://script.google.com/home/projects/1pEovd9gnfwtpN4F63CGicxEKC6KsWyydSwpms-g_63lyyDyWE4tL0YPy/edit
- IP6/8: https://script.google.com/home/projects/1EzWfiqSnWZuP4-MmcHpmS-FbqiKMnZ45y1hnQI0iz57AmQoktEUgm8qb/edit
- IP6/9: https://script.google.com/home/projects/1PH6uW-UDvwsRu6bfLsfmdkie-foTQ3AWxsIWyEtz9yjOQ2V4eeeKxy-s/edit

For each class spreadsheet/script project:

1. Open the Gmail-owned reporting script project listed above.
2. Edit that script directly, preserving its class-specific reporting and quiz behavior.
3. Confirm its class routing points to the Gmail-owned Sheets above.
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
- `FactFlow Practice`: one row per student, updated after each completed practice round

The same script still preserves the existing FactFlow Check behavior using the original `Raw Data` tab and the `Check` summary tab.

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
