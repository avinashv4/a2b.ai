import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// Extract travel preferences from conversation data
function extractTravelPreferences(conversationData: any) {
  try {
    console.log('🔍 Analyzing conversation data structure...');
    console.log('📊 Top-level keys:', Object.keys(conversationData));
    
    // Check if the analysis structure exists
    if (!conversationData.analysis) {
      console.error('❌ No "analysis" key found in conversation data');
      console.log('📄 Available keys:', Object.keys(conversationData));
      return null;
    }
    
    if (!conversationData.analysis.data_collection_results) {
      console.error('❌ No "data_collection_results" key found in analysis');
      console.log('📄 Analysis keys:', Object.keys(conversationData.analysis));
      return null;
    }
    
    const dataCollectionResults = conversationData.analysis.data_collection_results;
    console.log('📋 Data collection results keys:', Object.keys(dataCollectionResults));
    
    // Initialize preferences object with default values
    const preferences = {
      deal_breakers_and_strong_preferences: null,
      interests_and_activities: null,
      nice_to_haves_and_openness: null,
      travel_motivations: null,
      must_do_experiences: null,
      learning_interests: null,
      schedule_and_logistics: null,
      budget_and_spending: null,
      travel_style_preferences: null
    };
    
    // Extract the "value" field from each preference key
    const preferenceKeys = [
      'deal_breakers_and_strong_preferences',
      'interests_and_activities',
      'nice_to_haves_and_openness',
      'travel_motivations',
      'must_do_experiences',
      'learning_interests',
      'schedule_and_logistics',
      'budget_and_spending',
      'travel_style_preferences'
    ];
    
    let extractedCount = 0;
    
    for (const key of preferenceKeys) {
      if (dataCollectionResults[key] && dataCollectionResults[key].value) {
        preferences[key] = dataCollectionResults[key].value;
        extractedCount++;
        console.log(`✅ Extracted ${key}:`, 
          typeof dataCollectionResults[key].value === 'string' 
            ? dataCollectionResults[key].value.substring(0, 100) + '...'
            : dataCollectionResults[key].value
        );
      } else {
        console.log(`⚠️ No value found for ${key}`);
        if (dataCollectionResults[key]) {
          console.log(`   Available fields:`, Object.keys(dataCollectionResults[key]));
        }
      }
    }
    
    console.log(`🎯 Successfully extracted ${extractedCount} out of ${preferenceKeys.length} preferences`);

    return preferences;
  } catch (error) {
    console.error('Error extracting travel preferences:', error);
    return null;
  }
}

// Find user and group from conversation context
async function findUserAndGroup(conversationData: any) {
  try {
    let userId = null;
    let groupId = null;
    
    console.log('🔍 Looking for user context in conversation data...');
    console.log('📊 Conversation data keys:', Object.keys(conversationData));
    
    // Check multiple possible locations for user context
    if (conversationData.metadata) {
      console.log('📋 Checking metadata:', Object.keys(conversationData.metadata));
      userId = conversationData.metadata.user_id || conversationData.metadata.userId;
      groupId = conversationData.metadata.group_id || conversationData.metadata.groupId;
    }
    
    if (conversationData.agent_context) {
      console.log('📋 Checking agent_context:', Object.keys(conversationData.agent_context));
      userId = userId || conversationData.agent_context.user_id || conversationData.agent_context.userId;
      groupId = groupId || conversationData.agent_context.group_id || conversationData.agent_context.groupId;
    }
    
    if (conversationData.context) {
      console.log('📋 Checking context:', Object.keys(conversationData.context));
      userId = userId || conversationData.context.user_id || conversationData.context.userId;
      groupId = groupId || conversationData.context.group_id || conversationData.context.groupId;
    }
    
    // Check if user context was passed in the root level
    userId = userId || conversationData.user_id || conversationData.userId;
    groupId = groupId || conversationData.group_id || conversationData.groupId;
    
    console.log('🔍 Found user context:', { userId, groupId });
    
    if (userId && groupId) {
      console.log('✅ Found user context from conversation metadata:', { userId, groupId });
      
      // Verify that this user is actually a member of this group
      const { data: member, error } = await supabase
        .from('group_members')
        .select('user_id, group_id')
        .eq('user_id', userId)
        .eq('group_id', groupId)
        .single();
        
      if (error || !member) {
        console.error('❌ User not found in specified group:', { userId, groupId, error });
        return null;
      }
      
      return { user_id: userId, group_id: groupId };
    }
    
    console.log('⚠️ No user context found in conversation data, trying fallback method');
    
    // Fallback: try to find the most recent group member who hasn't completed preferences
    
    const { data: incompleteMembers, error } = await supabase
      .from('group_members')
      .select('user_id, group_id')
      .is('interests_and_activities', null)
      .limit(5);

    if (error) {
      console.error('Error finding incomplete members:', error);
      return null;
    }

    if (incompleteMembers && incompleteMembers.length > 0) {
      console.log(`📋 Found ${incompleteMembers.length} incomplete members, using first one:`, incompleteMembers[0]);
      return {
        user_id: incompleteMembers[0].user_id,
        group_id: incompleteMembers[0].group_id
      };
    } else {
      console.log('📋 No incomplete members found, checking all members...');
      const { data: allMembers } = await supabase.from('group_members').select('user_id, group_id').limit(5);
      console.log('📋 All members sample:', allMembers);
    }

    console.log('❌ Could not find any incomplete group members');
    return null;
  } catch (error) {
    console.error('Error finding user and group:', error);
    return null;
  }
}

// Update group member preferences in Supabase
async function updateMemberPreferences(userId: string, groupId: string, preferences: any) {
  try {
    console.log('💾 Updating preferences for user:', userId, 'in group:', groupId);

    const { data, error } = await supabase
      .from('group_members')
      .update({
        deal_breakers_and_strong_preferences: preferences.deal_breakers_and_strong_preferences,
        interests_and_activities: preferences.interests_and_activities,
        nice_to_haves_and_openness: preferences.nice_to_haves_and_openness,
        travel_motivations: preferences.travel_motivations,
        must_do_experiences: preferences.must_do_experiences,
        learning_interests: preferences.learning_interests,
        schedule_and_logistics: preferences.schedule_and_logistics,
        budget_and_spending: preferences.budget_and_spending,
        travel_style_preferences: preferences.travel_style_preferences,
        preferences_completed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('group_id', groupId)
      .select();

    if (error) {
      console.error('❌ Error updating member preferences:', error);
      throw error;
    }

    console.log('✅ Successfully updated preferences for user:', userId);
    return data;
  } catch (error) {
    console.error('Error updating member preferences:', error);
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
      signatureFormat: signature ? signature.substring(0, 50) + '...' : 'none'
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

      // Extract travel preferences from conversation
      const preferences = extractTravelPreferences(conversationData);
      
      if (!preferences) {
        console.error('❌ Failed to extract preferences from conversation');
        return NextResponse.json({ 
          error: 'Failed to extract preferences',
          conversationId 
        }, { status: 500 });
      }

      // Find the user and group for this conversation
      const userGroup = await findUserAndGroup(conversationData);
      
      if (!userGroup) {
        console.error('❌ Could not determine user and group for conversation');
        console.log('💡 Tip: Consider passing user_id and group_id as metadata to the AI agent');
        return NextResponse.json({ 
          error: 'Could not determine user context',
          conversationId,
          preferences 
        }, { status: 400 });
      }

      // Update the group member's preferences
      await updateMemberPreferences(userGroup.user_id, userGroup.group_id, preferences);

      console.log('🎉 Successfully processed conversation and updated preferences');

      return NextResponse.json({ 
        success: true, 
        message: 'Conversation processed and preferences updated successfully',
        conversationId,
        userId: userGroup.user_id,
        groupId: userGroup.group_id,
        extractedPreferences: Object.keys(preferences).filter(key => preferences[key] !== null)
      });

    } catch (error) {
      console.error('❌ Error processing conversation:', error);
      return NextResponse.json({ 
        error: 'Failed to process conversation data',
        conversationId,
        details: error instanceof Error ? error.message : 'Unknown error'
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