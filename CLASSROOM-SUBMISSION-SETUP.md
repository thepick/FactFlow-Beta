# FactFlow Classroom Submission Setup

This patch adds classroom submission to the regular FactFlow practice app.

## URL behavior

- `factflow.mtomlinson.ca` stays personal practice only.
- `factflow.mtomlinson.ca?t=IP5/8` enables classroom mode for IP5/8.
- `factflow.mtomlinson.ca?t=IP5/9` enables classroom mode for IP5/9.
- Invalid `?t=` values fail closed and do not submit anywhere.

## Important setup step

The `TEACHERS` map in `index.html` intentionally has blank `url` values. This prevents practice data from accidentally being sent to the existing FactFlow Check receiver, which uses a different sheet schema.

Before classroom submission will work:

1. Open each class Google Sheet.
2. Go to Extensions > Apps Script.
3. Replace the script with `factflow-practice-apps-script.gs` from this zip.
4. Confirm the project uses the V8 runtime.
5. Deploy as a Web App:
   - Execute as: Me
   - Who has access: Anyone
6. Copy the Web App URL.
7. Paste the URL into the matching `TEACHERS` entry in `index.html`.
8. Redeploy/upload the patched FactFlow app.

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
- `Practice Summary`: one row per student, updated after each round

The same script still preserves the existing FactFlow Check behavior using the original `Raw Data` and `Summary` tabs.
