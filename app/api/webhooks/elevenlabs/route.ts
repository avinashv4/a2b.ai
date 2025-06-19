import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Verify HMAC signature with ElevenLabs format: t=timestamp,v0=hash
function verifySignature(body: string, signatureHeader: string, secret: string): boolean {
  try {
    // Parse the signature header: t=timestamp,v0=hash
    const headers = signatureHeader.split(',');
    const timestamp = headers.find((e) => e.startsWith('t='))?.substring(2);
    const signature = headers.find((e) => e.startsWith('v0='));

    if (!timestamp || !signature) {
      console.error('Invalid signature format - missing timestamp or signature');
      return false;
    }

    // Validate timestamp (reject requests older than 30 minutes)
    const reqTimestamp = parseInt(timestamp) * 1000;
    const tolerance = Date.now() - 30 * 60 * 1000; // 30 minutes ago
    
    if (reqTimestamp < tolerance) {
      console.error('Request expired - timestamp too old');
      return false;
    }

    // Validate hash
    const message = `${timestamp}.${body}`;
    const digest = 'v0=' + crypto.createHmac('sha256', secret).update(message).digest('hex');
    
    console.log('🔐 Signature validation details:', {
      timestamp,
      message: message.substring(0, 100) + '...',
      expectedSignature: digest.substring(0, 20) + '...',
      receivedSignature: signature.substring(0, 20) + '...',
      isMatch: signature === digest
    });

    return signature === digest;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

// Retrieve conversation data using ElevenLabs API
async function getConversationData(conversationId: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ElevenLabs API key not found');
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch conversation data: ${response.status} ${response.statusText}`);
    }

    const conversationData = await response.json();
    return conversationData;
  } catch (error) {
    console.error('Error fetching conversation data:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 ElevenLabs webhook endpoint hit at:', new Date().toISOString());
  
  try {
    // Get the raw body as text for signature verification
    const body = await request.text();
    const signature = request.headers.get('elevenlabs-signature') || request.headers.get('ElevenLabs-Signature');
    const hmacSecret = process.env.ELEVENLABS_HMAC_SECRET;

    console.log('📋 Request details:', {
      hasBody: !!body,
      bodyLength: body.length,
      hasSignature: !!signature,
      hasHmacSecret: !!hmacSecret,
      signatureFormat: signature ? signature.substring(0, 50) + '...' : 'none',
      headers: Object.fromEntries(request.headers.entries())
    });

    if (!hmacSecret) {
      console.error('❌ HMAC secret not found in environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!signature) {
      console.error('❌ No signature found in request headers');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify the HMAC signature using ElevenLabs format
    const isValidSignature = verifySignature(body, signature, hmacSecret);
    
    if (!isValidSignature) {
      console.error('❌ Invalid HMAC signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('✅ Signature verification passed');

    // Parse the webhook payload
    const webhookData = JSON.parse(body);
    
    console.log('📨 Webhook received and verified:', {
      timestamp: new Date().toISOString(),
      eventType: webhookData.event_type || 'unknown',
      conversationId: webhookData.conversation_id,
      agentId: webhookData.agent_id
    });

    // Extract conversation ID
    const conversationId = webhookData.conversation_id;
    
    if (!conversationId) {
      console.error('❌ No conversation ID found in webhook payload');
      console.log('📄 Full webhook payload:', JSON.stringify(webhookData, null, 2));
      return NextResponse.json({ error: 'Missing conversation ID' }, { status: 400 });
    }

    console.log('📞 Conversation ID received:', conversationId);

    // Fetch conversation data using the conversation ID
    try {
      const conversationData = await getConversationData(conversationId);
      
      console.log('📊 Conversation data retrieved:', {
        conversationId,
        dataKeys: Object.keys(conversationData),
        timestamp: new Date().toISOString()
      });

      // Log the full conversation data for testing
      console.log('🔍 Full conversation data:', JSON.stringify(conversationData, null, 2));

      // Here you can process the conversation data as needed
      // For example, extract travel preferences, save to database, etc.
      
      // TODO: Process the extracted data based on your needs
      // - Extract travel preferences from the conversation
      // - Update user preferences in Supabase
      // - Generate itinerary suggestions
      // - etc.

      return NextResponse.json({ 
        success: true, 
        message: 'Webhook processed successfully',
        conversationId 
      });

    } catch (error) {
      console.error('❌ Error fetching conversation data:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch conversation data',
        conversationId 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ 
    message: 'ElevenLabs webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}