// src/components/AiChatbot.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, MessageSquare, X, Loader2, Bot, ArrowRight, ShieldCheck } from 'lucide-react';

const BOT_NAME = "Civic Care Assistant";
const BOT_AVATAR = "https://files.bpcontent.cloud/2025/12/22/12/20251222121824-AEV84OO9.jpeg";
const FAB_IMAGE = "https://files.bpcontent.cloud/2025/12/22/12/20251222122550-GTIBQ175.jpeg";
const BOT_ID = "2ecae1c1-70d1-4f64-aef3-af52d38292c3";
const CLIENT_ID = "9851d42c-ce67-4ca2-ace6-c7e7d64785b5";

const AiChatbot = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showPromptBubble, setShowPromptBubble] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const promptTimeoutRef = useRef(null);

  useEffect(() => {
    // 1. Check if inject script already exists
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
              botDescription: "24/7 AI Civic & Campus Support",
              fabImage: FAB_IMAGE,
              website: {},
              email: {},
              phone: {},
              termsOfService: {},
              privacyPolicy: {},
              color: "#6366F1",
              variant: "solid",
              headerVariant: "glass",
              themeMode: "dark",
              fontFamily: "inter",
              radius: 16,
              feedbackEnabled: false,
              footer: "[⚡ by Botpress](https://botpress.com/?from=webchat)",
              soundEnabled: true,
              proactiveMessageEnabled: false
            }
          });

          setIsLoaded(true);

          if (typeof window.botpress.on === 'function') {
            window.botpress.on('open', () => {
              setIsOpen(true);
              setShowPromptBubble(false);
            });
            window.botpress.on('close', () => {
              setIsOpen(false);
            });
          }
        } catch (err) {
          console.warn("Botpress initialization notice:", err);
          setIsLoaded(true);
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

    // Auto-hide the proactive prompt bubble after 18 seconds if not dismissed
    promptTimeoutRef.current = setTimeout(() => {
      setShowPromptBubble(false);
    }, 18000);

    return () => {
      if (promptTimeoutRef.current) {
        clearTimeout(promptTimeoutRef.current);
      }
    };
  }, []);

  const handleToggleChat = () => {
    if (window.botpress) {
      setShowPromptBubble(false);
      try {
        if (typeof window.botpress.toggle === 'function') {
          window.botpress.toggle();
          setIsOpen(prev => !prev);
        } else if (typeof window.botpress.open === 'function') {
          if (isOpen) {
            window.botpress.close?.();
            setIsOpen(false);
          } else {
            window.botpress.open();
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.warn("Could not toggle Botpress:", err);
      }
    } else {
      setIsInitializing(true);
      setTimeout(() => {
        setIsInitializing(false);
        if (window.botpress && typeof window.botpress.open === 'function') {
          window.botpress.open();
          setIsOpen(true);
        }
      }, 1500);
    }
  };

  const handleQuickQuestion = (questionText) => {
    setShowPromptBubble(false);
    if (window.botpress) {
      if (typeof window.botpress.open === 'function') {
        window.botpress.open();
        setIsOpen(true);
      }
      try {
        if (typeof window.botpress.sendMessage === 'function') {
          window.botpress.sendMessage(questionText);
        }
      } catch (e) {
        console.warn("Could not send automated message:", e);
      }
    }
  };

  return (
    <>
      {/* Botpress Native Widget Overrides */}
      <style>{`
        /* Hide the default generic floating launcher so our redesigned Civic Care hub is active */
        div[class*="FabContainer"],
        div[class*="FabWrapper"],
        div[class*="fab-root"],
        div[id*="bp-fab"],
        button[class*="bp-fab"],
        button[id*="bp-fab"],
        div[class*="FABMessagePreview"] {
          display: none !important;
        }

        /* Glassmorphism styling for Botpress webchat dialog */
        div[id^="bp-webchat"],
        .bp-webchat {
          border-radius: 24px !important;
          overflow: hidden !important;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(99, 102, 241, 0.25) !important;
          border: 1px solid rgba(99, 102, 241, 0.35) !important;
          backdrop-filter: blur(18px) !important;
          z-index: 999999 !important;
        }
      `}</style>

      {/* Modern Redesigned Civic Care Assistant Floating Launcher */}
      <aside 
        aria-label="Civic Care Assistant"
        className="fixed bottom-5 right-5 md:bottom-7 md:right-7 z-[99999] flex flex-col items-end select-none font-sans"
      >
        {/* Proactive Greeting Bubble */}
        {showPromptBubble && !isOpen && (
          <div className="mb-3 max-w-[290px] sm:max-w-xs bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-3.5 shadow-2xl shadow-indigo-950/60 text-white animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Sparkles className="w-3 h-3 text-indigo-300" />
                </div>
                <span className="text-xs font-black tracking-wide text-white">Civic Care Assistant</span>
              </div>
              <button 
                onClick={() => setShowPromptBubble(false)}
                className="text-slate-500 hover:text-slate-300 p-0.5 rounded-md hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5 font-medium">
              Hi! 👋 Need help reporting an issue, tracking progress, or checking contractor SLA?
            </p>

            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => handleQuickQuestion("How do I report a civic or campus issue?")}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/25 border border-slate-700/80 hover:border-indigo-500/50 text-[10px] text-indigo-200 font-semibold transition-all group"
              >
                <span>⚡ How to report an issue?</span>
                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => handleQuickQuestion("How does automatic duplicate detection work?")}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/25 border border-slate-700/80 hover:border-indigo-500/50 text-[10px] text-indigo-200 font-semibold transition-all group"
              >
                <span>🔁 How duplicate check works?</span>
                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Action Button Hub */}
        <button
          onClick={handleToggleChat}
          className="group relative flex items-center gap-3 p-2 pr-4 rounded-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 backdrop-blur-2xl border border-indigo-500/50 hover:border-indigo-400 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_25px_rgba(99,102,241,0.35)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.6),0_0_35px_rgba(99,102,241,0.55)] transition-all duration-300 active:scale-95"
          title="Open Civic Care Assistant"
        >
          {/* Avatar Container with Original FAB Image */}
          <div className="relative w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
            <img 
              src={FAB_IMAGE} 
              alt={BOT_NAME} 
              className="w-full h-full object-cover rounded-full" 
            />
            {/* Pulsing Green Live Status Dot */}
            <span className="absolute bottom-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></span>
            </span>
          </div>

          {/* Label & Live Status */}
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white tracking-wide group-hover:text-indigo-200 transition-colors">
                Civic Care
              </span>
              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              {isOpen ? (
                <span className="text-indigo-300 font-semibold">Active Conversation</span>
              ) : (
                <>
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                  <span>24/7 Live Support</span>
                </>
              )}
            </p>
          </div>

          {/* Toggle Indicator Button */}
          <div className="ml-1 w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
            {isInitializing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isOpen ? (
              <X className="w-3.5 h-3.5" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5" />
            )}
          </div>
        </button>
      </aside>

      {/* Target Mount for Botpress webchat */}
      <div id="webchat" />
    </>
  );
};

export default AiChatbot;
