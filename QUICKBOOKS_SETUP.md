# QuickBooks Integration Setup Guide

This guide explains how to set up the QuickBooks integration for the Finance Hub.

## Prerequisites

1. **Intuit Developer Account**: Sign up at https://developer.intuit.com/
2. **QuickBooks App**: Create a new app in the Intuit Developer Dashboard
3. **App Credentials**: Note your Client ID and Client Secret

## App Configuration

The app is configured with **Production** credentials:
- **Client ID**: `ABrb8WSjbtNgNncrOBdtTktvg3o4ODoKA5cyEwdadWO0O6rPGS`
- **Client Secret**: `RV6biSiVZ4mO0cFyGlDIV7fDSyH299YSV7b7FgAU`
- **Environment**: Production

## Environment Variables

Add the following environment variables to your `.env.local` file and Vercel project settings:

```env
# QuickBooks OAuth Configuration (Production)
QUICKBOOKS_CLIENT_ID=ABrb8WSjbtNgNncrOBdtTktvg3o4ODoKA5cyEwdadWO0O6rPGS
QUICKBOOKS_CLIENT_SECRET=RV6biSiVZ4mO0cFyGlDIV7fDSyH299YSV7b7FgAU
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=production
NEXT_PUBLIC_QUICKBOOKS_PRODUCTION_DOMAIN=https://pod.floorinteriorservices.com

# QuickBooks Webhook Configuration (optional but recommended)
QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN=your_verifier_token_from_intuit_dashboard

# For production deployment:
# QUICKBOOKS_REDIRECT_URI=https://pod.floorinteriorservices.com/api/quickbooks/callback
```

## Intuit Developer Dashboard Configuration

### OAuth Configuration

1. Go to https://developer.intuit.com/app/developer/dashboard
2. Select your app: **FISPOD** (Production Client ID: `ABrb8WSjbtNgNncrOBdtTktvg3o4ODoKA5cyEwdadWO0O6rPGS`)
3. Navigate to **Settings** → **Redirect URIs**
4. Click the **"Production"** tab (not Development)
5. Add the following redirect URIs:
   - **Production**: `https://pod.floorinteriorservices.com/api/quickbooks/callback`
   - **Local Development**: `http://localhost:3000/api/quickbooks/callback`

### Webhook Configuration

1. In the Intuit Developer Dashboard, navigate to **Webhooks** section
2. Select the environment (Development or Production)
3. Set up your webhook endpoint:
   - **Endpoint URL**: 
     - Development: `http://localhost:3000/api/quickbooks/webhook`
     - Production: `https://pod.floorinteriorservices.com/api/quickbooks/webhook`
4. Click **Show verifier token** and copy the token
5. Add the verifier token to your environment variables as `QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN`
6. Select the events you want to subscribe to:
   - **Entity**: Account, Invoice, Customer, Vendor, Payment, etc.
   - **Operation**: Create, Update, Delete
   - Click on each entity to select specific operations
7. Choose payload format:
   - **Legacy format** (default): Standard webhook payload
   - **Cloud event format**: Newer format (requires updating webhook handler)
8. Click **Save** to activate webhooks

## Database Setup

Run the following SQL in your Supabase SQL Editor to create the `quickbooks_connections` table:

```sql
-- See database/quickbooks_connections.sql for the complete migration
```

Or execute the migration file:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `database/quickbooks_connections.sql`
4. Run the migration

## OAuth Flow

The integration uses OAuth 2.0 with the following flow:

1. **User clicks "Connect to QuickBooks"** → Redirects to Intuit OAuth page
2. **User authorizes** → Intuit redirects back with authorization code
3. **Callback handler** → Exchanges code for access/refresh tokens
4. **Tokens stored** → Saved securely in `quickbooks_connections` table
5. **Connection status** → Displayed in Finance Hub

## API Endpoints

### GET `/api/quickbooks/status`
Check if user has an active QuickBooks connection.

**Headers:**
```
Authorization: Bearer {user_email}
```

**Response:**
```json
{
  "connected": true,
  "companyName": "Your Company Name",
  "connectedAt": "2025-01-01T00:00:00Z",
  "realmId": "123456789"
}
```

### GET `/api/quickbooks/callback`
OAuth callback handler (called by Intuit after authorization).

**Query Parameters:**
- `code`: Authorization code
- `realmId`: QuickBooks company ID
- `state`: OAuth state parameter

### POST `/api/quickbooks/disconnect`
Disconnect QuickBooks connection and remove stored tokens.

**Headers:**
```
Authorization: Bearer {user_email}
```

### POST `/api/quickbooks/webhook`
Receives webhook notifications from QuickBooks when data changes.

**Headers:**
```
intuit-signature: {signature} (if verifier token is configured)
```

**Payload:**
```json
{
  "eventNotifications": [
    {
      "realmId": "123456789",
      "dataChangeEvent": {
        "entities": [
          {
            "name": "Account",
            "id": "1",
            "operation": "Update"
          }
        ]
      }
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Webhook processed successfully"
}
```

**Note:** This endpoint is called by Intuit, not by your application. Configure it in the Intuit Developer Dashboard under Webhooks.

## Security Notes

- OAuth tokens are stored encrypted in the database
- Tokens are user-specific (one connection per user)
- Tokens expire and can be refreshed using the refresh token
- Users can disconnect at any time
- Row Level Security (RLS) policies ensure users can only access their own connections

## Testing

1. Start your development server: `npm run dev`
2. Navigate to `/finance-hub`
3. Click "Connect to QuickBooks"
4. Authorize the app in the Intuit OAuth page
5. You should be redirected back with a success message

## Troubleshooting

### "You need admin permissions to connect this app"
- This is a QuickBooks permission issue (it happens on Intuit’s authorization screen before returning to your app).
- Sign in to QuickBooks as a **Master Admin** or **Company Admin**, then try again.
- If you are not an admin for that QuickBooks company, ask your company admin to connect/authorize the app.

### "Token exchange failed"
- Verify `QUICKBOOKS_CLIENT_SECRET` is set correctly
- Check that redirect URI matches exactly in Intuit Developer Dashboard
- Ensure the app is in "Development" mode for sandbox testing

### "User not found"
- Make sure you're logged in before connecting
- Check that user exists in the `users` table

### "Database error"
- Run the database migration (`database/quickbooks_connections.sql`)
- Verify Supabase connection is working
- Check that RLS policies are created

## Production Deployment

1. Update redirect URI in Intuit Developer Dashboard to production URL
2. Set environment variables in Vercel
3. Run database migration in production Supabase instance
4. Test the OAuth flow in production

## Webhooks

Webhooks allow your application to receive real-time notifications when data changes in QuickBooks. This eliminates the need to poll the API.

### Setting Up Webhooks

1. **Configure in Intuit Dashboard** (see Webhook Configuration above)
2. **Add verifier token** to environment variables
3. **Deploy your webhook endpoint** to a publicly accessible URL
4. **Test webhook delivery** by making changes in QuickBooks

### Webhook Events

Common entities you can subscribe to:
- **Account**: Chart of accounts changes
- **Invoice**: Invoice creation, updates, deletions
- **Customer**: Customer information changes
- **Vendor**: Vendor information changes
- **Payment**: Payment transactions
- **Item**: Product/service items
- **Purchase**: Purchase orders and bills

### Webhook Processing

The webhook endpoint (`/api/quickbooks/webhook`) automatically:
- ✅ Verifies webhook signatures (if verifier token is set)
- ✅ Parses event notifications
- ✅ Handles multiple entities in a single webhook
- ✅ Logs all events for debugging
- ✅ Returns success response to prevent retries

You can customize the `handleEntityChange` function in the webhook handler to:
- Sync data to your database
- Trigger notifications
- Update cache
- Send emails
- Perform custom business logic

## Next Steps

After successful connection, you can:
- Fetch company information
- Query invoices and payments
- Access financial reports
- Sync accounting data
- Receive real-time updates via webhooks

See QuickBooks API documentation: https://developer.intuit.com/app/developer/qbo/docs

