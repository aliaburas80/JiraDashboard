# Delivery Clarity — Manual Test Checklist

Run these tests on the **live Render URL**: `https://delivery-clarity.onrender.com`

Mark each step ✅ Pass or ❌ Fail. Add the date when you test it.

---

## 1. Login & Authentication (P0A-05)

### 1.1 Normal login
1. Go to `/login`
2. Enter your email and password
3. Click **Sign in**
4. ✅ You land on the dashboard (or upload page if no data yet)

### 1.2 Wrong password → generic error
1. Go to `/login`
2. Enter your email, type a wrong password
3. Click **Sign in**
4. ✅ Red banner appears: "Invalid email or password."
5. ✅ The message does NOT say "wrong password" or "user not found" — always the same wording

### 1.3 Non-existent email → same generic error
1. Go to `/login`
2. Enter `nobody@fake.com` as the email, any password
3. Click **Sign in**
4. ✅ Exact same red banner as 1.2 — no hint that the email doesn't exist

### 1.4 Rate limit countdown
1. Go to `/login`
2. Enter wrong credentials and click **Sign in** — repeat **5 times**
3. On the 6th attempt:
4. ✅ Amber banner appears: "Too many login attempts. Try again in **Xs**"
5. ✅ The countdown ticks down live, every second
6. ✅ The **Sign in** button shows "Try again in Xs" and is disabled
7. Wait for the countdown to reach 0
8. ✅ Button re-enables, amber banner disappears, form is ready again

### 1.5 Logout invalidates session
1. Log in successfully
2. Click **Logout**
3. Press the browser Back button
4. ✅ You are redirected to `/login` — the old page is not shown

### 1.6 Protected routes block unauthenticated users
1. Open an **incognito / private window** (no cookies)
2. Go directly to `https://delivery-clarity.onrender.com/dashboard`
3. ✅ Redirected to `/login`
4. Go directly to `https://delivery-clarity.onrender.com/admin`
5. ✅ Redirected to `/login`
6. Go directly to `https://delivery-clarity.onrender.com/admin/settings`
7. ✅ Redirected to `/login`

### 1.7 Session cookie is secure
1. Log in
2. Open browser DevTools → Application → Cookies
3. Find `dc_session`
4. ✅ **HttpOnly** column is checked — JavaScript cannot read it
5. ✅ **Secure** column is checked — HTTPS only
6. ✅ **SameSite** is `Strict`

### 1.8 Change password requires current password
1. Log in, go to your profile or change-password page
2. Enter a wrong current password, enter a new valid password
3. ✅ Error: "Current password is incorrect."
4. Enter the correct current password and a new valid password (8+ chars, 1 uppercase, 1 number)
5. ✅ Password changed successfully, you stay logged in

---

## 2. Data Access Security (P0A-04)

Run these in your **terminal** or use a tool like Postman. No login cookie = no data.

### 2.1 Metrics endpoint blocks unauthenticated access
```bash
curl -s https://delivery-clarity.onrender.com/api/metrics/latest
```
✅ Returns: `{"error":"Not authenticated."}`

```bash
curl -s https://delivery-clarity.onrender.com/api/metrics
```
✅ Returns: `{"error":"Not authenticated."}`

### 2.2 Upload endpoints block unauthenticated access
```bash
curl -s -X POST https://delivery-clarity.onrender.com/api/upload \
  -F "file=@any-file.csv"
```
✅ Returns: `{"error":"Not authenticated."}`

```bash
curl -s -X POST https://delivery-clarity.onrender.com/api/upload/merge \
  -F "file=@any-file.csv"
```
✅ Returns: `{"error":"Not authenticated."}`

### 2.3 Developer view blocks unauthenticated access
```bash
curl -s https://delivery-clarity.onrender.com/api/developer-view
```
✅ Returns: `{"error":"Not authenticated."}`

### 2.4 Logged-in users can still access everything
```bash
# Step 1 — log in and save the cookie
curl -s -c /tmp/dc.txt \
  -X POST https://delivery-clarity.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"YourPassword1"}' | python3 -m json.tool

# Step 2 — fetch metrics with the cookie
curl -s -b /tmp/dc.txt \
  https://delivery-clarity.onrender.com/api/metrics/latest | python3 -m json.tool
```
✅ Step 1 returns `"ok": true`
✅ Step 2 returns `"available": true` with metrics data (not an error)

---

## 3. File Upload Pipeline (P0A-02)

### 3.1 Valid Jira CSV upload works
1. Log in
2. Go to the upload page `/`
3. Upload a valid Jira CSV export (must have columns: Issue Key, Issue Type, Summary, Status)
4. ✅ Dashboard loads with metrics
5. ✅ No error shown

### 3.2 Wrong file type is rejected
1. Log in, go to upload page
2. Try to upload a `.pdf` or `.docx` file
3. ✅ Error: `Unsupported file type ".pdf". Upload a .csv, .xlsx, or .xls Jira export.`
4. ✅ No metrics are written or overwritten

### 3.3 File over 20MB is rejected
1. Log in, go to upload page
2. Try to upload a file larger than 20MB
3. ✅ Error: `File exceeds the 20 MB size limit. Export a smaller date range...`

### 3.4 Empty file is rejected
1. Create a file named `empty.csv` with no rows (just headers or truly empty)
2. Upload it
3. ✅ Error: `Uploaded file contains no issue rows.`

### 3.5 Missing required columns is rejected
1. Create a CSV with columns like `Title, Assignee` (no Issue Key, no Status)
2. Upload it
3. ✅ Error: `Missing required Jira fields: Issue Key, Issue Type, Summary, Status` (or whichever are missing)

### 3.6 Upload rate limit
1. Upload 20 files in quick succession (can use the same valid file)
2. On the 21st upload:
3. ✅ Error: `Too many uploads. Try again in Xm Xs.`
4. ✅ Response header `Retry-After` is present

---

## 4. Admin Settings — Email Test (SMTP / Resend)

### 4.1 Test email succeeds (green state)
1. Log in, go to **Admin → Settings → App Config**
2. Fill in SMTP/Resend fields and click **Send test email**
3. ✅ Button turns **green** and shows "Sent — test again"
4. ✅ Green success banner: "Test email sent to your@email.com — check your inbox"
5. ✅ Email arrives in your inbox

### 4.2 Test email fails (red state + retry)
1. Enter an invalid SMTP password and click **Send test email**
2. ✅ Button turns **red** and shows "Failed — retry"
3. ✅ Red error banner appears with the specific error message
4. ✅ "Show solution" expander reveals fix instructions
5. ✅ Button is immediately re-enabled — you can click it again without refreshing

### 4.3 Resend rate limit (if applicable)
1. If using Resend with `onboarding@resend.dev`, emails can only go to your registered Resend account email
2. Sending to any other address returns a 403 from Resend
3. ✅ Error banner shows: "Resend email failed" with a clear solution pointing to domain verification

---

## 5. Jira Connection

### 5.1 Create and test a Jira connection
1. Log in, go to **Admin → Settings → Jira**
2. Add a new Jira connection with your Jira URL and API token
3. Click **Test connection**
4. ✅ Shows "Connected" with your Jira account name

### 5.2 Decrypt error on wrong key (key mismatch)
1. If you see: "The Jira API token saved for this connection cannot be decrypted"
2. This means the connection was created with a different `CONFIG_ENCRYPTION_KEY`
3. Fix: delete the connection and recreate it — the new token will encrypt with the current key
4. ✅ After recreating, test passes

---

## 6. Metric Calculation Correctness (P0A-03)

These are verified automatically by 22 regression tests in `src/__tests__/metricFormulas.test.ts`. The manual checks below confirm the numbers look right on real data through the UI.

### 6.1 Lead time shows correctly
1. Upload a Jira CSV that has issues with `Created Date` and `Done Date` columns
2. Go to the dashboard → Flow Health section
3. ✅ "Avg Lead Time" shows a number in days (not 0, not NaN, not blank)
4. ✅ The number is roughly the average gap between creation and completion of Done issues

### 6.2 Completion rate is correct
1. Upload a file with 10 issues, 4 of which have Status = Done
2. ✅ Dashboard shows completion rate = **40%**
3. Upload a file where all issues are Done
4. ✅ Completion rate = **100%**
5. Upload a file where no issues are Done
6. ✅ Completion rate = **0%** (not NaN, not blank)

### 6.3 Sprint story points are correct
1. Upload a file with a Sprint column and Story Points column
2. Go to the dashboard → Sprint section
3. ✅ "Committed" points = sum of all story points in that sprint (done + open)
4. ✅ "Completed" points = sum of story points for Done issues only
5. ✅ "Point completion rate" = completed ÷ committed × 100 (rounded)

### 6.4 Empty or missing data does not crash
1. Upload a CSV with valid headers but no data rows
2. ✅ Error: "Uploaded file contains no issue rows." — dashboard not overwritten
3. Upload a valid file where some issues have no Story Points column
4. ✅ Dashboard loads — missing points treated as 0, no crash

### 6.5 Automated regression tests all pass
```bash
cd /path/to/JiraDashboard
npx jest src/__tests__/metricFormulas.test.ts --no-coverage
```
✅ 22/22 tests pass

---

## 7. Performance Baseline (P0A-09)

Upload a real Jira export with **3,000–7,000 issues** and measure these timings.
The service already logs calculation time — check Render logs after uploading.

### Agreed performance thresholds

| Operation | Target | Where to measure |
|---|---|---|
| File upload + parse + metrics calculation | < 10 seconds end-to-end | Browser: time from click to dashboard loading |
| `calculateDashboardMetrics` for 5k issues | < 3 seconds | Render logs: `[metrics] calculateDashboardMetrics: Xms` |
| Dashboard page initial load (data already uploaded) | < 3 seconds | Browser DevTools → Network → page load |
| `/api/metrics/latest` API response | < 1 second | Browser DevTools → Network → request time |

### 7.1 Upload a large file and measure timing
1. Export 3,000–7,000 issues from your Jira instance as CSV
2. Log in to the live app
3. Start a stopwatch
4. Upload the file
5. Stop when the dashboard metrics appear
6. ✅ Total time < 10 seconds

### 7.2 Check server-side calculation time in Render logs
1. After uploading, go to Render dashboard → `delivery-clarity` → **Logs**
2. Search for: `calculateDashboardMetrics`
3. ✅ Line reads: `[metrics] calculateDashboardMetrics: Xms for Y issues`
4. ✅ X (milliseconds) is under 3,000 for 5,000 issues

### 7.3 Dashboard load is fast after upload
1. After uploading, hard-refresh the dashboard (Cmd+Shift+R / Ctrl+Shift+R)
2. Open DevTools → Network → reload
3. ✅ Page is interactive within 3 seconds
4. ✅ No loading spinner stays visible longer than 3 seconds

---

## 8. Database, Infrastructure & Version (P0A-06/07/08)

### 7.1 Health and readiness endpoints work
```bash
curl -s https://delivery-clarity.onrender.com/api/health | python3 -m json.tool
```
✅ Returns: `{"status":"ok","service":"delivery-clarity","version":"2.0.0","timestamp":"..."}`

```bash
curl -s https://delivery-clarity.onrender.com/api/ready | python3 -m json.tool
```
✅ Returns: `{"status":"ready","service":"delivery-clarity","version":"2.0.0","checks":{"database":"ok"}}`
✅ The `version` field is present in both responses

### 7.2 Config save is audit-logged
1. Log in as admin, go to **Admin → Settings → App Config**
2. Change any field (e.g. From address) and click **Save this section**
3. Go to **Admin → Audit Log** (if visible) or check the AuditEvent table
4. ✅ An entry with `eventType: admin_config_save` appears with your email and timestamp

### 7.3 Migrations are applied on Render
1. After each deploy, check Render logs at startup
2. Look for: `{"event":"prisma_migrate_deploy.success"}`
3. ✅ Migrations apply cleanly — no error about missing tables or columns

### 7.4 Neon database backup (automatic)
Neon PostgreSQL provides automatic daily backups on all plans.
1. Go to your Neon dashboard → Project → Backups
2. ✅ At least one backup is listed with a recent timestamp

### 7.5 Restore procedure (in case of data loss)
To restore to a previous Neon snapshot:
1. Neon dashboard → Project → Branches → main → Restore
2. Select the point-in-time to restore to
3. Neon restores the branch without downtime
4. ✅ After restore: `/api/ready` returns `{"status":"ready"}` confirming DB is accessible

---

## 9. Error Monitoring (P0B-08)

### 9.1 Client errors are captured automatically
1. Log in to the live app
2. Open DevTools → Console
3. To simulate a captured error, paste this and press Enter:
   ```js
   window.dispatchEvent(new ErrorEvent('error', { message: 'Test error from manual test', error: new Error('Test') }))
   ```
4. The app should NOT crash or show a broken UI
5. Check the `AppError` table in Neon (via Neon SQL editor):
   ```sql
   SELECT message, page, severity, count, "lastSeenAt" FROM "AppError" ORDER BY "lastSeenAt" DESC LIMIT 5;
   ```
6. ✅ A row appears with `message = "Test error from manual test"`

### 9.2 React component crash is captured
1. If any dashboard section shows an error boundary (red "An unexpected error occurred" box)
2. Check the Neon `AppError` table as above
3. ✅ The error appears with the component name and page path

### 9.3 Same error increments count, not creates duplicate
1. Trigger the same simulated error from 9.1 three more times
2. Check the database
3. ✅ `count` column is now 4, there is still only ONE row with that fingerprint

### 9.4 Error endpoint blocks unauthenticated abuse
```bash
# Rate limit: 30 per IP per 15 minutes
for i in $(seq 1 31); do
  curl -s -X POST https://delivery-clarity.onrender.com/api/events/error \
    -H "Content-Type: application/json" \
    -d '{"message":"test","page":"/","severity":"error"}' | python3 -m json.tool
done
```
✅ The 31st request returns `{"ok":false,"reason":"rate_limited"}` with status 429

---

## 10. Feedback Control (P0B-09)

### 10.1 Floating button appears on every page
1. Log in to the live app
2. Navigate to any page: dashboard, retro, help, admin, etc.
3. ✅ A **💬 Feedback** button appears fixed in the **bottom-right corner** on every page
4. ✅ It does not cover important page content (stays at the very edge)

### 10.2 Feedback form opens and submits
1. Click the **💬 Feedback** button
2. ✅ A modal appears with:
   - Category dropdown (7 options: Suggestion, Problem/Bug, Feature Request, Complaint, Question, Data/Calculation Concern, Other)
   - Message textarea
   - Impact level buttons: **Minor** / **Affects My Work** / **Blocks Me**
   - "May we contact you?" checkbox
3. Select **Problem/Bug**, type at least 5 characters, choose an impact level
4. Click **Send feedback**
5. ✅ The form replaces with "✅ Thank you! Your feedback has been recorded."

### 10.3 Validation rejects empty or too-short messages
1. Open the feedback form
2. Leave the message blank and click **Send feedback**
3. ✅ Error message: "Please enter at least a few words."
4. Form stays open, nothing submitted

### 10.4 Feedback is stored in the database
After submitting feedback, verify in the Neon SQL editor:
```sql
SELECT category, message, "impactLevel", "canContact", status, "createdAt"
FROM "Feedback"
ORDER BY "createdAt" DESC
LIMIT 5;
```
✅ Your submission appears with `status = "New"`

### 10.5 Keyboard and accessibility
1. Open the feedback form
2. Press **Tab** — focus moves through: category → message → impact buttons → checkbox → submit
3. Press **Escape** — modal closes, focus returns to the Feedback button
4. ✅ All interactive elements have visible focus rings
5. ✅ Modal has `role="dialog"` and `aria-modal="true"`

### 10.6 Close without submitting
1. Open the feedback form, fill in some text
2. Click the × button or press Escape
3. ✅ Modal closes, nothing is submitted
4. Reopen the form
5. ✅ Form is reset (blank, default category, Minor impact)

---

## 11. Workspace Model (EP-006)

Every user must have exactly one private workspace. These checks confirm the migration ran correctly and new users get a workspace automatically.

### 11.1 Existing users have a workspace after migration

Run in the **Neon SQL editor**:

```sql
-- Every user should have exactly one workspace
SELECT u.email, w.id AS workspace_id, w.slug, w.status
FROM "User" u
LEFT JOIN "Workspace" w ON w."ownerUserId" = u.id
ORDER BY u."createdAt";
```
✅ Every row has a non-null `workspace_id` — no user without a workspace  
✅ Slugs follow the pattern `ws-{userId}`  
✅ All statuses are `active`

```sql
-- Every workspace has exactly one member with role = owner
SELECT w.slug, wm."userId", wm."accessRole"
FROM "Workspace" w
JOIN "WorkspaceMember" wm ON wm."workspaceId" = w.id
ORDER BY w."createdAt";
```
✅ Every workspace has one row with `accessRole = owner`

### 11.2 Existing import logs are linked to a workspace

```sql
-- No import logs should have NULL workspaceId after migration
SELECT COUNT(*) AS unlinked_imports
FROM "ImportLog"
WHERE "workspaceId" IS NULL;
```
✅ Returns `0` — all import logs are workspace-linked

```sql
-- Spot-check: import logs belong to the correct workspace
SELECT il."fileName", il."workspaceId", w."ownerUserId", il."userId"
FROM "ImportLog" il
JOIN "Workspace" w ON w.id = il."workspaceId"
LIMIT 10;
```
✅ `ownerUserId` matches `userId` on every row

### 11.3 New user created by admin gets a workspace

1. Log in as admin → go to **Admin → Settings → User Management**
2. Create a new test user (any email, any role)
3. ✅ User appears in the list
4. Verify in Neon SQL:
   ```sql
   SELECT u.email, w.id, w.slug, w.status
   FROM "User" u
   JOIN "Workspace" w ON w."ownerUserId" = u.id
   WHERE u.email = 'your-new-test-user@email.com';
   ```
5. ✅ One row returned with a valid workspace ID and `status = active`

### 11.4 New upload goes into the user's workspace

1. Log in as a non-admin user
2. Upload a valid Jira CSV
3. Verify in Neon SQL:
   ```sql
   SELECT il."fileName", il."workspaceId", w."ownerUserId"
   FROM "ImportLog" il
   JOIN "Workspace" w ON w.id = il."workspaceId"
   ORDER BY il."uploadedAt" DESC
   LIMIT 1;
   ```
4. ✅ The latest import log has a `workspaceId` that matches your user's workspace

### 11.5 New snapshot goes into the user's workspace

1. Log in, upload data, then save a snapshot
2. Verify in Neon SQL:
   ```sql
   SELECT ds."snapshotName", ds."workspaceId", w."ownerUserId"
   FROM "DashboardSnapshot" ds
   JOIN "Workspace" w ON w.id = ds."workspaceId"
   ORDER BY ds."createdAt" DESC
   LIMIT 1;
   ```
3. ✅ Latest snapshot has a non-null `workspaceId`

---

## 12. Workspace Data Isolation (EP-008 / EP-009)

These tests prove that a logged-in user cannot read or delete another user's data — even if they know the ID. You need **two test accounts** for these tests.

### Setup

```bash
# Log in as User A and save cookie
curl -s -c /tmp/user_a.txt \
  -X POST https://delivery-clarity.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user_a@test.com","password":"PasswordA1"}' | python3 -m json.tool

# Log in as User B and save cookie
curl -s -c /tmp/user_b.txt \
  -X POST https://delivery-clarity.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user_b@test.com","password":"PasswordB1"}' | python3 -m json.tool
```

### 12.1 User A cannot see User B's imports in the list

```bash
# Get User B's import log ID from Neon:
# SELECT id FROM "ImportLog" WHERE "userId" = '<user_b_id>' LIMIT 1;

# Now request the imports list as User A
curl -s -b /tmp/user_a.txt \
  https://delivery-clarity.onrender.com/api/imports | python3 -m json.tool
```
✅ The response contains **only User A's own import logs** — no User B records appear

### 12.2 User A cannot read User B's snapshot by ID

```bash
# Get User B's snapshot ID from Neon:
# SELECT id FROM "DashboardSnapshot" WHERE "userId" = '<user_b_id>' LIMIT 1;
SNAP_B_ID="<paste-user-b-snapshot-id>"

curl -s -b /tmp/user_a.txt \
  https://delivery-clarity.onrender.com/api/snapshots/$SNAP_B_ID | python3 -m json.tool
```
✅ Returns `{"error":"Snapshot not found."}` with HTTP 404 — **not** 403  
✅ Response does NOT contain User B's `metricsJson` or any analysis data

### 12.3 User A cannot delete User B's import log

```bash
# Get User B's import log ID from Neon:
# SELECT id FROM "ImportLog" WHERE "userId" = '<user_b_id>' LIMIT 1;
IMPORT_B_ID="<paste-user-b-import-id>"

curl -s -b /tmp/user_a.txt \
  -X DELETE https://delivery-clarity.onrender.com/api/imports/$IMPORT_B_ID | python3 -m json.tool
```
✅ Returns `{"error":"Import log not found."}` with HTTP 404  
✅ The import log still exists in Neon (verify: `SELECT id FROM "ImportLog" WHERE id = '<id>'`)

### 12.4 User A's trends only show User A's data

```bash
curl -s -b /tmp/user_a.txt \
  https://delivery-clarity.onrender.com/api/trends | python3 -m json.tool
```
✅ All `points` in the response have upload dates/files matching only User A's uploads  
✅ User B's uploads are not in the list

### 12.5 Import list workspace scope is confirmed in API response

```bash
curl -s -b /tmp/user_a.txt \
  https://delivery-clarity.onrender.com/api/imports | python3 -m json.tool
```
✅ All logs in the response share the same `workspaceId` (User A's workspace)  
✅ No log has a `workspaceId` belonging to User B

---

## How to add new tests

When a new feature is built, add a new numbered section here following the same format:

```
## N. Feature Name (Ticket/Item ID)

### N.1 Test name
1. Step one
2. Step two
3. ✅ Expected result
```

Keep steps short. One action per step. Expected result always starts with ✅.
