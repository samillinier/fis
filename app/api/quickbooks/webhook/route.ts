import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Get webhook verifier token from environment
const WEBHOOK_VERIFIER_TOKEN = process.env.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN || ''

/**
 * POST /api/quickbooks/webhook
 * 
 * Receives webhook notifications from Intuit QuickBooks when data changes.
 * 
 * Webhook payload format (depends on "Enable cloud event payload format" setting):
 * - Legacy format: { eventNotifications: [...] }
 * - Cloud event format: { eventNotifications: [...] } (similar structure)
 * 
 * Required Environment Variable:
 * - QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN: Token from Intuit Developer Dashboard (Webhooks → Show verifier token)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if verifier token is set
    if (WEBHOOK_VERIFIER_TOKEN) {
      const signature = request.headers.get('intuit-signature')
      const payload = await request.text()
      
      if (signature) {
        // Verify the signature matches the payload
        const expectedSignature = crypto
          .createHmac('sha256', WEBHOOK_VERIFIER_TOKEN)
          .update(payload)
          .digest('base64')
        
        if (signature !== expectedSignature) {
          console.error('Webhook signature verification failed')
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
          )
        }
      }
    }

    // Parse webhook payload
    const payload = await request.json()
    console.log('QuickBooks webhook received:', JSON.stringify(payload, null, 2))

    // Handle different webhook payload formats
    const eventNotifications = payload.eventNotifications || []
    
    for (const notification of eventNotifications) {
      const realmId = notification.realmId
      const dataChangeEvent = notification.dataChangeEvent
      
      if (!realmId || !dataChangeEvent) {
        console.warn('Invalid webhook notification structure:', notification)
        continue
      }

      // Process each entity change
      const entities = dataChangeEvent.entities || []
      
      for (const entity of entities) {
        const entityName = entity.name // e.g., "Account", "Invoice", "Customer"
        const operation = entity.operation // e.g., "Create", "Update", "Delete"
        const id = entity.id // Entity ID
        
        console.log(`Processing webhook: ${entityName} ${operation} (ID: ${id}, Realm: ${realmId})`)
        
        // Handle different entity types and operations
        await handleEntityChange(realmId, entityName, operation, id)
      }
    }

    // Always return 200 OK to acknowledge receipt
    // Intuit will retry if we return an error
    return NextResponse.json({ 
      status: 'success',
      message: 'Webhook processed successfully'
    })

  } catch (error) {
    console.error('Error processing QuickBooks webhook:', error)
    
    // Still return 200 to prevent retries for malformed requests
    // Log the error for debugging
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Error processing webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 } // Return 200 to prevent Intuit retries
    )
  }
}

/**
 * Handle entity changes from webhooks
 */
async function handleEntityChange(
  realmId: string,
  entityName: string,
  operation: string,
  entityId: string
) {
  try {
    // Find the connection for this realm
    const { supabase } = await import('@/lib/supabase')
    
    const { data: connection, error } = await supabase
      .from('quickbooks_connections')
      .select('user_id, access_token, refresh_token')
      .eq('realm_id', realmId)
      .single()

    if (error || !connection) {
      console.warn(`No connection found for realm ${realmId}`)
      return
    }

    // Here you can implement your business logic:
    // - Sync data to your database
    // - Trigger notifications
    // - Update cache
    // - Send emails
    // etc.

    console.log(`Handling ${operation} for ${entityName} ${entityId} in realm ${realmId}`)
    
    // Example: You might want to fetch the updated entity from QuickBooks API
    // and sync it to your database
    // await syncEntityFromQuickBooks(realmId, entityName, entityId, connection.access_token)

  } catch (error) {
    console.error(`Error handling entity change for ${entityName}:`, error)
  }
}

/**
 * GET /api/quickbooks/webhook
 * 
 * Webhook verification endpoint (if required by Intuit)
 * Some webhook systems require a GET endpoint for verification
 */
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge')
  
  if (challenge) {
    // Return the challenge for webhook verification
    return NextResponse.json({ challenge })
  }
  
  return NextResponse.json({ 
    status: 'ok',
    message: 'Webhook endpoint is active'
  })
}
