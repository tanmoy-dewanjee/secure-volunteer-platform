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
      filters.statuses.length > 0
  );
}

export function filterAndSortEvents(allEvents: Event[], filters: EventFilters) {
  const query = filters.search.toLowerCase().trim();

  const filtered = allEvents.filter((event) => {
    const host = getEventHost(event);
    const haystack = [
      event.title,
      event.tagline,
      event.description,
      event.campus,
      event.category,
      event.location,
      ...event.tags,
      host?.name ?? "",
      host?.shortName ?? "",
      host?.focus ?? "",
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = query === "" || haystack.includes(query);
    const matchesCampus =
      filters.campuses.length === 0 || filters.campuses.includes(event.campus);
    const matchesCategory =
      filters.categories.length === 0 ||
      filters.categories.includes(event.category);
    const matchesClub =
      filters.clubIds.length === 0 ||
      filters.clubIds.includes(event.organisationId);
    const matchesStatus =
      filters.statuses.length === 0 || filters.statuses.includes(event.status);
    const matchesTags =
      filters.tags.length === 0 ||
      filters.tags.some((tag) => event.tags.includes(tag));

    return (
      matchesSearch &&
      matchesCampus &&
      matchesCategory &&
      matchesClub &&
      matchesStatus &&
      matchesTags
    );
  });

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
