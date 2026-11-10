// Area forecast from the last 30 days of filed tickets.
// Compares the recent half of that window with the earlier half so rising
// categories (potholes, leaks) show up without re-running triage on a sentence.

export const FORECAST_WINDOW_DAYS = 30;

export interface CategoryTrend {
  category: string;
  total: number;
  recent: number;
  prior: number;
  delta: number;
  changePct: number | null;
  trajectory: 'rising' | 'falling' | 'steady' | 'new';
}

export interface ForecastReport {
  areaLabel: string;
  city?: string;
  state?: string;
  windowDays: number;
  sampleSize: number;
  generatedAt: string;
  categories: CategoryTrend[];
  rising: CategoryTrend[];
  headline: string;
  summary: string;
  watchList: string[];
  focusCategory?: string | null;
}

type IssueLike = {
  city?: string;
  state?: string;
  ward?: string;
  category?: string;
  createdAt?: unknown;
  aiAnalysis?: { category?: string };
};

function toMillis(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    const stamp = value as { toMillis?: () => number; seconds?: number };
    if (typeof stamp.toMillis === 'function') return stamp.toMillis();
    if (typeof stamp.seconds === 'number') return stamp.seconds * 1000;
  }
  return null;
}

export function normalizeForecastCategory(raw?: string | null): string {
  const text = (raw || '').trim();
  if (!text) return 'Other';
  if (/water|leak|pipe|flood|drain|plumb/i.test(text)) return 'Water Leakage';
  if (/pothole|road|asphalt|pavement|sinkhole/i.test(text)) return 'Potholes';
  if (/garbage|trash|waste|sanitat|litter/i.test(text)) return 'Garbage';
  if (/electric|wire|spark|street\s?light|lamp|voltage/i.test(text)) return 'Street Light / Electrical';
  if (/manhole|sewer|chamber/i.test(text)) return 'Manhole';
  if (/tree|branch|fallen/i.test(text)) return 'Fallen Tree';
  if (/wifi|wi-fi|network|exam/i.test(text)) return 'Campus Connectivity';
  if (/chemical|fume|hazmat/i.test(text)) return 'Hazmat';
  if (/elevator|lift|entrap/i.test(text)) return 'Elevator / Access';
  return text.replace(/\s*\/\s*/g, ' / ').replace(/\s+/g, ' ').trim();
}

export function categoryFromFocusText(text?: string | null): string | null {
  const value = (text || '').trim();
  if (!value) return null;
  if (/water|leak|pipe|flood|drain|plumb/i.test(value)) return 'Water Leakage';
  if (/pothole|road|asphalt|pavement|crack/i.test(value)) return 'Potholes';
  if (/garbage|trash|waste|bin|litter/i.test(value)) return 'Garbage';
  if (/electric|wire|spark|street\s?light|lamp|light/i.test(value)) return 'Street Light / Electrical';
  if (/manhole|sewer/i.test(value)) return 'Manhole';
  if (/tree|branch/i.test(value)) return 'Fallen Tree';
  return null;
}

export function areasFromIssues(issues: IssueLike[] = []): { city: string; state: string; label: string }[] {
  const map = new Map<string, { city: string; state: string; label: string }>();
  for (const issue of issues) {
    const city = (issue.city || '').trim();
    if (!city) continue;
    const state = (issue.state || '').trim();
    const key = `${city}|${state}`.toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        city,
        state,
        label: state ? `${city}, ${state}` : city,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function issueCategory(issue: IssueLike): string {
  return normalizeForecastCategory(issue.aiAnalysis?.category || issue.category);
}

function trajectoryOf(recent: number, prior: number): CategoryTrend['trajectory'] {
  if (prior === 0 && recent > 0) return 'new';
  if (recent > prior) return 'rising';
  if (recent < prior) return 'falling';
  return 'steady';
}

function changePct(recent: number, prior: number): number | null {
  if (prior === 0) return recent > 0 ? null : 0;
  return Math.round(((recent - prior) / prior) * 100);
}

function buildHeadline(rising: CategoryTrend[], sampleSize: number, areaLabel: string): string {
  if (sampleSize === 0) {
    return `No tickets in ${areaLabel} over the last ${FORECAST_WINDOW_DAYS} days.`;
  }
  if (rising.length === 0) {
    return `Volume is steady across ${areaLabel}. No category is climbing in the latest half of the window.`;
  }
  const top = rising[0];
  if (top.trajectory === 'new') {
    return `${top.category} just appeared in ${areaLabel} (${top.recent} new in the latest ${FORECAST_WINDOW_DAYS / 2} days).`;
  }
  const pct = top.changePct != null ? ` (+${top.changePct}%)` : '';
  return `${top.category} is rising in ${areaLabel}${pct}: ${top.recent} recent vs ${top.prior} earlier.`;
}

function buildSummary(categories: CategoryTrend[], rising: CategoryTrend[], sampleSize: number, areaLabel: string): string {
  if (sampleSize === 0) {
    return `File a few reports in this area first. The forecast needs thirty days of tickets to compare pothole, leak, and other volumes.`;
  }
  const top = categories[0];
  const risingNames = rising.slice(0, 3).map((item) => item.category);
  const risingText =
    risingNames.length === 0
      ? 'No category is accelerating right now.'
      : risingNames.length === 1
        ? `${risingNames[0]} is the only rising category.`
        : `${risingNames.slice(0, -1).join(', ')} and ${risingNames[risingNames.length - 1]} are rising.`;
  return `${sampleSize} tickets were filed in ${areaLabel} in the last ${FORECAST_WINDOW_DAYS} days. ${top.category} leads with ${top.total}. ${risingText}`;
}

export function buildAreaForecast(
  issues: IssueLike[] = [],
  options: {
    city?: string | null;
    state?: string | null;
    focusText?: string | null;
    now?: number;
  } = {}
): ForecastReport {
  const now = options.now ?? Date.now();
  const windowMs = FORECAST_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const halfMs = windowMs / 2;
  const windowStart = now - windowMs;
  const midPoint = now - halfMs;

  const city = (options.city || '').trim();
  const state = (options.state || '').trim();
  const areaLabel = city ? (state ? `${city}, ${state}` : city) : 'all recorded areas';

  const scoped = issues.filter((issue) => {
    if (city && (issue.city || '').trim().toLowerCase() !== city.toLowerCase()) return false;
    if (state && (issue.state || '').trim().toLowerCase() !== state.toLowerCase()) return false;
    const created = toMillis(issue.createdAt);
    if (created == null) return false;
    return created >= windowStart && created <= now;
  });

  const buckets = new Map<string, { recent: number; prior: number }>();
  for (const issue of scoped) {
    const created = toMillis(issue.createdAt)!;
    const category = issueCategory(issue);
    const bucket = buckets.get(category) || { recent: 0, prior: 0 };
    if (created >= midPoint) bucket.recent += 1;
    else bucket.prior += 1;
    buckets.set(category, bucket);
  }

  const categories: CategoryTrend[] = [...buckets.entries()]
    .map(([category, counts]) => {
      const total = counts.recent + counts.prior;
      const delta = counts.recent - counts.prior;
      return {
        category,
        total,
        recent: counts.recent,
        prior: counts.prior,
        delta,
        changePct: changePct(counts.recent, counts.prior),
        trajectory: trajectoryOf(counts.recent, counts.prior),
      };
    })
    .sort((a, b) => {
      if (b.delta !== a.delta) return b.delta - a.delta;
      return b.total - a.total;
    });

  const rising = categories
    .filter((item) => item.trajectory === 'rising' || item.trajectory === 'new')
    .sort((a, b) => {
      if (b.delta !== a.delta) return b.delta - a.delta;
      return b.recent - a.recent;
    });

  const focusCategory = categoryFromFocusText(options.focusText);
  const watchList = (focusCategory
    ? [
        ...rising.filter((item) => item.category === focusCategory),
        ...rising.filter((item) => item.category !== focusCategory),
        ...categories.filter((item) => item.category === focusCategory && !rising.includes(item)),
      ]
    : rising
  )
    .slice(0, 3)
    .map((item) => {
      if (item.trajectory === 'new') {
        return `${item.category}: ${item.recent} new reports in the latest ${FORECAST_WINDOW_DAYS / 2} days.`;
      }
      const pct = item.changePct != null ? ` (${item.changePct > 0 ? '+' : ''}${item.changePct}%)` : '';
      return `${item.category}: ${item.recent} recent vs ${item.prior} earlier${pct}.`;
    });

  if (focusCategory && !watchList.some((line) => line.startsWith(focusCategory))) {
    const focused = categories.find((item) => item.category === focusCategory);
    if (focused) {
      watchList.unshift(
        `${focusCategory}: ${focused.recent} recent vs ${focused.prior} earlier in this area (you asked about this category).`
      );
    } else {
      watchList.unshift(`${focusCategory}: no tickets in this area during the last ${FORECAST_WINDOW_DAYS} days.`);
    }
  }

  return {
    areaLabel,
    city: city || undefined,
    state: state || undefined,
    windowDays: FORECAST_WINDOW_DAYS,
    sampleSize: scoped.length,
    generatedAt: new Date(now).toISOString(),
    categories,
    rising,
    headline: buildHeadline(rising, scoped.length, areaLabel),
    summary: buildSummary(categories, rising, scoped.length, areaLabel),
    watchList: watchList.slice(0, 4),
    focusCategory,
  };
}
