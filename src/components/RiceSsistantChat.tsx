import React from 'react';
import { AgriGisChatbot, AgriGisChatbotProps } from './AgriGisChatbot';

/**
 * RiceSsistantChat
 * Primary AI Floating Assistant & Smart Voice/Excel Staging Agent for DA-MAO Silago.
 * Anchored strictly at bottom-6 right-6 with z-[9999] floating above all dashboard & GIS layers.
 */
export const RiceSsistantChat: React.FC<AgriGisChatbotProps> = (props) => {
  return <AgriGisChatbot {...props} />;
};

export default RiceSsistantChat;
export * from './AgriGisChatbot';

