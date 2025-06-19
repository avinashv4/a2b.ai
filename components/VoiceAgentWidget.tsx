'use client';

import { useEffect } from 'react';

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
  
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const dynamicVariables = JSON.stringify({
    user_id: userId,
    group_id: groupId,
    destination: destination,
  });

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 600, padding: 0, margin: 0 }} suppressHydrationWarning>
      <elevenlabs-convai
        agent-id={agentId}
        variant="expanded"
        dynamic-variables={dynamicVariables}
        avatar-image-url="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop"
        action-text="Need help planning your trip?"
        start-call-text="Start Chat"
        end-call-text="End"
        expand-text="Open Assistant"
        listening-text="Listening..."
        speaking-text="Maya is speaking..."
      ></elevenlabs-convai>
    </div>
  );
}