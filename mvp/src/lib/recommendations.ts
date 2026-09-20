import { getEventHostType, type Event } from "@/data/events";
import type { ViewRecord } from "@/lib/view-history";

export type RecommendationRow = {
  id: string;
  title: string;
  subtitle?: string;
  events: Event[];
};

function recencyWeight(index: number) {
  return Math.max(0.25, 1 - index * 0.12);
}

function scoreCandidate(candidate: Event, viewed: Event[]) {
  let score = candidate.trendingScore * 0.08;

  viewed.forEach((viewedEvent, index) => {
    const weight = recencyWeight(index);

    if (candidate.category === viewedEvent.category) score += 5 * weight;
    if (candidate.campus === viewedEvent.campus) score += 3 * weight;
    if (candidate.organisationId === viewedEvent.organisationId) {
      score += 2.4 * weight;
    }
    if (getEventHostType(candidate) === getEventHostType(viewedEvent)) {
      score += 2.2 * weight;
    }

    const overlap = candidate.tags.filter((tag) =>
      viewedEvent.tags.includes(tag)
    ).length;
    score += overlap * 1.4 * weight;
  });

  return score;
}

export function buildBrowseRows(
  allEvents: Event[],
  history: ViewRecord[]
): RecommendationRow[] {
  const eventsById = new Map(allEvents.map((event) => [event.id, event]));
  const viewedEvents = history
    .map((record) => eventsById.get(record.eventId))
    .filter((event): event is Event => Boolean(event));

  const viewedIds = new Set(viewedEvents.map((event) => event.id));
  const unseen = allEvents.filter((event) => !viewedIds.has(event.id));
  const openEvents = allEvents.filter((event) => event.status === "Open");

  const rows: RecommendationRow[] = [];

  if (viewedEvents.length > 0) {
    const ranked = [...unseen]
      .map((event) => ({
        event,
        score: scoreCandidate(event, viewedEvents.slice(0, 8)),
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.event);

    const latest = viewedEvents[0];
    rows.push({
      id: "recommended",
      title: "Recommended for you",
      subtitle: latest
        ? `Because you viewed ${latest.title}`
        : "Matched to events you have been browsing",
      events: ranked.slice(0, 10),
    });

    rows.push({
      id: "continue",
      title: "Continue browsing",
      subtitle: "Events you opened recently",
      events: viewedEvents.slice(0, 8),
    });

    const latestCategory = latest?.category;
    if (latestCategory) {
      const similar = unseen.filter(
        (event) =>
          event.category === latestCategory && event.id !== latest.id
      );
      if (similar.length > 0) {
        rows.push({
          id: `because-${latest.id}`,
          title: `More ${latestCategory}`,
          subtitle: `Similar to ${latest.title}`,
          events: similar.slice(0, 10),
        });
      }
    }
  } else {
    rows.push({
      id: "recommended",
      title: "Recommended for you",
      subtitle: "Popular on campus right now — this personalises as you browse",
      events: [...allEvents]
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, 10),
    });
  }

  rows.push({
    id: "trending",
    title: "Trending on campus",
    subtitle: "High-interest volunteer opportunities this month",
    events: [...allEvents]
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 10),
  });

  rows.push({
    id: "open-now",
    title: "Open now",
    subtitle: "Applications are currently being accepted",
    events: openEvents.filter((event) => event.placesAvailable > 0),
  });

  rows.push({
    id: "few-places",
    title: "Filling fast",
    subtitle: "Limited volunteer places remaining",
    events: openEvents
      .filter((event) => event.placesAvailable > 0 && event.placesAvailable <= 8)
      .sort((a, b) => a.placesAvailable - b.placesAvailable),
  });

  const categories = [
    "STEM",
    "Wellbeing",
    "Mentoring",
    "Community",
    "Sport",
  ] as const;
  for (const category of categories) {
    const categoryEvents = allEvents.filter(
      (event) => event.category === category
    );
    if (categoryEvents.length > 0) {
      rows.push({
        id: `category-${category.toLowerCase()}`,
        title: category,
        events: categoryEvents,
      });
    }
  }

  rows.push({
    id: "clubs",
    title: "Student clubs",
    subtitle: "Every opportunity in this demo is hosted by a student club",
    events: allEvents.filter((event) => getEventHostType(event) === "club"),
  });

  rows.push({
    id: "city",
    title: "Adelaide City",
    events: allEvents.filter((event) => event.campus === "Adelaide City"),
  });

  return rows.filter((row) => row.events.length > 0);
}

export function getSimilarEvents(event: Event, allEvents: Event[], limit = 8) {
  return allEvents
    .filter((candidate) => candidate.id !== event.id)
    .map((candidate) => ({
      event: candidate,
      score: scoreCandidate(candidate, [event]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.event);
}
