"use client";

import { useState } from "react";

import EventMap from "@/components/maps/EventMap";

export type MapLocation = {
  address: string;
  lat: number;
  lng: number;
};

type SearchHit = {
  display_name: string;
  lat: string;
  lon: string;
};

type LocationPickerProps = {
  value: MapLocation | null;
  onChange: (value: MapLocation) => void;
};

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [query, setQuery] = useState(value?.address ?? "");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    const q = query.trim();
    if (q.length < 3) {
      setError("Enter at least 3 characters to search a place.");
      return;
    }

    setSearching(true);
    setError("");
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(
        `${q}, South Australia`
      )}`;
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error("Search failed");
      }
      const hits = (await response.json()) as SearchHit[];
      setResults(hits);
      if (hits.length === 0) {
        setError("No matching places. Try a street, suburb or campus name.");
      }
    } catch {
      setError("Map search is unavailable right now. You can still type the address.");
    } finally {
      setSearching(false);
    }
  };

  const choose = (hit: SearchHit) => {
    const next = {
      address: hit.display_name,
      lat: Number(hit.lat),
      lng: Number(hit.lon),
    };
    onChange(next);
    setQuery(hit.display_name);
    setResults([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void search();
            }
          }}
          placeholder="Search a campus, street or venue"
          className="min-w-0 flex-1 border border-gray-300 px-4 py-3 outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-100"
        />
        <button
          type="button"
          onClick={() => void search()}
          className="bg-black px-4 py-3 font-semibold text-white hover:bg-purple-700"
        >
          {searching ? "Searching..." : "Find"}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {results.length > 0 ? (
        <ul className="border border-gray-200 bg-white">
          {results.map((hit) => (
            <li key={`${hit.lat}-${hit.lon}`}>
              <button
                type="button"
                onClick={() => choose(hit)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-purple-50"
              >
                {hit.display_name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {value ? (
        <EventMap lat={value.lat} lng={value.lng} label={value.address} />
      ) : (
        <p className="text-sm text-gray-500">
          Search and choose a result to pin the event on the map.
        </p>
      )}
    </div>
  );
}
