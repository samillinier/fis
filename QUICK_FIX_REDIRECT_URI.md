# ⚡ Quick Fix: Redirect URI Error

## Error:
"The provided value for the input parameter 'redirect_uri' is not valid"

## ✅ Quick Fix (5 minutes):

### Step 1: Go to Azure Portal
https://portal.azure.com → Azure AD → App registrations → "FIS POD"

### Step 2: Add Redirect URIs
Authentication → Single-page application → Add URI

**Add these 4 URIs:**

1. `https://pod.floorinteriorservices.com/signin`
2. `https://pod.floorinteriorservices.com`
3. `http://localhost:3000/signin`
4. `http://localhost:3000`

### Step 3: Save & Wait
- Click **"Save"**
- **Wait 5-10 minutes**

### Step 4: Test
- Go to: https://pod.floorinteriorservices.com/signin
- Click "Sign in with Microsoft"
- ✅ Should work!

---

**That's it! After waiting 5-10 minutes, try sign-in again.** 🚀

