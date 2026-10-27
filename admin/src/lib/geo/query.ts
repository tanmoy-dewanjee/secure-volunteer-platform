const STREET_TYPES: Record<string, string> = {
  cres: "Crescent",
  cr: "Crescent",
  st: "Street",
  rd: "Road",
  ave: "Avenue",
  av: "Avenue",
  dr: "Drive",
  ct: "Court",
  crt: "Court",
  pl: "Place",
  tce: "Terrace",
  ter: "Terrace",
  pde: "Parade",
  hwy: "Highway",
  cct: "Circuit",
  blvd: "Boulevard",
  bvd: "Boulevard",
  ln: "Lane",
  cl: "Close",
  gr: "Grove",
  aly: "Alley",
};

export function expandStreetAbbreviations(query: string) {
  return query.replace(
    /\b([A-Za-z][A-Za-z']*)\s+(cres|cr|st|rd|ave|av|dr|ct|crt|pl|tce|ter|pde|hwy|cct|blvd|bvd|ln|cl|gr|aly)\.?\b/gi,
    (_match, name: string, type: string) =>
      `${name} ${STREET_TYPES[type.toLowerCase()] ?? type}`
  );
}

export function houseNumberFromQuery(query: string) {
  const match = query.trim().match(/^(\d+[a-z]?)\b/i);
  return match?.[1]?.toLowerCase() ?? "";
}

export function isStreetAddressQuery(query: string) {
  return /^\d+[a-z]?\s+\S+/i.test(query.trim());
}

export function parseAddressQuery(query: string) {
  const expanded = expandStreetAbbreviations(query.trim());
  const parts = expanded
    .split(",")
    .map((part) => part.replace(/\b(south australia|australia|\bsa\b)\b/gi, "").trim())
    .filter(Boolean);
  return {
    original: query.trim(),
    expanded,
    street: parts[0] ?? expanded,
    suburb: parts[1] ?? "",
    houseNumber: houseNumberFromQuery(expanded),
  };
}

export function sameHouseNumber(value: string | undefined, expected: string) {
  if (!expected || !value) return false;
  return value.replace(/\s+/g, "").toLowerCase() === expected.replace(/\s+/g, "").toLowerCase();
}

const GENERIC_TOKENS = new Set([
  ...Object.keys(STREET_TYPES),
  ...Object.values(STREET_TYPES).map((value) => value.toLowerCase()),
  "south",
  "australia",
  "adelaide",
  "the",
  "and",
]);

export function titleCaseWords(value: string) {
  return value
    .split(/\s+/)
    .map((word) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1) : word
    )
    .join(" ");
}

export function streetNameFromQuery(street: string) {
  return titleCaseWords(
    expandStreetAbbreviations(street)
      .replace(/^\d+[a-z]?\s+/i, "")
      .trim()
  );
}

export function distinctiveStreetTokens(street: string) {
  return streetNameFromQuery(street)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !GENERIC_TOKENS.has(token));
}

export function matchesStreetTokens(haystack: string, tokens: string[]) {
  if (tokens.length === 0) return true;
  const hay = haystack.toLowerCase();
  return tokens.every((token) => hay.includes(token));
}

export function interpolateAlongLine(
  coordinates: [number, number][],
  t: number
): { lng: number; lat: number; bearing: number } | null {
  if (coordinates.length < 2) return null;
  const clamped = Math.min(0.9, Math.max(0.1, t));
  const segments: { start: [number, number]; end: [number, number]; length: number }[] = [];
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i += 1) {
    const start = coordinates[i];
    const end = coordinates[i + 1];
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    segments.push({ start, end, length });
    total += length;
  }
  if (total === 0) return null;
  let remaining = total * clamped;
  for (const segment of segments) {
    if (remaining > segment.length && segment !== segments[segments.length - 1]) {
      remaining -= segment.length;
      continue;
    }
    const ratio = segment.length === 0 ? 0 : remaining / segment.length;
    const lng = segment.start[0] + (segment.end[0] - segment.start[0]) * ratio;
    const lat = segment.start[1] + (segment.end[1] - segment.start[1]) * ratio;
    const bearing = Math.atan2(
      segment.end[0] - segment.start[0],
      segment.end[1] - segment.start[1]
    );
    return { lng, lat, bearing };
  }
  const last = coordinates[coordinates.length - 1];
  return { lng: last[0], lat: last[1], bearing: 0 };
}

export function offsetFromStreet(
  lng: number,
  lat: number,
  bearing: number,
  houseNumber: string
) {
  const n = parseInt(houseNumber, 10);
  const side = Number.isFinite(n) && n % 2 === 0 ? 1 : -1;
  const meters = 18 * side;
  const dx = Math.sin(bearing + Math.PI / 2) * (meters / 111320);
  const dy = Math.cos(bearing + Math.PI / 2) * (meters / 110540);
  return { lng: lng + dx, lat: lat + dy };
}

export function houseNumberProgress(houseNumber: string) {
  const n = parseInt(houseNumber, 10);
  if (!Number.isFinite(n) || n <= 0) return 0.5;
  const assumedMax = Math.max(36, n + 10);
  return n / assumedMax;
}
