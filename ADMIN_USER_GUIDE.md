# GetOnBlockchain Admin System User Guide

**Version:** 1.0
**Last Updated:** December 29, 2025

Welcome to the GetOnBlockchain Admin System. This guide will help you manage merchants, blog content, staff accounts, and monitor system activity.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Merchants](#managing-merchants)
4. [Managing Blog Posts](#managing-blog-posts)
5. [Managing Staff](#managing-staff)
6. [Resetting Passwords](#resetting-passwords)
7. [Viewing Audit Logs](#viewing-audit-logs-super-admin-only)
8. [User Roles & Permissions](#user-roles--permissions)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Admin Panel

1. Navigate to: **https://your-domain.com/admin/login**
2. Enter your admin email address
3. Enter your password
4. Click **"Login"**

After successful login, you'll be redirected to the admin dashboard.

### First Time Login

If this is your first time logging in, you should have received:
- Your admin email address
- A temporary password

**Important:** Change your temporary password immediately after first login by contacting your Super Administrator.

### Security Note

For your security:
- After 5 failed login attempts, your IP address will be temporarily blocked for 15 minutes
- Always log out when you're done using the admin panel
- Never share your login credentials with anyone

---

## Dashboard Overview

The admin dashboard consists of:

### Sidebar Navigation

Located on the left side of the screen, the sidebar provides access to all admin functions:

- **Dashboard** - Home page with quick stats
- **Merchants** - Manage all merchant accounts
- **Blog** - Create and manage blog content
- **Audit Logs** - View system activity (Super Admin only)
- **Password Reset** - Reset user passwords
- **Logout** - Sign out of the admin panel

### Top Header

The header displays:
- Current page title
- Your name and role badge (SUPER ADMIN, ADMIN, or EDITOR)

---

## Managing Merchants

Merchants are the businesses that use GetOnBlockchain's loyalty program platform.

### Viewing All Merchants

1. Click **"Merchants"** in the sidebar
2. You'll see a table showing all merchants with:
   - Business name
   - Login email
   - Current plan (Starter, Growth, Enterprise)
   - Number of locations
   - Number of members
   - Total points distributed
   - Last event timestamp

### Searching for Merchants

Use the search box at the top to find merchants by:
- Business name
- Email address
- Slug (URL identifier)

Results filter in real-time as you type.

### Filtering by Plan

Use the **"Plan"** dropdown to show only merchants on a specific plan:
- Starter
- Growth
- Enterprise
- All Plans

### Viewing Merchant Details

1. Click **"View"** next to any merchant
2. You'll see detailed information organized in tabs:

#### Overview Tab

Shows key performance indicators (KPIs):
- **Total Members** - Number of loyalty program members
- **Total Locations** - Number of business locations
- **Total Events** - Number of member interactions
- **Total Transactions** - Total reward transactions
- **Total Points Distributed** - All points given out
- **Total Points Earned** - Points members have earned
- **Total Points Redeemed** - Points members have spent
- **Avg Points/Member** - Average points per member

#### Businesses Tab

Lists all business locations for this merchant with:
- Location name
- Address
- Member count
- Transaction count

#### Members Tab

Shows all loyalty program members for this merchant:
- Member name, email, phone
- Current points balance
- Total points earned
- Total points redeemed
- VIP tier status

Click **"View Details"** on any member to see:
- Complete member information
- Transaction history
- Points balance across all locations

#### Events Tab

Recent member interactions:
- Check-ins
- Reward redemptions
- Point adjustments
- Timestamp and location

#### Transactions Tab

Recent reward transactions:
- Transaction type (Earn, Redeem, Payout)
- Points amount
- Member name
- Business location
- Date and time

### Updating Merchant Settings

**Note:** Currently, merchant settings can only be updated via API. A UI form will be added in a future update.

To update merchant settings, contact your technical administrator or use the API directly:

```bash
PUT /api/admin/merchants/[merchant-id]
```

Updatable fields:
- Plan (Starter, Growth, Enterprise)
- Welcome points (points new members receive)
- Points per visit
- VIP threshold
- Brand colors
- Payout settings
- Notification email

---

## Managing Blog Posts

The blog CMS allows you to create and manage content for the GetOnBlockchain blog.

### Viewing All Blog Posts

1. Click **"Blog"** in the sidebar
2. You'll see all blog posts with:
   - Title
   - URL slug
   - Category
   - Status (Draft or Published)
   - Publish date
   - Author name

### Searching Blog Posts

Use the search box to find posts by title or slug.

### Filtering Blog Posts

Use the filter dropdowns to narrow results:
- **Status:** Draft, Published, or All
- **Category:** Marketing, Product, Guide, Customer Stories, or All

### Creating a New Blog Post

1. Click **"Create New Post"** button
2. Fill in the post details:

#### Required Fields

- **Title:** The blog post headline
- **Slug:** URL-friendly identifier (auto-generates from title)
- **Description:** Short summary (shown in previews and search results)
- **Content:** The full article (use the rich text editor)

#### Optional Fields

- **Category:** Marketing, Product, Guide, or Customer Stories
- **Read Time:** Estimated minutes to read
- **Meta Title:** SEO title (defaults to post title)
- **Meta Description:** SEO description (defaults to post description)
- **Meta Keywords:** SEO keywords (comma-separated)

#### Using the Rich Text Editor

The content editor toolbar provides:
- **Bold** - Make text bold
- **Italic** - Italicize text
- **H1, H2, H3** - Create headings
- **Bullet List** - Create bulleted lists
- **Numbered List** - Create numbered lists
- **Link** - Add hyperlinks
- **Undo/Redo** - Undo or redo changes

To format text:
1. Select the text you want to format
2. Click the appropriate toolbar button
3. For links, click the link button and enter the URL

#### Saving Your Post

You have two options:

**Save as Draft:**
- Saves the post but doesn't publish it
- Post is only visible in the admin panel
- Use this for posts that aren't ready to go live

**Publish:**
- Makes the post live on the website immediately
- Sets the publish date to now
- Post is visible to all website visitors

### Editing an Existing Post

1. From the blog posts list, click **"Edit"** next to any post
2. Make your changes
3. Click **"Save as Draft"** or **"Publish"**

The editor will load with all existing content, including formatting.

### Deleting a Blog Post

1. From the blog posts list, click **"Delete"** next to any post
2. Confirm the deletion

**Warning:** Deleting a post is permanent and cannot be undone. The post will be removed from the website immediately.

### Publishing a Draft

To publish a draft post:
1. Click **"Edit"** on the draft post
2. Make any final changes
3. Click **"Publish"**

The post will immediately go live on the website.

### Unpublishing a Post

To take down a published post:
1. Edit the post
2. Change status to Draft
3. Save

The post will no longer be visible on the public website but remains in the admin panel.

---

## Managing Staff

Staff members are employees who manage individual merchant accounts. They have limited permissions compared to admins.

**Note:** Currently, staff management is only available via API. A UI will be added in a future update.

### Creating Staff Members

To create a new staff member, use the API:

```bash
POST /api/admin/staff
```

Required information:
- Email address
- Password (will be hashed)
- Full name
- Merchant ID (which merchant they work for)
- Permissions:
  - Can manage members
  - Can view reports
  - Can manage settings

### Staff Permissions

Staff accounts can have three types of permissions:

- **Can Manage Members:** Create, edit, and view loyalty program members
- **Can View Reports:** Access analytics and reporting features
- **Can Manage Settings:** Update merchant settings and configuration

### Updating Staff Accounts

To update a staff member:

```bash
PUT /api/admin/staff/[staff-id]
```

You can change:
- Name
- Permissions
- Active/inactive status

### Deactivating Staff

Instead of deleting staff accounts, you can deactivate them:

```bash
PUT /api/admin/staff/[staff-id]
{ "isActive": false }
```

Deactivated staff cannot log in, but their account history is preserved.

### Deleting Staff

To permanently delete a staff member:

```bash
DELETE /api/admin/staff/[staff-id]
```

**Warning:** This action cannot be undone.

---

## Resetting Passwords

As an admin, you can reset passwords for merchants, staff, and other admins.

### How to Reset a Password

1. Click **"Password Reset"** in the sidebar
2. Enter the user's email address
3. Select the user type:
   - **Merchant:** Business owner accounts
   - **Staff:** Merchant staff accounts
   - **Admin:** Admin panel users
4. Click **"Reset Password"**

### After Reset

The system will generate a temporary password and display it on screen:
- The password is 10 characters long
- It contains letters and numbers
- **Important:** Copy this password immediately

### Sharing the Temporary Password

You must manually share the temporary password with the user:
- Send it via email (not recommended for security)
- Call them and read it over the phone
- Use a secure password sharing tool
- Meet in person

**Security Best Practice:** Ask the user to change their password immediately after logging in with the temporary password.

### What Happens to the Old Password

The old password is immediately replaced and can no longer be used. The user must use the temporary password to log in.

---

## Viewing Audit Logs (Super Admin Only)

Audit logs track all administrative actions for security and compliance.

**Access Level:** Super Admin only

### Accessing Audit Logs

1. Click **"Audit Logs"** in the sidebar
2. You'll see a table of all admin actions with:
   - Timestamp
   - Admin name and email
   - Action type (Login, Edit Merchant, Create Blog Post, etc.)
   - Entity type (Merchant, BlogPost, Staff, etc.)
   - IP address
   - Change details

### Filtering Audit Logs

Use the filter dropdowns to narrow results:

#### Filter by Action

- LOGIN - Admin login events
- LOGOUT - Admin logout events
- EDIT_MERCHANT - Merchant account updates
- CREATE_STAFF - New staff accounts
- EDIT_STAFF - Staff account updates
- DELETE_STAFF - Staff account deletions
- CREATE_BLOG_POST - New blog posts
- EDIT_BLOG_POST - Blog post updates
- DELETE_BLOG_POST - Blog post deletions
- SEND_PASSWORD_RESET - Password resets

#### Filter by Entity Type

- Auth - Authentication events
- Merchant - Merchant-related actions
- Staff - Staff-related actions
- BlogPost - Blog post actions
- Admin - Admin account actions

### Viewing Change Details

For actions that modify data, you can view the before/after changes:

1. Click **"View Changes"** in the Changes column
2. You'll see a JSON object showing:
   - **before:** What the data looked like before the change
   - **after:** What the data looks like after the change

This is useful for:
- Tracking who changed what
- Auditing compliance
- Investigating issues
- Reverting problematic changes

### Pagination

Audit logs are displayed 50 at a time:
- Use **"Previous"** and **"Next"** buttons to navigate
- Current page number is shown in the center
- Total log count is displayed at the top

### Audit Log Retention

All audit logs are retained indefinitely for compliance purposes. They cannot be deleted by any user.

---

## User Roles & Permissions

The admin system has three user roles:

### Super Admin

**Full System Access**
- Manage merchants
- Manage blog posts
- Manage staff
- Reset passwords
- **View audit logs** (exclusive)
- Manage other admins

Super Admins have complete control over the platform.

### Admin

**Most Administrative Functions**
- Manage merchants
- Manage blog posts
- Manage staff
- Reset passwords
- ❌ Cannot view audit logs
- ❌ Cannot manage other admins

Admins can handle day-to-day operations but cannot view sensitive audit trails.

### Editor

**Content Management Focus**
- ❌ Cannot manage merchants
- Manage blog posts (create, edit, publish)
- ❌ Cannot manage staff
- ❌ Cannot reset passwords
- ❌ Cannot view audit logs

Editors are focused on content creation and management.

### Permission Matrix

| Feature | Super Admin | Admin | Editor |
|---------|-------------|-------|--------|
| View Merchants | ✅ | ✅ | ❌ |
| Edit Merchants | ✅ | ✅ | ❌ |
| View Blog Posts | ✅ | ✅ | ✅ |
| Create Blog Posts | ✅ | ✅ | ✅ |
| Edit Blog Posts | ✅ | ✅ | ✅ |
| Delete Blog Posts | ✅ | ✅ | ✅ |
| Manage Staff | ✅ | ✅ | ❌ |
| Reset Passwords | ✅ | ✅ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ |
| Manage Admins | ✅ | ❌ | ❌ |

---

## Best Practices

### Security

1. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Don't reuse passwords from other sites

2. **Log Out When Done**
   - Always click "Logout" when finished
   - Never leave your session unattended
   - Close the browser tab completely

3. **Protect Your Credentials**
   - Never share your password with anyone
   - Don't write down passwords
   - Be cautious of phishing emails

4. **Monitor Audit Logs** (Super Admin)
   - Review logs regularly for suspicious activity
   - Investigate unexpected logins
   - Track changes to critical merchant settings

### Content Management

1. **Use Drafts Liberally**
   - Write blog posts in draft mode first
   - Have someone review before publishing
   - Double-check for typos and formatting

2. **SEO Optimization**
   - Always fill in meta descriptions
   - Use relevant keywords
   - Create descriptive, unique titles

3. **Keep Slugs Clean**
   - Use lowercase letters and hyphens only
   - Keep slugs short but descriptive
   - Don't change slugs after publishing (breaks links)

4. **Categorize Properly**
   - Choose the most relevant category
   - Be consistent with categorization
   - Use categories to organize content logically

### Merchant Management

1. **Verify Before Updating**
   - Double-check merchant ID before making changes
   - Confirm changes with the merchant first
   - Test changes in a staging environment if possible

2. **Document Changes**
   - Note why you're making changes
   - Keep merchant communication records
   - Review audit logs after major updates

3. **Handle Sensitive Data Carefully**
   - Don't share merchant data with unauthorized users
   - Follow GDPR and privacy regulations
   - Anonymize data when possible

### Password Resets

1. **Verify Identity**
   - Confirm you're talking to the actual user
   - Use secondary verification (phone call, video chat)
   - Don't reset passwords via email requests alone

2. **Secure Communication**
   - Use secure channels to share temporary passwords
   - Don't send passwords in plain text emails
   - Encourage users to change passwords immediately

3. **Document Resets**
   - Note why the reset was requested
   - Check audit logs to confirm completion
   - Follow up with the user to ensure success

---

## Troubleshooting

### Cannot Log In

**Issue:** Login fails with "Invalid email or password"

**Solutions:**
1. Double-check your email and password (case-sensitive)
2. Ensure Caps Lock is off
3. Try copying and pasting your password
4. Contact your Super Admin for a password reset

---

**Issue:** "Too many login attempts" error

**Solutions:**
1. Wait 15 minutes before trying again
2. Your IP address has been temporarily blocked for security
3. Ensure you're using the correct password to avoid further lockouts

---

### Cannot Access Audit Logs

**Issue:** Audit Logs menu shows "Access Denied"

**Solutions:**
1. Audit logs are only accessible to Super Admins
2. If you need access, request a role upgrade from your Super Admin
3. Regular Admins and Editors cannot view audit logs

---

### Blog Post Won't Publish

**Issue:** Publish button doesn't work or post doesn't appear on website

**Solutions:**
1. Ensure all required fields are filled in (title, slug, description, content)
2. Check that slug doesn't already exist (must be unique)
3. Refresh the page and try again
4. Check browser console for errors (press F12)

---

### Rich Text Editor Not Loading

**Issue:** Blog post editor shows blank or doesn't load toolbar

**Solutions:**
1. Refresh the page (Ctrl+R or Cmd+R)
2. Clear browser cache and cookies
3. Try a different browser (Chrome recommended)
4. Disable browser extensions that might interfere
5. Contact technical support if issue persists

---

### Merchant Data Not Showing

**Issue:** Merchant details page shows "Loading..." or empty data

**Solutions:**
1. Refresh the page
2. Check your internet connection
3. Ensure the merchant still exists in the database
4. Try accessing a different merchant
5. Contact technical support if all merchants fail to load

---

### Session Expires Unexpectedly

**Issue:** Logged out randomly or redirected to login page

**Solutions:**
1. Sessions may expire after period of inactivity
2. Log back in and continue working
3. Save your work frequently to avoid data loss
4. Contact technical support if issue happens repeatedly

---

### Search/Filter Not Working

**Issue:** Search or filter dropdowns don't filter results

**Solutions:**
1. Clear the search field and try again
2. Refresh the page
3. Try different search terms
4. Ensure JavaScript is enabled in your browser
5. Clear browser cache if issue persists

---

## Need More Help?

### Technical Support

For technical issues, bugs, or system errors:
- Email: support@getonblockchain.com
- Include: Your role, what you were trying to do, and any error messages

### Account Issues

For login problems or account access:
- Contact your Super Administrator
- Provide: Your email address and when you last successfully logged in

### Feature Requests

To request new features or improvements:
- Email: product@getonblockchain.com
- Describe: The feature and how it would help you

---

## Appendix: Keyboard Shortcuts

### Rich Text Editor

- **Bold:** Ctrl+B (Windows) or Cmd+B (Mac)
- **Italic:** Ctrl+I (Windows) or Cmd+I (Mac)
- **Undo:** Ctrl+Z (Windows) or Cmd+Z (Mac)
- **Redo:** Ctrl+Shift+Z (Windows) or Cmd+Shift+Z (Mac)
- **Link:** Ctrl+K (Windows) or Cmd+K (Mac)

### General

- **Search Page:** Ctrl+F (Windows) or Cmd+F (Mac)
- **Refresh Page:** Ctrl+R (Windows) or Cmd+R (Mac)
- **Open Console:** F12 (for troubleshooting)

---

**End of Guide**

**Version History:**
- v1.0 (December 29, 2025) - Initial release

---

© 2025 GetOnBlockchain. All rights reserved.
