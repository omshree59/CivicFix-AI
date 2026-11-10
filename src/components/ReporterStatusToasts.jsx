import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, CheckCircle2, Clock, HardHat, X } from 'lucide-react';

const normalizeStatus = (status) => {
  const value = (status || 'OPEN').toString().trim().toLowerCase();
  if (value === 'open' || value === '') return 'OPEN';
  if (value === 'accepted') return 'Accepted';
  if (value === 'in progress' || value === 'in_progress') return 'In Progress';
  if (value === 'resolved') return 'Resolved';
  if (value.includes('reject')) return 'Rejected';
  return status;
};

const toastCopy = (status, title) => {
  const shortTitle = title?.trim() || 'Your report';
  switch (normalizeStatus(status)) {
    case 'Accepted':
      return {
        tone: 'blue',
        icon: HardHat,
        headline: 'Accepted',
        body: `${shortTitle} was accepted by the review desk.`,
      };
    case 'In Progress':
      return {
        tone: 'amber',
        icon: Clock,
        headline: 'In Progress',
        body: `A crew started work on ${shortTitle}.`,
      };
    case 'Resolved':
      return {
        tone: 'green',
        icon: CheckCircle2,
        headline: 'Resolved',
        body: `${shortTitle} is marked resolved.`,
      };
    case 'Rejected':
      return {
        tone: 'rose',
        icon: Activity,
        headline: 'Updated',
        body: `${shortTitle} was marked for DIY / public guidance.`,
      };
    default:
      return {
        tone: 'slate',
        icon: Activity,
        headline: normalizeStatus(status),
        body: `${shortTitle} moved to ${normalizeStatus(status)}.`,
      };
  }
};

const toneClasses = {
  blue: 'border-blue-500/40 bg-slate-950/95 shadow-blue-900/30',
  amber: 'border-amber-500/40 bg-slate-950/95 shadow-amber-900/20',
  green: 'border-emerald-500/40 bg-slate-950/95 shadow-emerald-900/25',
  rose: 'border-rose-500/40 bg-slate-950/95 shadow-rose-900/20',
  slate: 'border-slate-600 bg-slate-950/95',
};

const iconTone = {
  blue: 'text-blue-400 bg-blue-500/15',
  amber: 'text-amber-400 bg-amber-500/15',
  green: 'text-emerald-400 bg-emerald-500/15',
  rose: 'text-rose-400 bg-rose-500/15',
  slate: 'text-slate-300 bg-slate-800',
};

/**
 * Listens to the signed-in reporter's own issue docs and surfaces status
 * changes (OPEN → Accepted → In Progress → Resolved) as toasts.
 */
const ReporterStatusToasts = ({ issues = [], user, onOpenTracker }) => {
  const [toasts, setToasts] = useState([]);
  const statusMapRef = useRef(new Map());
  const primedRef = useRef(false);
  const userKeyRef = useRef(null);
  const timersRef = useRef(new Map());

  const dismiss = (id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  const pushToasts = (items) => {
    if (!items.length) return;
    setToasts((prev) => [...items, ...prev].slice(0, 4));
    for (const item of items) {
      const timer = setTimeout(() => dismiss(item.id), 6500);
      timersRef.current.set(item.id, timer);
    }
  };

  useEffect(() => {
    const userKey = user?.uid || user?.email || null;
    if (userKey !== userKeyRef.current) {
      userKeyRef.current = userKey;
      statusMapRef.current = new Map();
      primedRef.current = false;
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
      setToasts([]);
    }

    if (!userKey) return;

    const mine = (issues || []).filter(
      (issue) =>
        (user.uid && issue.userId === user.uid) ||
        (user.email && issue.userEmail === user.email)
    );

    const nextMap = new Map();
    const freshToasts = [];

    for (const issue of mine) {
      const status = normalizeStatus(issue.status);
      nextMap.set(issue.id, status);

      if (!primedRef.current) continue;

      const previous = statusMapRef.current.get(issue.id);
      // First time we see this doc after priming: remember it, do not toast.
      if (previous === undefined) continue;
      if (previous === status) continue;

      const copy = toastCopy(status, issue.title);
      freshToasts.push({
        id: `${issue.id}-${status}-${Date.now()}`,
        issueId: issue.id,
        status,
        title: issue.title || 'Your report',
        ...copy,
      });
    }

    if (!primedRef.current) {
      statusMapRef.current = nextMap;
      primedRef.current = true;
      return;
    }

    statusMapRef.current = nextMap;
    pushToasts(freshToasts);
  }, [issues, user]);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  if (!user) return null;

  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[90] flex flex-col gap-3 w-[min(100%-2rem,22rem)] pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = toast.icon;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              className={`pointer-events-auto rounded-2xl border shadow-2xl backdrop-blur-xl p-3.5 ${toneClasses[toast.tone] || toneClasses.slate}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${iconTone[toast.tone] || iconTone.slate}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                      {toast.headline}
                    </p>
                    <button
                      type="button"
                      onClick={() => dismiss(toast.id)}
                      className="text-slate-500 hover:text-white p-0.5 rounded"
                      aria-label="Dismiss status update"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-white font-medium leading-snug line-clamp-2">
                    {toast.body}
                  </p>
                  {onOpenTracker && (
                    <button
                      type="button"
                      onClick={() => {
                        dismiss(toast.id);
                        onOpenTracker(toast.issueId);
                      }}
                      className="mt-2 text-[11px] font-bold uppercase tracking-wide text-indigo-300 hover:text-white"
                    >
                      Open tracker
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ReporterStatusToasts;
