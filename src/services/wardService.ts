// Campus and municipal zones. A contractor licensed for one ward does not
// see accepted jobs from the rest of the city.

export const CITYWIDE_WARD = 'Entire city';

const CITY_WARDS: Record<string, string[]> = {
  bangalore: [
    'Hostel Block B',
    'North Academic Quad',
    'South Sports Ground',
    'Ring Road & Gate 2',
    'Central Plaza',
  ],
  bengaluru: [
    'Hostel Block B',
    'North Academic Quad',
    'South Sports Ground',
    'Ring Road & Gate 2',
    'Central Plaza',
  ],
  'new delhi': ['Hostel Block D', 'Exam & Computer Center'],
  delhi: ['Hostel Block D', 'Exam & Computer Center'],
  mumbai: ['Staff Quarters', 'Admin Tower'],
  pune: ['Science Block'],
};

const GENERIC_WARDS = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone'];

const WARD_RULES: { pattern: RegExp; ward: string }[] = [
  { pattern: /hostel\s*block\s*b/i, ward: 'Hostel Block B' },
  { pattern: /hostel\s*block\s*d/i, ward: 'Hostel Block D' },
  { pattern: /north\s+(academic\s+)?quad|library|canteen|lab\s+complex/i, ward: 'North Academic Quad' },
  { pattern: /south\s+sports|bleacher/i, ward: 'South Sports Ground' },
  { pattern: /ring\s+road|gate\s*2/i, ward: 'Ring Road & Gate 2' },
  { pattern: /central\s+plaza|central\s+zone|campus\s+central/i, ward: 'Central Plaza' },
  { pattern: /science\s+building|basement/i, ward: 'Science Block' },
  { pattern: /admin\s+tower|lift\s*#?\s*2/i, ward: 'Admin Tower' },
  { pattern: /staff\s+quarters|flat\s*402/i, ward: 'Staff Quarters' },
  { pattern: /examination\s+hall|computer\s+center|wi-?fi/i, ward: 'Exam & Computer Center' },
];

export function wardsForCity(city?: string | null): string[] {
  const key = (city || '').trim().toLowerCase();
  return CITY_WARDS[key] ? [...CITY_WARDS[key]] : [...GENERIC_WARDS];
}

export function inferWard(text?: string | null): string {
  const haystack = text || '';
  for (const rule of WARD_RULES) {
    if (rule.pattern.test(haystack)) return rule.ward;
  }
  return '';
}

export function issueWard(issue: {
  ward?: string | null;
  addressDetail?: string | null;
  locationText?: string | null;
} | null | undefined): string {
  if (!issue) return '';
  const stored = (issue.ward || '').trim();
  if (stored && stored !== CITYWIDE_WARD) return stored;
  return inferWard(`${issue.addressDetail || ''} ${issue.locationText || ''}`);
}

/** True when this contractor is allowed to see the job. */
export function issueMatchesWard(
  issue: {
    ward?: string | null;
    addressDetail?: string | null;
    locationText?: string | null;
  } | null | undefined,
  operatingWard?: string | null
): boolean {
  const zone = (operatingWard || '').trim();
  if (!zone || zone === CITYWIDE_WARD) return true;
  const ward = issueWard(issue);
  if (!ward) return false;
  return ward.toLowerCase() === zone.toLowerCase();
}
