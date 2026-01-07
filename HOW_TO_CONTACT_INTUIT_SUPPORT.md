# How to Contact Intuit Developer Support

## Support Channels

### 1. Intuit Developer Support Portal (Recommended)

**URL:** https://help.developer.intuit.com/

**Steps:**
1. Go to: https://help.developer.intuit.com/
2. Sign in with your Intuit Developer account
3. Click **"Contact Support"** or **"Submit a Request"**
4. Fill out the support form with your issue details

### 2. Intuit Developer Forums

**URL:** https://help.developer.intuit.com/s/forums

**Steps:**
1. Go to: https://help.developer.intuit.com/s/forums
2. Search for similar issues first
3. If not found, create a new post
4. Include all relevant details (see below)

### 3. Intuit Developer Dashboard - Support

**Steps:**
1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Look for **"Support"** link in the top navigation
3. Click it to access support options

### 4. Email Support

**Email:** Check the Intuit Developer Dashboard for support email addresses

## What Information to Include

When contacting Intuit support, include:

### App Information
- **App Name:** FISPOD
- **App ID:** 694ad793-ff6f-442d-8fce-1ece6e00117b
- **Client ID:** ABMV1B9HBoITUbAgKwba2l6UmW5h7bCYRE83jo8jalFVgbc414
- **Environment:** Development (Sandbox)

### Issue Details
- **Error Message:** "Sorry, but undefined didn't connect"
- **Error URL:** `https://appcenter.intuit.com/app/connect/oauth2/error?client_id=...`
- **Redirect URI:** `https://fis-phi.vercel.app/api/quickbooks/callback`

### What You've Tried
- Verified App Name is set to "FISPOD"
- Verified redirect URI is registered in Development tab
- Verified Client ID matches Intuit Dashboard
- Code is correctly configured

### Question to Ask

**Suggested message:**

```
Subject: "undefined didn't connect" Error - OAuth Connection Issue

Hello Intuit Developer Support,

I'm experiencing an issue connecting my application to QuickBooks via OAuth 2.0.

App Details:
- App Name: FISPOD
- App ID: 694ad793-ff6f-442d-8fce-1ece6e00117b
- Client ID: ABMV1B9HBoITUbAgKwba2l6UmW5h7bCYRE83jo8jalFVgbc414
- Environment: Development (Sandbox)

Issue:
When users click "Connect to QuickBooks", they are redirected to Intuit's OAuth page but receive the error: "Sorry, but undefined didn't connect."

OAuth Request Details:
- Redirect URI: https://fis-phi.vercel.app/api/quickbooks/callback
- Scope: com.intuit.quickbooks.accounting
- Response Type: code
- Access Type: offline

Configuration Verified:
- ✅ App Name is set to "FISPOD" in Intuit Dashboard
- ✅ Redirect URI is registered in Settings → Redirect URIs → Development tab
- ✅ Client ID matches between code and Intuit Dashboard
- ✅ App Status: IN DEVELOPMENT
- ✅ Redirect URI endpoint exists and responds correctly

The redirect URI and Client ID in the OAuth request are correct, but Intuit is unable to identify the app, resulting in the "undefined didn't connect" error.

Could you please:
1. Verify if the app is properly activated for OAuth connections?
2. Check if there are any additional configuration steps required?
3. Confirm if the redirect URI is correctly registered in your system?

Thank you for your assistance.
```

## Quick Links

- **Support Portal:** https://help.developer.intuit.com/
- **Forums:** https://help.developer.intuit.com/s/forums
- **Developer Dashboard:** https://developer.intuit.com/app/developer/dashboard
- **Documentation:** https://developer.intuit.com/app/developer/qbo/docs

## Tips for Getting Help

1. **Be Specific:** Include exact error messages and URLs
2. **Provide Context:** Explain what you're trying to do
3. **Include Details:** App ID, Client ID, redirect URI, etc.
4. **Show What You've Tried:** List your troubleshooting steps
5. **Be Patient:** Support may take 24-48 hours to respond

## Alternative: Check Documentation First

Before contacting support, check:
- **OAuth Documentation:** https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0
- **Troubleshooting Guides:** Search Intuit Developer documentation for common issues
- **API Explorer:** Test your API calls directly

Good luck! 🚀
