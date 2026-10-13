import {
  getEventDateValue,
  getEventHost,
  type Event,
} from "@/data/events";

export type EventSort = "trending" | "places" | "soonest" | "az";

export type EventFilters = {
  search: string;
  campuses: string[];
  categories: string[];
  clubIds: string[];
  tags: string[];
  statuses: string[];
  sort: EventSort;
  hasPlaces: boolean;
};

export const defaultFilters: EventFilters = {
  search: "",
  campuses: [],
  categories: [],
  clubIds: [],
  tags: [],
  statuses: [],
  sort: "trending",
  hasPlaces: false,
};

export function parseListParam(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toggleListValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function hasActiveFilters(filters: EventFilters) {
  return Boolean(
    filters.search.trim() ||
      filters.campuses.length > 0 ||
      filters.categories.length > 0 ||
      filters.clubIds.length > 0 ||
      filters.tags.length > 0 ||
      filters.statuses.length > 0 ||
      filters.hasPlaces
  );
}

export function activeFilterCount(filters: EventFilters) {
  return (
    (filters.search.trim() ? 1 : 0) +
    filters.campuses.length +
    filters.categories.length +
    filters.clubIds.length +
    filters.tags.length +
    filters.statuses.length +
    (filters.hasPlaces ? 1 : 0)
  );
}

export function filtersFromSearchParams(params: URLSearchParams): EventFilters {
  const sort = params.get("sort") as EventSort | null;
  return {
    search: params.get("q") ?? "",
    campuses: parseListParam(params.get("campus")),
    categories: parseListParam(params.get("category")),
    clubIds: parseListParam(params.get("club")),
    tags: parseListParam(params.get("tag")),
    statuses: parseListParam(params.get("status")),
    sort:
      sort === "places" || sort === "soonest" || sort === "az" || sort === "trending"
        ? sort
        : "trending",
    hasPlaces: params.get("places") === "1",
  };
}

export function searchParamsFromFilters(filters: EventFilters) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("q", filters.search.trim());
  if (filters.campuses.length) params.set("campus", filters.campuses.join(","));
  if (filters.categories.length) params.set("category", filters.categories.join(","));
  if (filters.clubIds.length) params.set("club", filters.clubIds.join(","));
  if (filters.statuses.length) params.set("status", filters.statuses.join(","));
  if (filters.tags.length) params.set("tag", filters.tags.join(","));
  if (filters.sort !== "trending") params.set("sort", filters.sort);
  if (filters.hasPlaces) params.set("places", "1");
  return params.toString();
}

function matchesSearch(event: Event, query: string) {
  if (!query) return true;
  const host = getEventHost(event);
  const haystack = [
    event.title,
    event.tagline,
    event.description,
    event.campus,
    event.category,
    event.location,
    event.status,
    ...event.tags,
    host?.name ?? "",
    host?.shortName ?? "",
    host?.focus ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function matchesFilters(
  event: Event,
  filters: EventFilters,
  omit?: keyof EventFilters
) {
  const query = filters.search.toLowerCase().trim();
  const checkSearch = omit !== "search";
  const checkCampus = omit !== "campuses";
  const checkCategory = omit !== "categories";
  const checkClub = omit !== "clubIds";
  const checkStatus = omit !== "statuses";
  const checkTags = omit !== "tags";
  const checkPlaces = omit !== "hasPlaces";

  if (checkSearch && !matchesSearch(event, query)) return false;
  if (
    checkCampus &&
    filters.campuses.length > 0 &&
    !filters.campuses.includes(event.campus)
  ) {
    return false;
  }
  if (
    checkCategory &&
    filters.categories.length > 0 &&
    !filters.categories.includes(event.category)
  ) {
    return false;
  }
  if (
    checkClub &&
    filters.clubIds.length > 0 &&
    !filters.clubIds.includes(event.organisationId)
  ) {
    return false;
  }
  if (
    checkStatus &&
    filters.statuses.length > 0 &&
    !filters.statuses.includes(event.status)
  ) {
    return false;
  }
  if (
    checkTags &&
    filters.tags.length > 0 &&
    !filters.tags.some((tag) => event.tags.includes(tag))
  ) {
    return false;
  }
  if (checkPlaces && filters.hasPlaces && event.placesAvailable <= 0) {
    return false;
  }
  return true;
}

export function filterAndSortEvents(allEvents: Event[], filters: EventFilters) {
  const filtered = allEvents.filter((event) => matchesFilters(event, filters));

  return [...filtered].sort((a, b) => {
    if (filters.sort === "places") {
      return b.placesAvailable - a.placesAvailable;
    }
    if (filters.sort === "soonest") {
      return getEventDateValue(a) - getEventDateValue(b);
    }
    if (filters.sort === "az") {
      return a.title.localeCompare(b.title);
    }
    return b.trendingScore - a.trendingScore;
  });
}

export function getFacetCounts(
  allEvents: Event[],
  filters: EventFilters,
  facet: "campuses" | "categories" | "clubIds" | "statuses" | "tags"
) {
  const counts: Record<string, number> = {};
  for (const event of allEvents) {
    if (!matchesFilters(event, filters, facet)) continue;
    if (facet === "campuses") {
      counts[event.campus] = (counts[event.campus] ?? 0) + 1;
    } else if (facet === "categories") {
      counts[event.category] = (counts[event.category] ?? 0) + 1;
    } else if (facet === "clubIds") {
      counts[event.organisationId] = (counts[event.organisationId] ?? 0) + 1;
    } else if (facet === "statuses") {
      counts[event.status] = (counts[event.status] ?? 0) + 1;
    } else {
      for (const tag of event.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
  }
  return counts;
}

export function countWithPlaces(allEvents: Event[], filters: EventFilters) {
  return allEvents.filter(
    (event) =>
      matchesFilters(event, filters, "hasPlaces") && event.placesAvailable > 0
  ).length;
}
