// Comeback detection: a new report is the same job again when it lands within
// 50 m of a ticket the same department resolved in the last 30 days.

export const COMEBACK_RADIUS_METERS = 50;
export const COMEBACK_WINDOW_DAYS = 30;

/** Legacy client wrote this pin on every manual report, so it cannot mean "same spot". */
const SHARED_PLACEHOLDER = { lat: 12.9716, lng: 77.5946 };

const CITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  delhi: { lat: 28.6139, lng: 77.209 },
  'new delhi': { lat: 28.6139, lng: 77.209 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
};

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ComebackMatch {
  isComeback: true;
  matchedIssueId: string;
  matchedTitle: string;
  distanceMeters: number;
  daysSinceResolved: number;
  department: string;
  reason: string;
}

export interface RecurrenceInput {
  department?: string | null;
  category?: string | null;
  location?: GeoPoint | null;
  addressDetail?: string;
  city?: string;
  state?: string;
  pincode?: string;
  locationText?: string;
}

type IssueLike = RecurrenceInput & {
  id?: string;
  title?: string;
  status?: string;
  assignedTo?: string;
  resolvedAt?: unknown;
  createdAt?: unknown;
  duplicateMerged?: boolean;
  aiAnalysis?: { recommendedDepartment?: string; category?: string };
};

function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function addressKey(issue: {
  addressDetail?: string;
  city?: string;
  pincode?: string;
  locationText?: string;
}): string {
  const parts = [issue.addressDetail, issue.city, issue.pincode]
    .map((part) => (part || '').trim().toLowerCase().replace(/\s+/g, ' '))
    .filter(Boolean);
  if (parts.length > 0) return parts.join('|');
  return (issue.locationText || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Same street text always returns the same pin. Neighbouring cells sit ~150 m
 * apart, so two different addresses do not fall inside the 50 m comeback radius
 * unless they hash into the exact same cell.
 */
export function coordinatesForAddress(issue: {
  addressDetail?: string;
  city?: string;
  pincode?: string;
  locationText?: string;
}): GeoPoint {
  const cityName = (issue.city || '').trim().toLowerCase();
  const base = CITY_CENTROIDS[cityName] || CITY_CENTROIDS.bangalore;
  const GRID = 48;
  const CELL = 0.00135;
  const hash = fnv1a(addressKey(issue) || cityName || 'unknown');
  let column = hash % GRID;
  let row = Math.floor(hash / GRID) % GRID;
  if (column === 24 && row === 24) column = 0;

  const round = (n: number) => Math.round(n * 1e6) / 1e6;
  return {
    lat: round(base.lat + (row - GRID / 2) * CELL),
    lng: round(base.lng + (column - GRID / 2) * CELL),
  };
}

export function normalizeDepartment(value?: string | null): string {
  const text = (value || '').trim().toLowerCase();
  if (!text) return '';
  if (text.includes('electric')) return 'electrician';
  if (text.includes('plumb') || text.includes('water')) return 'plumber';
  if (text.includes('garbage') || text.includes('sanitat') || text.includes('waste')) return 'garbage collector';
  if (text.includes('road') || text.includes('pothole')) return 'road maintenance';
  if (text.includes('all round') || text.includes('all-round')) return 'all rounder';
  return text;
}

export function departmentFromCategory(category?: string | null): string {
  const text = category || '';
  if (/electric|wire|spark|street\s?light|lamp/i.test(text)) return 'Electrician';
  if (/water|leak|pipe|plumb|drain/i.test(text)) return 'Plumber';
  if (/garbage|trash|waste|sanitat/i.test(text)) return 'Garbage Collector';
  if (/road|pothole|manhole|asphalt|tree/i.test(text)) return 'Road Maintenance';
  return '';
}

export function departmentOf(issue: IssueLike): string {
  return normalizeDepartment(
    issue.department ||
      issue.assignedTo ||
      issue.aiAnalysis?.recommendedDepartment ||
      departmentFromCategory(issue.category || issue.aiAnalysis?.category)
  );
}

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

function isResolved(issue: IssueLike): boolean {
  return (issue.status || '').toLowerCase() === 'resolved' && !issue.duplicateMerged;
}

function resolvedMillis(issue: IssueLike): number | null {
  return toMillis(issue.resolvedAt) ?? toMillis(issue.createdAt);
}

function isSharedPlaceholder(point: GeoPoint): boolean {
  return (
    Math.abs(point.lat - SHARED_PLACEHOLDER.lat) < 1e-5 &&
    Math.abs(point.lng - SHARED_PLACEHOLDER.lng) < 1e-5
  );
}

export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const earth = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

function separationMeters(next: RecurrenceInput, prior: IssueLike): number | null {
  const sameAddress = Boolean(addressKey(next) && addressKey(next) === addressKey(prior));
  const nextPoint = next.location;
  const priorPoint = prior.location;
  const hasPoints =
    nextPoint &&
    priorPoint &&
    Number.isFinite(nextPoint.lat) &&
    Number.isFinite(nextPoint.lng) &&
    Number.isFinite(priorPoint.lat) &&
    Number.isFinite(priorPoint.lng);

  if (hasPoints) {
    if (isSharedPlaceholder(nextPoint) || isSharedPlaceholder(priorPoint)) {
      return sameAddress ? 0 : null;
    }
    return haversineMeters(nextPoint, priorPoint);
  }
  return sameAddress ? 0 : null;
}

export function findComeback(
  next: RecurrenceInput,
  existing: IssueLike[] = [],
  now = Date.now()
): ComebackMatch | null {
  const department = departmentOf(next);
  if (!department) return null;

  const windowMs = COMEBACK_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  let best: ComebackMatch | null = null;

  for (const prior of existing) {
    if (!prior?.id || !isResolved(prior)) continue;
    if (departmentOf(prior) !== department) continue;

    const resolvedAt = resolvedMillis(prior);
    if (resolvedAt == null) continue;
    const age = now - resolvedAt;
    if (age < 0 || age > windowMs) continue;

    const meters = separationMeters(next, prior);
    if (meters == null || meters > COMEBACK_RADIUS_METERS) continue;

    const daysSinceResolved = Math.floor(age / (24 * 60 * 60 * 1000));
    if (best && meters >= best.distanceMeters) continue;

    const when = daysSinceResolved === 0 ? 'today' : `${daysSinceResolved} day${daysSinceResolved === 1 ? '' : 's'} ago`;
    const distanceLabel = meters < 1 ? 'the same spot' : `${Math.round(meters)} m away`;
    best = {
      isComeback: true,
      matchedIssueId: prior.id,
      matchedTitle: prior.title || 'Resolved ticket',
      distanceMeters: Math.round(meters),
      daysSinceResolved,
      department,
      reason: `Same ${department} job was resolved ${when} at ${distanceLabel}. Filed as a comeback of “${prior.title || 'that ticket'}”, not a new job.`,
    };
  }

  return best;
}

export function recurrencePayload(
  next: RecurrenceInput,
  existing: IssueLike[] = [],
  now = Date.now()
): ComebackMatch | { isComeback: false } {
  return findComeback(next, existing, now) ?? { isComeback: false };
}
