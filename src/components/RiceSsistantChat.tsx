import React from 'react';
import { AgriGisChatbot, AgriGisChatbotProps } from './AgriGisChatbot';

/**
 * RiceSsistantChat
 * Primary AI Floating Assistant & Smart Voice/Excel Staging Agent for DA-MAO Silago.
 */
export const RiceSsistantChat: React.FC<AgriGisChatbotProps> = (props) => {
  return <AgriGisChatbot {...props} />;
};

export default RiceSsistantChat;
export * from './AgriGisChatbot';

