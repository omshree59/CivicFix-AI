// src/components/AiChatbot.jsx
import React, { useEffect, useState } from 'react';

const BOT_NAME = "Civic Care Assistant";
const BOT_DESCRIPTION = "24/7 AI Campus & Civic Response Assistant";
const BOT_AVATAR = "https://files.bpcontent.cloud/2025/12/22/12/20251222121824-AEV84OO9.jpeg";
const FAB_IMAGE = "https://files.bpcontent.cloud/2025/12/22/12/20251222122550-GTIBQ175.jpeg";
const BOT_ID = "2ecae1c1-70d1-4f64-aef3-af52d38292c3";
const CLIENT_ID = "9851d42c-ce67-4ca2-ace6-c7e7d64785b5";

const AiChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let script1 = document.getElementById("bp-inject-script");

    const initBotpress = () => {
      if (window.botpress && typeof window.botpress.init === 'function') {
        try {
          window.botpress.init({
            botId: BOT_ID,
            clientId: CLIENT_ID,
            configuration: {
              version: "v2",
              botName: BOT_NAME,
              botAvatar: BOT_AVATAR,
              botDescription: BOT_DESCRIPTION,
              fabImage: FAB_IMAGE,
              website: {},
              email: {},
              phone: {},
              termsOfService: {},
              privacyPolicy: {},
              color: "#3276EA",
              variant: "solid",
              headerVariant: "glass",
              themeMode: "dark",
              fontFamily: "inter",
              radius: 4,
              feedbackEnabled: false,
              footer: "[⚡ CivicFix AI Assistant](https://civic-fix-ai-lac.vercel.app/)",
              soundEnabled: true,
              proactiveMessageEnabled: false
            }
          });

          if (typeof window.botpress.on === 'function') {
            window.botpress.on('open', () => setIsOpen(true));
            window.botpress.on('close', () => setIsOpen(false));
          }
        } catch (err) {
          console.warn("Botpress initialization notice:", err);
        }
      }
    };

    if (!script1) {
      script1 = document.createElement("script");
      script1.src = "https://cdn.botpress.cloud/webchat/v3.5/inject.js";
      script1.async = true;
      script1.id = "bp-inject-script";
      script1.onload = () => {
        initBotpress();
      };
      document.body.appendChild(script1);
    } else {
      initBotpress();
    }

    return () => {
      // Keep script cached across navigation
    };
  }, []);

  const handleToggleChat = () => {
    if (window.botpress) {
      try {
        if (typeof window.botpress.toggle === 'function') {
          window.botpress.toggle();
        } else if (typeof window.botpress.open === 'function') {
          if (isOpen) {
            window.botpress.close?.();
          } else {
            window.botpress.open();
          }
        }
      } catch (err) {
        console.warn("Could not toggle Botpress:", err);
      }
    }
  };

  return (
    <>
      <style>{`
        /* Hide default Botpress FAB so only the clean circular button from Image 2 is rendered */
        div[class*="FabContainer"],
        div[class*="FabWrapper"],
        div[class*="fab-root"],
        div[id*="bp-fab"],
        button[class*="bp-fab"],
        button[id*="bp-fab"],
        div[class*="FABMessagePreview"] {
          display: none !important;
        }

        /* Glassmorphism styling matching Image 1 for Botpress webchat dialog */
        div[id^="bp-webchat"],
        .bp-webchat {
          border-radius: 20px !important;
          overflow: hidden !important;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(50, 118, 234, 0.25) !important;
          border: 1px solid rgba(50, 118, 234, 0.35) !important;
          backdrop-filter: blur(20px) !important;
          z-index: 999999 !important;
        }
      `}</style>

      {/* Clean circular floating action button exactly like the provided screenshot */}
      <button
        onClick={handleToggleChat}
        className="fixed bottom-6 right-6 z-[99999] w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-[#17153b] via-[#1e1b4b] to-[#2e1065] border-2 border-indigo-400/60 shadow-[0_0_25px_rgba(99,102,241,0.5),0_4px_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_35px_rgba(99,102,241,0.85)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center p-1 cursor-pointer overflow-hidden group select-none"
        title="Civic Care Assistant"
        aria-label="Civic Care Assistant"
      >
        <img 
          src={FAB_IMAGE} 
          alt={BOT_NAME} 
          className="w-full h-full object-cover rounded-full" 
        />
      </button>

      <div id="webchat" />
    </>
  );
};

export default AiChatbot;
