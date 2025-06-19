import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Extract user_id and group_id from webhook payload
function extractUserContext(webhookData: any) {
  try {
    console.log('🔍 Looking for user context in webhook payload...');
    
    // Extract user_id and group_id from conversation_initiation_client_data.dynamic_variables
    if (webhookData.conversation_initiation_client_data && 
        webhookData.conversation_initiation_client_data.dynamic_variables) {
      const dynamicVars = webhookData.conversation_initiation_client_data.dynamic_variables;
      const userId = dynamicVars.user_id;
      const groupId = dynamicVars.group_id;
      
      console.log('✅ Found user context:', { userId, groupId });
      return { userId, groupId };
    }
    
    console.error('❌ Could not find user_id or group_id in conversation_initiation_client_data.dynamic_variables');
    return { userId: null, groupId: null };
  } catch (error) {
    console.error('Error extracting user context:', error);
    return { userId: null, groupId: null };
  }
}

// Extract travel preferences from webhook payload
function extractTravelPreferences(webhookData: any) {
  try {
    console.log('🔍 Extracting travel preferences...');
    
    if (!webhookData.analysis || !webhookData.analysis.data_collection_results) {
      console.error('❌ No analysis.data_collection_results found');
      return null;
    }
    
    const dataCollectionResults = webhookData.analysis.data_collection_results;
    
    // Extract the "value" field from each preference key
    const preferences = {
      deal_breakers_and_strong_preferences: dataCollectionResults.deal_breakers_and_strong_preferences?.value || null,
      interests_and_activities: dataCollectionResults.interests_and_activities?.value || null,
      nice_to_haves_and_openness: dataCollectionResults.nice_to_haves_and_openness?.value || null,
      travel_motivations: dataCollectionResults.travel_motivations?.value || null,
      must_do_experiences: dataCollectionResults.must_do_experiences?.value || null,
      learning_interests: dataCollectionResults.learning_interests?.value || null,
      schedule_and_logistics: dataCollectionResults.schedule_and_logistics?.value || null,
      budget_and_spending: dataCollectionResults.budget_and_spending?.value || null,
      travel_style_preferences: dataCollectionResults.travel_style_preferences?.value || null
    };
    
    console.log('✅ Extracted preferences:', preferences);
    return preferences;
  } catch (error) {
    console.error('Error extracting travel preferences:', error);
    return null;
  }
}

// Update group member preferences in database
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
  console.log('🚀 ElevenLabs webhook endpoint hit');
  
  try {
    // Parse the webhook payload - this contains everything we need
    const webhookData = await request.json();
    
    console.log('📨 Webhook received:', {
      eventType: webhookData.event_type || 'unknown',
      conversationId: webhookData.conversation_id,
      agentId: webhookData.agent_id
    });

    // Extract user_id and group_id directly from webhook payload
    const { userId, groupId } = extractUserContext(webhookData);
    
    if (!userId || !groupId) {
      console.error('❌ Could not extract user_id and group_id from webhook payload');
      return NextResponse.json({ 
        error: 'Could not extract user_id and group_id from webhook payload',
        conversationId: webhookData.conversation_id
      }, { status: 400 });
    }

    // Extract travel preferences directly from webhook payload
    const preferences = extractTravelPreferences(webhookData);
    
    if (!preferences) {
      console.error('❌ Failed to extract preferences from webhook payload');
      return NextResponse.json({ 
        error: 'Failed to extract preferences',
        conversationId: webhookData.conversation_id
      }, { status: 500 });
    }

    // Update the database
    await updateMemberPreferences(userId, groupId, preferences);

    console.log('🎉 Successfully processed webhook and updated preferences');

    return NextResponse.json({ 
      success: true, 
      message: 'Preferences updated successfully',
      conversationId: webhookData.conversation_id,
      userId,
      groupId
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'ElevenLabs webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}