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
