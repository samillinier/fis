# QuickBooks Webhook Setup Guide

This guide walks you through setting up webhooks to receive real-time notifications from QuickBooks.

## What Are Webhooks?

Webhooks allow QuickBooks to notify your application immediately when data changes (e.g., new invoice, updated customer, deleted account). This is more efficient than polling the API.

## Step-by-Step Setup

### 1. Configure Webhook Endpoint in Intuit Dashboard

1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Select your app: **FISPOD** (AppID: `694ad793-ff6f-442d-8fce-1ece6e00117b`)
3. Click **Webhooks** in the left sidebar
4. Select **Development** or **Production** tab (depending on your environment)

### 2. Set Endpoint URL

In the **Set up endpoints** section:

- **Development**: `http://localhost:3000/api/quickbooks/webhook`
- **Production**: `https://your-production-domain.vercel.app/api/quickbooks/webhook`

**Important:** 
- Replace `your-production-domain.vercel.app` with your actual Vercel domain
- The URL must be publicly accessible (localhost only works for development with tunneling tools like ngrok)

### 3. Get Verifier Token

1. Click **Show verifier token** toggle
2. Copy the token that appears
3. Add it to your environment variables:

**In Vercel:**
- Go to Project → Settings → Environment Variables
- Add: `QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN` = `{your_copied_token}`
- Select all environments (Production, Preview, Development)

**In `.env.local` (for local development):**
```env
QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN=your_copied_token_here
```

### 4. Select Subscribed Events

In the **Subscribed events** section:

1. Choose which entities you want to monitor:
   - **Account**: Chart of accounts changes
   - **Invoice**: Invoice creation/updates/deletions
   - **Customer**: Customer information changes
   - **Vendor**: Vendor information changes
   - **Payment**: Payment transactions
   - **Item**: Product/service items
   - **Purchase**: Purchase orders and bills

2. For each entity, click the row to expand and select operations:
   - ✅ **Create**: New records
   - ✅ **Update**: Modified records
   - ✅ **Delete**: Deleted records

3. You'll see "X SELECTED" indicating how many events are chosen

### 5. Choose Payload Format

- **Legacy format** (default): Standard webhook payload (recommended)
- **Cloud event format**: Newer format (requires code changes)

**Recommendation:** Use Legacy format unless you have specific requirements.

### 6. Save Configuration

Click the **Save** button on the right side of the "Subscribed events" section.

### 7. Deploy Your Application

After setting up webhooks:

1. Make sure your webhook endpoint is deployed and accessible
2. For local development, use a tunneling service like ngrok:
   ```bash
   ngrok http 3000
   ```
   Then use the ngrok URL in the Intuit Dashboard

3. For production, deploy to Vercel and use your production URL

### 8. Test Webhooks

1. Make a change in QuickBooks (e.g., create an invoice, update a customer)
2. Check your application logs for webhook notifications
3. Verify the webhook endpoint receives and processes the events

## Webhook Endpoint Details

Your webhook endpoint is located at:
- **Route**: `/api/quickbooks/webhook`
- **Method**: `POST` (receives notifications)
- **Method**: `GET` (verification, if needed)

The endpoint automatically:
- ✅ Verifies webhook signatures (security)
- ✅ Parses event notifications
- ✅ Handles multiple entities in one webhook
- ✅ Logs all events for debugging
- ✅ Returns success response to prevent retries

## Customizing Webhook Processing

To add custom logic when webhooks are received, edit:
`/app/api/quickbooks/webhook/route.ts`

In the `handleEntityChange` function, you can:
- Sync data to your database
- Trigger notifications
- Update cache
- Send emails
- Perform custom business logic

Example:
```typescript
async function handleEntityChange(
  realmId: string,
  entityName: string,
  operation: string,
  entityId: string
) {
  // Your custom logic here
  if (entityName === 'Invoice' && operation === 'Create') {
    // Handle new invoice
    await notifyUserAboutNewInvoice(entityId)
  }
}
```

## Troubleshooting

### Webhooks Not Received

1. **Check endpoint URL**: Must be publicly accessible
2. **Verify environment**: Make sure you're testing in the correct environment (Development vs Production)
3. **Check logs**: Look for webhook requests in your application logs
4. **Test endpoint**: Use a tool like Postman to verify the endpoint is accessible

### "Invalid signature" Error

- Verify `QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN` is set correctly
- Make sure the token matches what's shown in Intuit Dashboard
- Check that the token hasn't been regenerated (if so, update it)

### Webhooks Not Processing

- Check application logs for errors
- Verify database connection is working
- Ensure the `quickbooks_connections` table exists and has data
- Check that the realm ID in webhook matches a connection in your database

## Security Best Practices

1. ✅ Always use the verifier token for signature verification
2. ✅ Use HTTPS in production (required by Intuit)
3. ✅ Validate realm IDs before processing
4. ✅ Log all webhook events for audit trails
5. ✅ Handle errors gracefully to prevent retry storms

## Next Steps

After webhooks are set up:
- Monitor webhook delivery in Intuit Dashboard → Analytics
- Set up alerts for failed webhook deliveries
- Implement data synchronization logic
- Test with real QuickBooks data changes

For more information, see:
- QuickBooks Webhooks Documentation: https://developer.intuit.com/app/developer/qbo/docs/develop/webhooks
- Main Setup Guide: `QUICKBOOKS_SETUP.md`
