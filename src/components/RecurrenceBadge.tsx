import React from 'react';
import { RotateCcw } from 'lucide-react';

export interface RecurrenceInfo {
  isComeback?: boolean;
  matchedIssueId?: string;
  matchedTitle?: string;
  distanceMeters?: number;
  daysSinceResolved?: number;
  reason?: string;
}

interface Props {
  recurrence?: RecurrenceInfo | null;
  compact?: boolean;
}

export const RecurrenceBadge: React.FC<Props> = ({ recurrence, compact = false }) => {
  if (!recurrence?.isComeback) return null;

  const distance =
    recurrence.distanceMeters != null && recurrence.distanceMeters > 0
      ? `${recurrence.distanceMeters} m`
      : 'same spot';
  const when =
    recurrence.daysSinceResolved === 0
      ? 'resolved today'
      : `resolved ${recurrence.daysSinceResolved ?? '?'}d ago`;

  if (compact) {
    return (
      <span
        title={recurrence.reason || `Comeback of ${recurrence.matchedTitle || 'a resolved ticket'}`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/30"
      >
        <RotateCcw className="w-3 h-3 text-fuchsia-300" />
        Comeback
      </span>
    );
  }

  return (
    <div className="bg-fuchsia-950/40 border border-fuchsia-500/30 rounded-xl p-3 my-2 text-xs">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 font-bold text-fuchsia-200">
          <RotateCcw className="w-4 h-4 text-fuchsia-300 shrink-0" />
          <span>Comeback, not a new job</span>
        </div>
        <span className="bg-fuchsia-500/20 text-fuchsia-200 font-mono px-2 py-0.5 rounded text-[10px] font-bold">
          {distance} · {when}
        </span>
      </div>
      <p className="text-fuchsia-100/80 leading-relaxed">
        {recurrence.reason ||
          `This report matches a ${recurrence.matchedTitle || 'resolved ticket'} within 50 m and the last 30 days.`}
      </p>
    </div>
  );
};

export default RecurrenceBadge;
