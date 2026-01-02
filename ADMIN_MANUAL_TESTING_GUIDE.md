# Admin System Manual Testing Guide

**Version:** 1.0
**Date:** December 29, 2025
**Server:** http://localhost:3000

---

## Prerequisites

Before testing, ensure:
- [x] Development server is running (`npm run dev`)
- [ ] You have created at least one Super Admin account in the database
- [ ] You have test merchant accounts available
- [ ] Upstash Redis is configured (optional - rate limiting will be disabled if not configured)

---

## Creating a Test Super Admin

If you don't have a Super Admin account yet, create one using Prisma Studio or a database script:

```typescript
// Run in Prisma Studio or create a script
const bcrypt = require('bcryptjs');
const passwordHash = await bcrypt.hash('YourSecurePassword123!', 10);

// Insert into Admin table:
{
  email: 'superadmin@getonblockchain.com',
  passwordHash: passwordHash,
  fullName: 'Super Administrator',
  role: 'SUPER_ADMIN',
  isActive: true
}
```

---

## Test Execution

### Phase 1: Authentication & Rate Limiting

#### Test 1.1: Admin Login (Valid Credentials)
**URL:** http://localhost:3000/admin/login

**Steps:**
1. Navigate to /admin/login
2. Enter your Super Admin email
3. Enter your password
4. Click "Login"

**Expected:**
- Redirects to /admin (dashboard)
- Shows "Welcome, [Your Name]"
- Top right shows your name and SUPER ADMIN badge
- Navigation sidebar is visible

**Pass Criteria:** Successfully logged in and redirected to dashboard

---

#### Test 1.2: Admin Login (Invalid Credentials)
**URL:** http://localhost:3000/admin/login

**Steps:**
1. Navigate to /admin/login
2. Enter valid email
3. Enter WRONG password
4. Click "Login"

**Expected:**
- Error message: "Invalid email or password"
- Stays on login page
- Form is cleared or shows error state

**Pass Criteria:** Login fails with appropriate error message

---

#### Test 1.3: Rate Limiting (Only if Upstash configured)
**URL:** http://localhost:3000/admin/login

**Steps:**
1. Attempt to login with wrong password 5 times in a row
2. On the 6th attempt, observe the response

**Expected:**
- After 5 failed attempts, shows: "Too many login attempts. Please try again later."
- HTTP 429 status code
- Lockout lasts 15 minutes

**Pass Criteria:** Rate limiting engages after 5 failed attempts

**Note:** If you see successful login attempts after 5 failures, rate limiting is not configured (Upstash Redis not set up).

---

#### Test 1.4: Session Persistence
**URL:** http://localhost:3000/admin

**Steps:**
1. Login successfully
2. Navigate to /admin
3. Refresh the page
4. Close tab and reopen http://localhost:3000/admin

**Expected:**
- Session persists across page refreshes
- Session persists when reopening browser tab
- No need to re-login

**Pass Criteria:** Session maintains authentication

---

#### Test 1.5: Logout
**URL:** http://localhost:3000/admin

**Steps:**
1. While logged in, click "Logout" button in sidebar footer
2. Confirm logout
3. Try to access /admin again

**Expected:**
- Redirects to /admin/login
- Session cookie is cleared
- Cannot access /admin without re-logging in

**Pass Criteria:** Successfully logged out and session cleared

---

### Phase 2: Merchant Management

#### Test 2.1: View Merchants List
**URL:** http://localhost:3000/admin/merchants

**Steps:**
1. Login as admin
2. Click "Merchants" in sidebar
3. Observe the merchants table

**Expected:**
- Table shows all merchants with columns:
  - Name
  - Email
  - Plan
  - Locations
  - Members
  - Points Distributed
  - Last Event
  - Actions (View button)
- Shows result count at top
- All data is properly formatted

**Pass Criteria:** Merchants table displays correctly with all data

---

#### Test 2.2: Search Merchants
**URL:** http://localhost:3000/admin/merchants

**Steps:**
1. In the search box at top, type a merchant name
2. Observe real-time filtering
3. Clear search and try searching by email
4. Clear search and try searching by slug

**Expected:**
- Table filters in real-time as you type
- Results update to show only matching merchants
- Works for name, email, and slug
- Shows "Showing X of Y merchants"

**Pass Criteria:** Search filters merchants correctly

---

#### Test 2.3: Filter by Plan
**URL:** http://localhost:3000/admin/merchants

**Steps:**
1. Use the "Plan" dropdown filter
2. Select "STARTER"
3. Observe filtered results
4. Try other plans (GROWTH, ENTERPRISE)
5. Select "All Plans"

**Expected:**
- Only merchants with selected plan are shown
- Combines with search filter if active
- "All Plans" shows everything

**Pass Criteria:** Plan filter works correctly

---

#### Test 2.4: View Merchant Details
**URL:** http://localhost:3000/admin/merchants/[id]

**Steps:**
1. From merchants list, click "View" on any merchant
2. Observe the merchant detail page

**Expected:**
- Shows 8 KPI cards:
  - Total Members
  - Total Locations
  - Total Events
  - Total Transactions
  - Total Points Distributed
  - Total Points Earned
  - Total Points Redeemed
  - Avg Points/Member
- Shows 5 tabs: Overview, Businesses, Members, Events, Transactions
- Overview tab is selected by default
- Top shows merchant name and edit button

**Pass Criteria:** Merchant detail page loads with correct KPIs

---

#### Test 2.5: View Merchant Members
**URL:** http://localhost:3000/admin/merchants/[id]

**Steps:**
1. On merchant detail page, click "Members" tab
2. Wait for members to load
3. Observe the members table

**Expected:**
- Table shows all members for this merchant
- Columns: Name, Email, Phone, Current Points, Total Earned, Total Redeemed, Tier, Actions
- Shows member count
- Each row has "View Details" button

**Pass Criteria:** Members table loads and displays correctly

---

#### Test 2.6: View Member Details Modal
**URL:** http://localhost:3000/admin/merchants/[id]

**Steps:**
1. On Members tab, click "View Details" for any member
2. Observe the modal popup

**Expected:**
- Modal opens with member information
- Shows: Name, Email, Phone, Tier, Points across all businesses
- Shows transaction history table
- Can close modal with X button or clicking outside

**Pass Criteria:** Member modal displays detailed information

---

#### Test 2.7: Update Merchant Settings
**URL:** http://localhost:3000/admin/merchants/[id]

**Steps:**
1. On merchant detail page, click "Edit Merchant" button
2. Update merchant settings (e.g., change plan, welcome points, etc.)
3. Save changes
4. Verify changes are reflected

**Expected:**
- Can update all merchant settings
- Changes save successfully
- Success message appears
- Audit log entry is created

**Pass Criteria:** Merchant settings update successfully

**Note:** This test requires the edit UI to be implemented. If not available, you can test the API directly using curl:

```bash
curl -X PUT http://localhost:3000/api/admin/merchants/[id] \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "GROWTH",
    "welcomePoints": 100,
    "earnPerVisit": 50
  }'
```

---

### Phase 3: Blog CMS

#### Test 3.1: View Blog Posts
**URL:** http://localhost:3000/admin/blog

**Steps:**
1. Login as admin
2. Click "Blog" in sidebar
3. Observe the blog posts table

**Expected:**
- Shows table with columns: Title, Slug, Category, Status, Published, Author, Actions
- Shows search box and filters (Status, Category)
- Shows "Create New Post" button
- Should show 4 migrated posts if migration was successful

**Pass Criteria:** Blog posts table displays correctly

---

#### Test 3.2: Search Blog Posts
**URL:** http://localhost:3000/admin/blog

**Steps:**
1. Type a post title in the search box
2. Observe real-time filtering

**Expected:**
- Table filters to show matching posts
- Search works on title and slug
- Updates result count

**Pass Criteria:** Search filters blog posts correctly

---

#### Test 3.3: Filter Blog Posts
**URL:** http://localhost:3000/admin/blog

**Steps:**
1. Use Status dropdown to filter by PUBLISHED
2. Observe results
3. Change to DRAFT
4. Use Category dropdown to filter by specific category

**Expected:**
- Status filter shows only posts with selected status
- Category filter shows only posts in selected category
- Filters can be combined

**Pass Criteria:** Filters work correctly

---

#### Test 3.4: Create New Blog Post
**URL:** http://localhost:3000/admin/blog/new

**Steps:**
1. Click "Create New Post" button
2. Observe the rich text editor

**Expected:**
- Shows form with fields:
  - Title
  - Slug (auto-generates from title)
  - Description
  - Content (Tiptap rich text editor)
  - Category dropdown
  - Read time (minutes)
  - Meta title, description, keywords
- Tiptap editor toolbar with: Bold, Italic, H1, H2, H3, Lists, Links
- Two buttons: "Save as Draft" and "Publish"

**Pass Criteria:** New post page loads with editor

---

#### Test 3.5: Auto-Slug Generation
**URL:** http://localhost:3000/admin/blog/new

**Steps:**
1. Leave slug field empty
2. Type a title like "My Test Blog Post 2025"
3. Observe slug field

**Expected:**
- Slug auto-generates as: "my-test-blog-post-2025"
- Converts to lowercase
- Replaces spaces with hyphens
- Removes special characters

**Pass Criteria:** Slug auto-generates correctly from title

---

#### Test 3.6: Rich Text Editor Functionality
**URL:** http://localhost:3000/admin/blog/new

**Steps:**
1. In the content editor, type some text
2. Select text and click Bold button
3. Select text and click Italic button
4. Click H1, H2, H3 buttons
5. Create bullet list
6. Create numbered list
7. Add a link

**Expected:**
- Bold button toggles bold text
- Italic button toggles italic text
- Heading buttons create headings
- List buttons create lists
- Link button prompts for URL and creates link
- Active formatting shows in toolbar (highlighted buttons)

**Pass Criteria:** All editor toolbar buttons work correctly

---

#### Test 3.7: Save Blog Post as Draft
**URL:** http://localhost:3000/admin/blog/new

**Steps:**
1. Fill in all required fields
2. Add content in editor
3. Click "Save as Draft"

**Expected:**
- Success message appears
- Post is created with status: DRAFT
- publishedAt is null
- Redirects to blog list or edit page
- Audit log entry created for CREATE_BLOG_POST

**Pass Criteria:** Draft post saves successfully

---

#### Test 3.8: Publish Blog Post
**URL:** http://localhost:3000/admin/blog/new

**Steps:**
1. Fill in all required fields
2. Add content in editor
3. Click "Publish"

**Expected:**
- Success message appears
- Post is created with status: PUBLISHED
- publishedAt is set to current date/time
- Audit log entry created

**Pass Criteria:** Published post saves successfully

---

#### Test 3.9: Edit Existing Blog Post
**URL:** http://localhost:3000/admin/blog/[id]

**Steps:**
1. From blog list, click "Edit" on any post
2. Observe the edit page
3. Make changes to title and content
4. Save

**Expected:**
- Edit page loads with all existing data populated
- Editor shows existing content with formatting preserved
- Changes save successfully
- Audit log entry created for EDIT_BLOG_POST

**Pass Criteria:** Post edits save correctly

---

#### Test 3.10: Delete Blog Post
**URL:** http://localhost:3000/admin/blog

**Steps:**
1. From blog list, click "Delete" on a test post
2. Confirm deletion

**Expected:**
- Confirmation prompt appears
- Post is deleted from database
- Redirects to blog list
- Post no longer appears in table
- Audit log entry created for DELETE_BLOG_POST

**Pass Criteria:** Post deletes successfully

---

### Phase 4: Advanced Features

#### Test 4.1: Staff Management API
**Note:** No UI exists yet for staff management. Test via API.

**Create Staff:**
```bash
curl -X POST http://localhost:3000/api/admin/staff \
  -H "Content-Type: application/json" \
  -H "Cookie: gob_admin_session=YOUR_SESSION_COOKIE" \
  -d '{
    "email": "staff@test.com",
    "password": "TestPassword123!",
    "fullName": "Test Staff Member",
    "merchantId": "MERCHANT_ID_HERE",
    "canManageMembers": true,
    "canViewReports": true,
    "canManageSettings": false
  }'
```

**Expected:**
- Returns 201 status
- Returns staff object with id
- Password is hashed (not returned in response)
- Audit log entry created

**Pass Criteria:** Staff member created successfully

---

#### Test 4.2: Password Reset
**URL:** http://localhost:3000/admin/password-reset

**Steps:**
1. Click "Password Reset" in sidebar
2. Enter a merchant email
3. Select "Merchant" from user type dropdown
4. Click "Reset Password"

**Expected:**
- Success message appears
- Temporary password is displayed (10 characters)
- Message says "Copy this password and share it with the user"
- User can now login with temporary password
- Audit log entry created for SEND_PASSWORD_RESET

**Pass Criteria:** Password reset generates temp password

---

#### Test 4.3: Password Reset for Staff
**URL:** http://localhost:3000/admin/password-reset

**Steps:**
1. Enter a staff member email
2. Select "Staff" from user type dropdown
3. Click "Reset Password"

**Expected:**
- Temporary password generated for staff account
- Staff can login with temp password

**Pass Criteria:** Staff password reset works

---

#### Test 4.4: Password Reset for Admin
**URL:** http://localhost:3000/admin/password-reset

**Steps:**
1. Enter an admin email
2. Select "Admin" from user type dropdown
3. Click "Reset Password"

**Expected:**
- Temporary password generated for admin account
- Admin can login with temp password

**Pass Criteria:** Admin password reset works

---

### Phase 5: Polish & Security

#### Test 5.1: View Audit Logs (Super Admin Only)
**URL:** http://localhost:3000/admin/audit-logs

**Steps:**
1. Login as SUPER ADMIN
2. Click "Audit Logs" in sidebar
3. Observe the audit logs table

**Expected:**
- Shows table with columns: Timestamp, Admin, Action, Entity Type, IP Address, Changes
- Shows total count at top
- Shows filters: Action, Entity Type
- Shows pagination controls

**Pass Criteria:** Audit logs display correctly

**Note:** If you login as regular ADMIN, you should see an error: "Audit logs are only accessible to Super Admins."

---

#### Test 5.2: Filter Audit Logs by Action
**URL:** http://localhost:3000/admin/audit-logs

**Steps:**
1. Use the "Action" dropdown
2. Select "LOGIN"
3. Observe filtered results
4. Try other actions (EDIT_MERCHANT, CREATE_BLOG_POST, etc.)

**Expected:**
- Table shows only logs with selected action
- Result count updates
- Pagination resets to page 1

**Pass Criteria:** Action filter works correctly

---

#### Test 5.3: Filter Audit Logs by Entity Type
**URL:** http://localhost:3000/admin/audit-logs

**Steps:**
1. Use the "Entity Type" dropdown
2. Select "Merchant"
3. Observe filtered results
4. Try other entity types (BlogPost, Staff, Auth)

**Expected:**
- Table shows only logs for selected entity type
- Can combine with action filter

**Pass Criteria:** Entity type filter works correctly

---

#### Test 5.4: View Audit Log Change Details
**URL:** http://localhost:3000/admin/audit-logs

**Steps:**
1. Find a log entry with changes (e.g., EDIT_MERCHANT)
2. Click "View Changes" details expander
3. Observe the JSON

**Expected:**
- Expandable details section opens
- Shows JSON with "before" and "after" values
- Properly formatted and readable
- Can collapse details

**Pass Criteria:** Change details display correctly

---

#### Test 5.5: Audit Logs Pagination
**URL:** http://localhost:3000/admin/audit-logs

**Steps:**
1. If there are more than 50 logs, observe pagination
2. Click "Next" button
3. Click "Previous" button
4. Observe page counter

**Expected:**
- Shows "Showing 1-50 of X logs"
- Next button loads next 50 logs
- Previous button goes back
- Page indicator shows current page
- Buttons disable appropriately (Previous on page 1, Next on last page)

**Pass Criteria:** Pagination works correctly

---

#### Test 5.6: Responsive Design - Desktop
**Browser Width:** 1920px

**Steps:**
1. Resize browser to 1920px width
2. Navigate through admin pages

**Expected:**
- Sidebar is 260px wide
- Content area uses remaining space
- Tables display all columns
- No horizontal scrolling
- Proper spacing and padding

**Pass Criteria:** Desktop view displays correctly

---

#### Test 5.7: Responsive Design - Tablet
**Browser Width:** 1024px

**Steps:**
1. Resize browser to 1024px width
2. Navigate through admin pages

**Expected:**
- Content padding reduces to 16px
- Table font size reduces to 13px
- Table cell padding reduces to 8px
- Everything still readable and functional

**Pass Criteria:** Tablet view displays correctly

---

#### Test 5.8: Responsive Design - Mobile
**Browser Width:** 768px

**Steps:**
1. Resize browser to 768px width
2. Navigate through admin pages

**Expected:**
- Sidebar moves to top of page (horizontal)
- Navigation items display in scrollable row
- Header stacks vertically
- Tables become horizontally scrollable
- Cards stack vertically

**Pass Criteria:** Mobile view displays correctly

---

#### Test 5.9: Responsive Design - Small Mobile
**Browser Width:** 480px

**Steps:**
1. Resize browser to 480px width
2. Navigate through admin pages

**Expected:**
- Brand font size reduces to 16px
- Button padding reduces to 8px 16px
- Card padding reduces to 12px
- Everything still usable on small screen

**Pass Criteria:** Small mobile view displays correctly

---

## Comprehensive Test Checklist

### Authentication & Rate Limiting
- [ ] Test 1.1: Admin Login (Valid)
- [ ] Test 1.2: Admin Login (Invalid)
- [ ] Test 1.3: Rate Limiting
- [ ] Test 1.4: Session Persistence
- [ ] Test 1.5: Logout

### Merchant Management
- [ ] Test 2.1: View Merchants List
- [ ] Test 2.2: Search Merchants
- [ ] Test 2.3: Filter by Plan
- [ ] Test 2.4: View Merchant Details
- [ ] Test 2.5: View Merchant Members
- [ ] Test 2.6: View Member Details Modal
- [ ] Test 2.7: Update Merchant Settings

### Blog CMS
- [ ] Test 3.1: View Blog Posts
- [ ] Test 3.2: Search Blog Posts
- [ ] Test 3.3: Filter Blog Posts
- [ ] Test 3.4: Create New Blog Post
- [ ] Test 3.5: Auto-Slug Generation
- [ ] Test 3.6: Rich Text Editor Functionality
- [ ] Test 3.7: Save as Draft
- [ ] Test 3.8: Publish Post
- [ ] Test 3.9: Edit Post
- [ ] Test 3.10: Delete Post

### Advanced Features
- [ ] Test 4.1: Staff Management API
- [ ] Test 4.2: Password Reset (Merchant)
- [ ] Test 4.3: Password Reset (Staff)
- [ ] Test 4.4: Password Reset (Admin)

### Polish & Security
- [ ] Test 5.1: View Audit Logs
- [ ] Test 5.2: Filter by Action
- [ ] Test 5.3: Filter by Entity Type
- [ ] Test 5.4: View Change Details
- [ ] Test 5.5: Pagination
- [ ] Test 5.6: Desktop Responsive
- [ ] Test 5.7: Tablet Responsive
- [ ] Test 5.8: Mobile Responsive
- [ ] Test 5.9: Small Mobile Responsive

---

## Known Limitations

1. **Staff Management UI:** No UI exists yet for viewing/editing staff. Must use API directly.

2. **Merchant Edit UI:** No inline edit form exists on merchant detail page. Must use API directly or add edit form.

3. **Rate Limiting:** Only works if Upstash Redis is configured. Gracefully degrades otherwise.

4. **Image Upload:** Tiptap editor has image support, but no image upload handler is implemented yet.

---

## Reporting Issues

If you find any bugs during testing:

1. Note the test number and description
2. Record exact steps to reproduce
3. Note expected vs actual behavior
4. Include browser console errors if any
5. Take screenshots if helpful

---

## Post-Testing Tasks

After completing all tests:
- [ ] Document all bugs found
- [ ] Prioritize bugs (Critical, High, Medium, Low)
- [ ] Create admin user documentation
- [ ] Consider adding missing UI (staff management, merchant edit form)
- [ ] Consider adding image upload for blog posts
- [ ] Set up Upstash Redis for production rate limiting
