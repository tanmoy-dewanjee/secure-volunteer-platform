"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import EventPoster from "@/components/browse/EventPoster";
import EventRow from "@/components/browse/EventRow";
import FilterChips from "@/components/browse/FilterChips";
import HeroBillboard from "@/components/browse/HeroBillboard";
import {
  campusOptions,
  categoryOptions,
  events,
  getAllEventTags,
  statusOptions,
} from "@/data/events";
import { studentClubs } from "@/data/organisations";
import { useViewHistory } from "@/hooks/useViewHistory";
import {
  filterAndSortEvents,
  hasActiveFilters,
  parseListParam,
  toggleListValue,
  type EventSort,
} from "@/lib/event-filters";
import { buildBrowseRows } from "@/lib/recommendations";
import { clearViewHistory } from "@/lib/view-history";

const sortOptions: { value: EventSort; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "soonest", label: "Soonest" },
  { value: "places", label: "Most places" },
  { value: "az", label: "A to Z" },
];

export default function EventBrowse() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const history = useViewHistory();
  const allTags = getAllEventTags();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [campuses, setCampuses] = useState(
    parseListParam(searchParams.get("campus"))
  );
  const [categories, setCategories] = useState(
    parseListParam(searchParams.get("category"))
  );
  const [clubIds, setClubIds] = useState(
    parseListParam(searchParams.get("club"))
  );
  const [statuses, setStatuses] = useState(
    parseListParam(searchParams.get("status"))
  );
  const [sort, setSort] = useState<EventSort>(
    (searchParams.get("sort") as EventSort) || "trending"
  );
  const [tags, setTags] = useState(parseListParam(searchParams.get("tag")));
  const [tagQuery, setTagQuery] = useState("");

  const filters = useMemo(
    () => ({
      search,
      campuses,
      categories,
      clubIds,
      tags,
      statuses,
      sort,
    }),
    [search, campuses, categories, clubIds, tags, statuses, sort]
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (campuses.length) params.set("campus", campuses.join(","));
    if (categories.length) params.set("category", categories.join(","));
    if (clubIds.length) params.set("club", clubIds.join(","));
    if (statuses.length) params.set("status", statuses.join(","));
    if (sort !== "trending") params.set("sort", sort);
    if (tags.length) params.set("tag", tags.join(","));

    const next = params.toString();
    if (next === searchParams.toString()) return;
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [
    search,
    campuses,
    categories,
    clubIds,
    statuses,
    sort,
    tags,
    pathname,
    router,
    searchParams,
  ]);

  const featured =
    events.find((event) => event.featured) ??
    [...events].sort((a, b) => b.trendingScore - a.trendingScore)[0];

  const filteredEvents = useMemo(
    () => filterAndSortEvents(events, filters),
    [filters]
  );

  const filtersActive = hasActiveFilters(filters);
  const rows = useMemo(() => buildBrowseRows(events, history), [history]);

  const matchingTags = useMemo(() => {
    const query = tagQuery.trim().toLowerCase();
    const available = allTags.filter((tag) => !tags.includes(tag));
    if (!query) return available;
    return available.filter((tag) => tag.toLowerCase().includes(query));
  }, [allTags, tagQuery, tags]);

  const exactTagMatch = allTags.find(
    (tag) => tag.toLowerCase() === tagQuery.trim().toLowerCase()
  );

  const selectedClubs = studentClubs.filter((club) =>
    clubIds.includes(club.id)
  );

  const clearFilters = () => {
    setSearch("");
    setCampuses([]);
    setCategories([]);
    setClubIds([]);
    setStatuses([]);
    setSort("trending");
    setTags([]);
    setTagQuery("");
  };

  const addTag = (tag: string) => {
    setTags((current) =>
      current.includes(tag) ? current : [...current, tag]
    );
    setTagQuery("");
  };

  const handleTagSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = tagQuery.trim().toLowerCase();
    if (!query) return;

    const match =
      exactTagMatch ??
      allTags.find((tag) => tag.toLowerCase().includes(query));

    if (match) addTag(match);
  };

  return (
    <div className="bg-white text-[#171717]">
      {!filtersActive && featured ? <HeroBillboard event={featured} /> : null}

      <section className="bg-[#171717] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-300">
                Discover
              </p>
              <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
                Search clubs, tags and opportunities
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-300">
                Select as many clubs, campuses, categories and tags as you like.
                Search for a tag if you do not want to scan the full list.
              </p>
            </div>
            {history.length > 0 ? (
              <button
                type="button"
                onClick={clearViewHistory}
                className="text-sm font-semibold text-gray-300 underline hover:text-white"
              >
                Reset recommendations
              </button>
            ) : null}
          </div>

          <label className="sr-only" htmlFor="event-search">
            Search events, tags and clubs
          </label>
          <input
            id="event-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by event, tag, campus or student club..."
            className="mt-6 w-full bg-white px-5 py-4 text-lg text-black outline-none focus:ring-2 focus:ring-purple-400"
          />

          <div className="mt-8 space-y-7">
            <FilterChips
              legend="Student clubs"
              options={studentClubs.map((club) => ({
                value: club.id,
                label: club.shortName,
              }))}
              selected={clubIds}
              onToggle={(value) => setClubIds((current) => toggleListValue(current, value))}
            />

            <FilterChips
              legend="Campus"
              options={campusOptions.map((campus) => ({
                value: campus,
                label: campus,
              }))}
              selected={campuses}
              onToggle={(value) =>
                setCampuses((current) => toggleListValue(current, value))
              }
            />

            <FilterChips
              legend="Category"
              options={categoryOptions.map((category) => ({
                value: category,
                label: category,
              }))}
              selected={categories}
              onToggle={(value) =>
                setCategories((current) => toggleListValue(current, value))
              }
            />

            <FilterChips
              legend="Status"
              options={statusOptions.map((status) => ({
                value: status,
                label: status,
              }))}
              selected={statuses}
              onToggle={(value) =>
                setStatuses((current) => toggleListValue(current, value))
              }
            />

            <FilterChips
              legend="Sort"
              options={sortOptions}
              selected={[sort]}
              multiple={false}
              onToggle={(value) => setSort(value as EventSort)}
            />

            <fieldset>
              <legend className="text-sm font-semibold text-gray-300">
                Tags
              </legend>
              <form
                onSubmit={handleTagSearch}
                className="mt-3 flex max-w-xl overflow-hidden bg-white"
              >
                <label htmlFor="tag-search" className="sr-only">
                  Search for a tag
                </label>
                <input
                  id="tag-search"
                  type="search"
                  value={tagQuery}
                  onChange={(event) => setTagQuery(event.target.value)}
                  placeholder="Search for a tag, then press enter"
                  className="min-w-0 flex-1 px-4 py-3 text-black outline-none"
                />
                <button
                  type="submit"
                  className="bg-purple-700 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-600"
                >
                  Add tag
                </button>
              </form>

              {tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setTags((current) =>
                          current.filter((item) => item !== tag)
                        )
                      }
                      className="bg-purple-700 px-3 py-1.5 text-sm font-medium text-white"
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {matchingTags.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    {tagQuery.trim()
                      ? `No tags match “${tagQuery.trim()}”.`
                      : "All matching tags are already selected."}
                  </p>
                ) : (
                  matchingTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
                    >
                      {tag}
                    </button>
                  ))
                )}
              </div>
            </fieldset>
          </div>

          {filtersActive ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {search.trim() ? (
                <span className="bg-white/10 px-3 py-1 text-sm">
                  Search: {search.trim()}
                </span>
              ) : null}
              {selectedClubs.map((club) => (
                <span key={club.id} className="bg-white/10 px-3 py-1 text-sm">
                  {club.shortName}
                </span>
              ))}
              {[...campuses, ...categories, ...statuses, ...tags].map((item) => (
                <span key={item} className="bg-white/10 px-3 py-1 text-sm">
                  {item}
                </span>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="ml-2 text-sm font-semibold underline"
              >
                Clear all
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <div className="space-y-12 bg-white py-12">
        {filtersActive ? (
          <section className="px-6 lg:px-12">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Matching opportunities</h2>
              <p className="mt-1 text-sm text-gray-500">
                {filteredEvents.length}{" "}
                {filteredEvents.length === 1 ? "result" : "results"}
              </p>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="border border-gray-200 bg-gray-50 px-8 py-14 text-center">
                <h3 className="text-2xl font-semibold">No opportunities found</h3>
                <p className="mt-3 text-gray-600">
                  Try another club, tag, campus or search term.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 bg-black px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {filteredEvents.map((event) => (
                  <EventPoster key={event.id} event={event} />
                ))}
              </div>
            )}
          </section>
        ) : (
          rows.map((row) => (
            <EventRow
              key={row.id}
              title={row.title}
              subtitle={row.subtitle}
              events={row.events}
            />
          ))
        )}
      </div>
    </div>
  );
}
