"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import EventGrid from "@/components/browse/EventGrid";
import FilterPanel from "@/components/browse/FilterPanel";
import { studentClubs } from "@/data/organisations";
import { useEventCatalog } from "@/hooks/useEventCatalog";
import {
  activeFilterCount,
  countWithPlaces,
  defaultFilters,
  filterAndSortEvents,
  filtersFromSearchParams,
  getFacetCounts,
  hasActiveFilters,
  searchParamsFromFilters,
  type EventFilters,
  type EventSort,
} from "@/lib/event-filters";

const sortOptions: { value: EventSort; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "soonest", label: "Soonest" },
  { value: "places", label: "Most places" },
  { value: "az", label: "A to Z" },
];

export default function EventBrowse({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { events } = useEventCatalog();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const syncFromUrl = () => {
      const next = window.location.search.replace(/^\?/, "");
      setQuery((current) => (current === next ? current : next));
    };
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const filters = useMemo(
    () => filtersFromSearchParams(new URLSearchParams(query)),
    [query]
  );
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchInput === filters.search) return;
      commitFilters({ ...filters, search: searchInput });
    }, 220);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const commitFilters = (next: EventFilters) => {
    const nextQuery = searchParamsFromFilters(next);
    setQuery(nextQuery);
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  };

  const filteredEvents = useMemo(
    () => filterAndSortEvents(events, filters),
    [events, filters]
  );

  const facetCounts = useMemo(
    () => ({
      campuses: getFacetCounts(events, filters, "campuses"),
      categories: getFacetCounts(events, filters, "categories"),
      clubIds: getFacetCounts(events, filters, "clubIds"),
      statuses: getFacetCounts(events, filters, "statuses"),
      tags: getFacetCounts(events, filters, "tags"),
      withPlaces: countWithPlaces(events, filters),
    }),
    [events, filters]
  );

  const filtersActive = hasActiveFilters(filters);
  const selectedCount = activeFilterCount(filters);
  const liveCount = events.filter((event) => event.status === "In progress").length;

  const pills = useMemo(() => {
    const items: { key: string; label: string; clear: () => EventFilters }[] = [];
    if (filters.search.trim()) {
      items.push({
        key: "q",
        label: `“${filters.search.trim()}”`,
        clear: () => ({ ...filters, search: "" }),
      });
    }
    if (filters.hasPlaces) {
      items.push({
        key: "places",
        label: "Places open",
        clear: () => ({ ...filters, hasPlaces: false }),
      });
    }
    for (const status of filters.statuses) {
      items.push({
        key: `status-${status}`,
        label: status === "In progress" ? "Happening now" : status,
        clear: () => ({
          ...filters,
          statuses: filters.statuses.filter((item) => item !== status),
        }),
      });
    }
    for (const campus of filters.campuses) {
      items.push({
        key: `campus-${campus}`,
        label: campus,
        clear: () => ({
          ...filters,
          campuses: filters.campuses.filter((item) => item !== campus),
        }),
      });
    }
    for (const category of filters.categories) {
      items.push({
        key: `category-${category}`,
        label: category,
        clear: () => ({
          ...filters,
          categories: filters.categories.filter((item) => item !== category),
        }),
      });
    }
    for (const clubId of filters.clubIds) {
      const club = studentClubs.find((item) => item.id === clubId);
      items.push({
        key: `club-${clubId}`,
        label: club?.shortName ?? clubId,
        clear: () => ({
          ...filters,
          clubIds: filters.clubIds.filter((item) => item !== clubId),
        }),
      });
    }
    for (const tag of filters.tags) {
      items.push({
        key: `tag-${tag}`,
        label: tag,
        clear: () => ({
          ...filters,
          tags: filters.tags.filter((item) => item !== tag),
        }),
      });
    }
    return items;
  }, [filters]);

  const clearFilters = () => {
    setSearchInput("");
    commitFilters({ ...defaultFilters, sort: filters.sort });
  };

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const filterProps = {
    filters,
    counts: facetCounts,
    resultCount: filteredEvents.length,
    onChange: commitFilters,
    onClear: clearFilters,
  };

  return (
    <div className="bg-[#fafafa] text-[#171717]">
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">
                Discover
              </p>
              <h1 className="mt-1 text-2xl font-semibold">Browse events</h1>
            </div>
            <p className="text-sm text-gray-500" aria-live="polite">
              {filteredEvents.length}{" "}
              {filteredEvents.length === 1 ? "event" : "events"}
              {selectedCount ? ` · ${selectedCount} filters` : ""}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row">
            <label className="sr-only" htmlFor="event-search">
              Search events, tags and clubs
            </label>
            <input
              id="event-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search events, clubs, tags or campus"
              className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-4 py-3 outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-100"
            />
            <div className="flex gap-3">
              <label className="sr-only" htmlFor="event-sort">
                Sort events
              </label>
              <select
                id="event-sort"
                value={filters.sort}
                onChange={(event) =>
                  commitFilters({
                    ...filters,
                    sort: event.target.value as EventSort,
                  })
                }
                className="rounded-md border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-purple-700"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="rounded-md border border-gray-200 px-4 py-3 text-sm font-semibold hover:border-purple-700 lg:hidden"
              >
                Filters{selectedCount ? ` (${selectedCount})` : ""}
              </button>
            </div>
          </div>

          {pills.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {pills.map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => {
                    const next = pill.clear();
                    if (pill.key === "q") setSearchInput("");
                    commitFilters(next);
                  }}
                  className="rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-900 transition hover:bg-purple-100"
                >
                  {pill.label} ×
                </button>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-purple-700 hover:underline"
              >
                Clear all
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[300px_1fr] lg:items-start lg:px-10">
        <aside className="hidden h-[calc(100vh-11rem)] lg:sticky lg:top-[9.5rem] lg:block">
          <div className="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <FilterPanel {...filterProps} />
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          {!filtersActive && liveCount > 0 ? (
            <button
              type="button"
              onClick={() =>
                commitFilters({
                  ...filters,
                  statuses: ["In progress"],
                })
              }
              className="flex w-full items-center justify-between gap-4 rounded-xl bg-purple-700 px-5 py-4 text-left text-white transition hover:bg-purple-800"
            >
              <span>
                <span className="block text-sm font-bold uppercase tracking-[0.16em] text-purple-200">
                  Happening now
                </span>
                <span className="mt-1 block font-semibold">
                  {liveCount} live {liveCount === 1 ? "event" : "events"} on campus
                </span>
              </span>
              <span className="text-sm font-semibold">View live →</span>
            </button>
          ) : null}

          {filteredEvents.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-8 py-14 text-center">
              <h2 className="text-xl font-semibold">No events match these filters</h2>
              <p className="mt-3 text-gray-600">
                Clear a filter or search a different campus, club or tag.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 bg-black px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <EventGrid
              events={filteredEvents}
              title={filtersActive ? "Matching events" : "All events"}
              subtitle="Open a card for roles, the map and the application form."
              animate
            />
          )}
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="filter-drawer absolute inset-y-0 left-0 flex w-[min(100%,22rem)] flex-col bg-white shadow-2xl">
            <FilterPanel
              {...filterProps}
              mobile
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
