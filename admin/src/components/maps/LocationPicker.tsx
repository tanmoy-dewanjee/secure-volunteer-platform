"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import EventMap from "@/components/maps/EventMap";
import { campusPin } from "@/lib/geo/places";

export type MapLocation = {
  address: string;
  lat?: number;
  lng?: number;
};

type SearchHit = {
  label: string;
  address: string;
  lat: number;
  lng: number;
  source: "campus" | "search";
  kind?: "address" | "street" | "place" | "campus";
  kindLabel?: string;
  houseNumber?: string;
};

type LocationPickerProps = {
  campus?: string;
  value: MapLocation | null;
  onChange: (value: MapLocation) => void;
};

export default function LocationPicker({
  campus = "Adelaide City",
  value,
  onChange,
}: LocationPickerProps) {
  const [query, setQuery] = useState(value?.address ?? "");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [usedFallback, setUsedFallback] = useState(false);
  const [selected, setSelected] = useState(value?.address ?? "");
  const [manualLat, setManualLat] = useState(
    value?.lat !== undefined ? String(value.lat) : ""
  );
  const [manualLng, setManualLng] = useState(
    value?.lng !== undefined ? String(value.lng) : ""
  );
  const [showManual, setShowManual] = useState(false);
  const requestId = useRef(0);

  const hasPin =
    typeof value?.lat === "number" && typeof value?.lng === "number";

  const pinCampus = useMemo(() => campusPin(campus), [campus]);

  const apply = (next: MapLocation) => {
    onChange(next);
    setQuery(next.address);
    setSelected(next.address);
    setResults([]);
    if (typeof next.lat === "number") setManualLat(String(next.lat));
    if (typeof next.lng === "number") setManualLng(String(next.lng));
  };

  const search = async (raw: string, signal?: AbortSignal) => {
    const q = raw.trim();
    if (q.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }

    const id = ++requestId.current;
    setSearching(true);
    setError("");
    setUsedFallback(false);
    try {
      const response = await fetch(`/api/geo/search?q=${encodeURIComponent(q)}`, {
        signal,
      });
      const payload = (await response.json()) as {
        results?: SearchHit[];
        fallback?: boolean;
        error?: string;
      };
      if (id !== requestId.current) return;
      const hits = payload.results ?? [];
      setResults(hits);
      setUsedFallback(Boolean(payload.fallback) && hits.length > 0);
      if (hits.length === 0) {
        setError(
          "No matching places were found. Keep typing a full address, pin the campus, or enter coordinates — you can still save the event."
        );
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (id !== requestId.current) return;
      setError(
        "Map search is unavailable right now. Use a campus pin, type the venue, or enter coordinates — the event can still be saved."
      );
    } finally {
      if (id === requestId.current) setSearching(false);
    }
  };

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setError("");
      setSearching(false);
      return;
    }
    if (selected && q === selected.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void search(q, controller.signal);
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // search is stable enough for typing; query/selected are the inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selected]);

  const saveAddressOnly = () => {
    const address = query.trim();
    if (address.length < 3) {
      setError("Type a venue or meeting point first.");
      return;
    }
    setError("");
    apply({ address });
  };

  const applyCampusPin = () => {
    apply({
      address: query.trim() || pinCampus.address,
      lat: pinCampus.lat,
      lng: pinCampus.lng,
    });
    setError("");
  };

  const applyManual = () => {
    const lat = Number(manualLat);
    const lng = Number(manualLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Enter numeric latitude and longitude.");
      return;
    }
    if (lat < -44 || lat > -10 || lng < 112 || lng > 154) {
      setError("Those coordinates are outside Australia. Check the numbers.");
      return;
    }
    const address = query.trim() || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    setError("");
    apply({ address, lat, lng });
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="search"
          value={query}
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (results[0]) {
                apply({
                  address: results[0].address,
                  lat: results[0].lat,
                  lng: results[0].lng,
                });
              }
            }
            if (event.key === "Escape") {
              setResults([]);
            }
          }}
          placeholder="Start typing an address, e.g. 8A Gordini Cres"
          className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-100"
        />
        {searching ? (
          <p className="mt-2 text-sm text-gray-500">Searching addresses…</p>
        ) : null}

        {results.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto border border-gray-200 bg-white shadow-lg">
            {results.map((hit) => (
              <li key={`${hit.lat}-${hit.lng}-${hit.label}`}>
                <button
                  type="button"
                  onClick={() =>
                    apply({
                      address: hit.address,
                      lat: hit.lat,
                      lng: hit.lng,
                    })
                  }
                  className="w-full px-4 py-3 text-left hover:bg-purple-50"
                >
                  <span className="block text-sm font-semibold">{hit.label}</span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {hit.kindLabel ||
                      (hit.source === "campus"
                        ? "Campus / known venue"
                        : "Map search")}{" "}
                    · {hit.lat.toFixed(5)}, {hit.lng.toFixed(5)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {usedFallback ? (
        <p className="text-sm text-amber-800">
          Live map search was limited, so campus and known venues are shown
          instead.
        </p>
      ) : null}

      <div className="border border-dashed border-purple-200 bg-purple-50/60 p-4">
        <p className="text-sm font-semibold text-purple-900">
          Can&apos;t find the location?
        </p>
        <p className="mt-1 text-sm text-gray-600">
          You can still add the event. Pin the selected campus, type a meeting
          point without a pin, or enter coordinates from Google Maps.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyCampusPin}
            className="border border-purple-700 px-3 py-2 text-sm font-semibold text-purple-800 hover:bg-purple-700 hover:text-white"
          >
            Pin {campus} campus
          </button>
          <button
            type="button"
            onClick={saveAddressOnly}
            className="border border-gray-300 bg-white px-3 py-2 text-sm font-semibold hover:border-purple-400"
          >
            Save address without a pin
          </button>
          <button
            type="button"
            onClick={() => setShowManual((open) => !open)}
            className="border border-gray-300 bg-white px-3 py-2 text-sm font-semibold hover:border-purple-400"
          >
            {showManual ? "Hide coordinates" : "Enter coordinates"}
          </button>
        </div>
        {showManual ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              inputMode="decimal"
              value={manualLat}
              onChange={(event) => setManualLat(event.target.value)}
              placeholder="Latitude e.g. -34.9205"
              className="border border-gray-300 px-3 py-2 text-sm outline-none focus:border-purple-700"
            />
            <input
              inputMode="decimal"
              value={manualLng}
              onChange={(event) => setManualLng(event.target.value)}
              placeholder="Longitude e.g. 138.6062"
              className="border border-gray-300 px-3 py-2 text-sm outline-none focus:border-purple-700"
            />
            <button
              type="button"
              onClick={applyManual}
              className="bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
            >
              Drop pin
            </button>
          </div>
        ) : null}
      </div>

      {hasPin && value ? (
        <EventMap
          lat={value.lat!}
          lng={value.lng!}
          label={value.address}
          precise
        />
      ) : value?.address ? (
        <p className="border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          Venue saved as <strong>{value.address}</strong> without a map pin.
          Volunteers will still see the written meeting point.
        </p>
      ) : (
        <p className="text-sm text-gray-500">
          Suggestions appear as you type. Choose a result to drop an exact pin.
        </p>
      )}
    </div>
  );
}
