import { NextResponse } from "next/server";

import { searchKnownPlaces } from "@/lib/geo/places";
import {
  distinctiveStreetTokens,
  houseNumberProgress,
  interpolateAlongLine,
  isStreetAddressQuery,
  matchesStreetTokens,
  offsetFromStreet,
  parseAddressQuery,
  sameHouseNumber,
  streetNameFromQuery,
} from "@/lib/geo/query";

type NominatimHit = {
  display_name: string;
  lat: string;
  lon: string;
  osm_type?: string;
  osm_id?: number;
  addresstype?: string;
  type?: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    state?: string;
    postcode?: string;
  };
  geojson?: { type?: string; coordinates?: unknown };
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_type?: string;
    osm_id?: number;
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    city?: string;
    locality?: string;
    suburb?: string;
    state?: string;
    country?: string;
    postcode?: string;
    osm_value?: string;
    type?: string;
  };
};

export type GeoHit = {
  label: string;
  address: string;
  lat: number;
  lng: number;
  source: "campus" | "search";
  kind: "address" | "street" | "place" | "campus";
  houseNumber?: string;
  osmRef?: string;
};

const USER_AGENT =
  "AdelaideUniversity-SVP/1.0 (educational-demo; contact: irp-a01)";

const ADELAIDE = { lat: -34.9285, lng: 138.6007 };

function osmRef(type?: string, id?: number) {
  if (!type || !id) return undefined;
  const letter = type[0]?.toUpperCase();
  if (letter !== "W" && letter !== "N" && letter !== "R") return undefined;
  return `${letter}${id}`;
}

function kindFromType(type?: string, houseNumber?: string): GeoHit["kind"] {
  if (houseNumber) return "address";
  const value = (type ?? "").toLowerCase();
  if (value === "house" || value === "building" || value === "address") {
    return "address";
  }
  if (
    value === "street" ||
    value === "road" ||
    value === "residential" ||
    value === "highway"
  ) {
    return "street";
  }
  return "place";
}

function kindLabel(kind: GeoHit["kind"]) {
  if (kind === "address") return "Exact address";
  if (kind === "street") return "Street";
  if (kind === "campus") return "Campus / known venue";
  return "Place";
}

async function fetchJson(url: URL) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`${url.hostname} ${response.status}`);
  }
  return response.json();
}

function nominatimHit(hit: NominatimHit): GeoHit | null {
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const houseNumber = hit.address?.house_number;
  return {
    label: hit.display_name,
    address: hit.display_name,
    lat,
    lng,
    source: "search",
    kind: kindFromType(hit.addresstype || hit.type, houseNumber),
    houseNumber,
    osmRef: osmRef(hit.osm_type, hit.osm_id),
  };
}

async function nominatimSearch(params: Record<string, string>): Promise<GeoHit[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("dedupe", "0");
  url.searchParams.set("limit", "8");
  url.searchParams.set("countrycodes", "au");
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  const hits = (await fetchJson(url)) as NominatimHit[];
  return hits.map(nominatimHit).filter((hit): hit is GeoHit => Boolean(hit));
}

function photonLabel(props: NonNullable<PhotonFeature["properties"]>) {
  const line = [props.housenumber, props.street || props.name]
    .filter(Boolean)
    .join(" ");
  const locality =
    props.suburb || props.district || props.city || props.locality || "";
  const state =
    props.state === "South Australia" || props.state === "SA"
      ? props.postcode
        ? `SA ${props.postcode}`
        : "SA"
      : props.state;
  return [line || props.name, locality, state].filter(Boolean).join(", ");
}

async function photonSearch(query: string): Promise<GeoHit[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "10");
  url.searchParams.set("lang", "en");
  url.searchParams.set("lat", String(ADELAIDE.lat));
  url.searchParams.set("lon", String(ADELAIDE.lng));
  url.searchParams.set("location_bias_scale", "0.3");

  const payload = (await fetchJson(url)) as { features?: PhotonFeature[] };
  const hits: GeoHit[] = [];
  for (const feature of payload.features ?? []) {
    const lng = feature.geometry?.coordinates?.[0];
    const lat = feature.geometry?.coordinates?.[1];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const props = feature.properties ?? {};
    if (props.country && !/australia/i.test(props.country)) continue;
    const address = photonLabel(props);
    hits.push({
      label: address,
      address,
      lat: lat as number,
      lng: lng as number,
      source: "search",
      kind: kindFromType(props.type || props.osm_value, props.housenumber),
      houseNumber: props.housenumber,
      osmRef: osmRef(props.osm_type, props.osm_id),
    });
  }
  return hits;
}

function lineCoordinates(geojson: NominatimHit["geojson"]): [number, number][] {
  if (!geojson?.coordinates) return [];
  if (geojson.type === "LineString" && Array.isArray(geojson.coordinates)) {
    return geojson.coordinates as [number, number][];
  }
  if (geojson.type === "MultiLineString" && Array.isArray(geojson.coordinates)) {
    const lines = geojson.coordinates as [number, number][][];
    return lines.sort((a, b) => b.length - a.length)[0] ?? [];
  }
  return [];
}

async function lookupWayGeometry(ref: string) {
  const url = new URL("https://nominatim.openstreetmap.org/lookup");
  url.searchParams.set("osm_ids", ref);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("polygon_geojson", "1");
  url.searchParams.set("addressdetails", "1");
  const hits = (await fetchJson(url)) as NominatimHit[];
  return hits[0] ?? null;
}

function pinOnStreet(
  street: GeoHit,
  houseNumber: string,
  streetName: string,
  geometry: NominatimHit
): GeoHit | null {
  const point = interpolateAlongLine(
    lineCoordinates(geometry.geojson),
    houseNumberProgress(houseNumber)
  );
  if (!point) return null;
  const offset = offsetFromStreet(point.lng, point.lat, point.bearing, houseNumber);
  const pretty = houseNumber.toUpperCase();
  const locality = [
    geometry.address?.suburb || geometry.address?.town || geometry.address?.city,
    geometry.address?.postcode
      ? `SA ${geometry.address.postcode}`
      : geometry.address?.state,
  ]
    .filter(Boolean)
    .join(", ");
  const address = locality
    ? `${pretty} ${streetName}, ${locality}`
    : `${pretty} ${street.address}`;
  return {
    label: address,
    address,
    lat: offset.lat,
    lng: offset.lng,
    source: "search",
    kind: "address",
    houseNumber: pretty,
    osmRef: street.osmRef,
  };
}

function scoreHit(hit: GeoHit, houseNumber: string, tokens: string[]) {
  let score = 0;
  const hay = `${hit.label} ${hit.address}`.toLowerCase();
  if (matchesStreetTokens(hay, tokens)) score += 80;
  if (sameHouseNumber(hit.houseNumber, houseNumber) && matchesStreetTokens(hay, tokens)) {
    score += 140;
  } else if (sameHouseNumber(hit.houseNumber, houseNumber)) {
    score -= 20;
  }
  if (hit.kind === "address") score += 20;
  if (hit.kind === "street" && matchesStreetTokens(hay, tokens)) score += 30;
  if (hit.kind === "campus") score += houseNumber ? -40 : 70;
  if (/\b(sa|south australia|adelaide|holden hill)\b/i.test(hay)) score += 8;
  return score;
}

function mergeHits(groups: GeoHit[][], houseNumber: string, tokens: string[]) {
  const seen = new Set<string>();
  const merged: GeoHit[] = [];
  for (const group of groups) {
    for (const hit of group) {
      const key = `${hit.lat.toFixed(6)},${hit.lng.toFixed(6)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(hit);
    }
  }
  const filtered = tokens.length
    ? merged.filter((hit) =>
        matchesStreetTokens(`${hit.label} ${hit.address}`, tokens)
      )
    : merged;
  const ranked = (filtered.length ? filtered : merged).sort(
    (a, b) => scoreHit(b, houseNumber, tokens) - scoreHit(a, houseNumber, tokens)
  );
  return ranked.slice(0, 8);
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json(
      { error: "Enter at least 2 characters." },
      { status: 400 }
    );
  }

  const parsed = parseAddressQuery(q);
  const streetAddress = isStreetAddressQuery(q);
  const tokens = distinctiveStreetTokens(parsed.street);
  const streetName = streetNameFromQuery(parsed.street);
  const known: GeoHit[] = streetAddress
    ? []
    : searchKnownPlaces(q).map((place) => ({
        label: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        source: "campus" as const,
        kind: "campus" as const,
      }));

  const remote: GeoHit[][] = [];
  await Promise.all([
    photonSearch(parsed.original)
      .then((hits) => remote.push(hits))
      .catch(() => undefined),
    parsed.expanded !== parsed.original
      ? photonSearch(parsed.expanded)
          .then((hits) => remote.push(hits))
          .catch(() => undefined)
      : Promise.resolve(),
    nominatimSearch({
      q: streetAddress
        ? `${parsed.expanded}, South Australia, Australia`
        : `${parsed.expanded}, South Australia, Australia`,
    })
      .then((hits) => remote.push(hits))
      .catch(() => undefined),
    streetAddress
      ? nominatimSearch({
          street: parsed.street,
          city: parsed.suburb,
          state: "South Australia",
          country: "Australia",
        })
          .then((hits) => remote.push(hits))
          .catch(() => undefined)
      : Promise.resolve(),
  ]);

  const results = mergeHits([known, remote.flat()], parsed.houseNumber, tokens);

  const hasExactHouse = results.some(
    (hit) =>
      hit.kind === "address" &&
      sameHouseNumber(hit.houseNumber, parsed.houseNumber) &&
      matchesStreetTokens(`${hit.label} ${hit.address}`, tokens)
  );

  if (parsed.houseNumber && !hasExactHouse) {
    const streetHit = results.find(
      (hit) =>
        hit.kind === "street" &&
        hit.osmRef &&
        matchesStreetTokens(`${hit.label} ${hit.address}`, tokens)
    );
    if (streetHit?.osmRef) {
      try {
        const geometry = await lookupWayGeometry(streetHit.osmRef);
        if (geometry) {
          const pin = pinOnStreet(
            streetHit,
            parsed.houseNumber,
            streetName || "the street",
            geometry
          );
          if (pin) results.unshift(pin);
        }
      } catch {
        // Street result remains if the way lookup fails.
      }
    }
  }

  return NextResponse.json({
    results: results.slice(0, 8).map((hit) => ({
      label: hit.label,
      address: hit.address,
      lat: hit.lat,
      lng: hit.lng,
      source: hit.source,
      kind: hit.kind,
      houseNumber: hit.houseNumber,
      kindLabel: kindLabel(hit.kind),
    })),
    fallback: remote.flat().length === 0,
  });
}
