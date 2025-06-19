'use client';

import { ConvaiWidget } from '@elevenlabs/react';

interface VoiceAgentWidgetProps {
  agentId: string;
  userId: string;
  groupId: string;
  destination: string;
}

export default function VoiceAgentWidget({
  agentId,
  userId,
  groupId,
  destination,
}: VoiceAgentWidgetProps) {
  console.log('VoiceAgentWidget props:', { agentId, userId, groupId, destination });
  
  return (
    <div className="flex items-center justify-center" style={{ minHeight: 600, padding: 0, margin: 0 }}>
      <ConvaiWidget
        agentId={agentId}
        variant="expanded"
        dynamicVariables={{
          user_id: userId,
          group_id: groupId,
          destination: destination,
        }}
        avatarImageUrl="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop"
        actionText="Need help planning your trip?"
        startCallText="Start Chat"
        endCallText="End"
        expandText="Open Assistant"
        listeningText="Listening..."
        speakingText="Maya is speaking..."
      />
    </div>
  );
}