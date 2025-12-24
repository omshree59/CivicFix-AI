// src/components/AiChatbot.jsx
import React, { useEffect } from 'react';

const AiChatbot = () => {
  useEffect(() => {
    // 1. Load the Core Library
    const script1 = document.createElement("script");
    script1.src = "https://cdn.botpress.cloud/webchat/v3.5/inject.js";
    script1.async = true;
    script1.id = "bp-inject-script"; // Add ID for easier cleanup
    document.body.appendChild(script1);

    // 2. Load Your Specific Bot Configuration
    const script2 = document.createElement("script");
    script2.src = "https://files.bpcontent.cloud/2025/12/15/13/20251215131552-R751GZH8.js";
    script2.defer = true;
    script2.id = "bp-config-script"; // Add ID for easier cleanup
    document.body.appendChild(script2);

    return () => {
      // --- CLEANUP LOGIC ---
      
      // 1. Remove the Scripts
      const s1 = document.getElementById("bp-inject-script");
      const s2 = document.getElementById("bp-config-script");
      if (s1) document.body.removeChild(s1);
      if (s2) document.body.removeChild(s2);

      // 2. Remove the Chatbot UI Elements from the DOM
      // Botpress usually attaches these IDs/Classes to the body
      const botContainer = document.getElementById("bp-web-widget-container");
      const botDiv = document.getElementById("bp-web-widget");
      
      if (botContainer) botContainer.remove();
      if (botDiv) botDiv.remove();

      // 3. Remove any lingering iframes created by the bot
      const iframes = document.querySelectorAll('iframe[id^="bp-web-widget"]');
      iframes.forEach(iframe => iframe.remove());
    };
  }, []);

  return <div id="webchat" />;
};

export default AiChatbot;