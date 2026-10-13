"use client";

import { useMemo, useState } from "react";

import {
  campusOptions,
  categoryOptions,
  statusOptions,
} from "@/data/events";
import { studentClubs } from "@/data/organisations";
import {
  activeFilterCount,
  toggleListValue,
  type EventFilters,
} from "@/lib/event-filters";

type FilterPanelProps = {
  filters: EventFilters;
  counts: {
    campuses: Record<string, number>;
    categories: Record<string, number>;
    clubIds: Record<string, number>;
    statuses: Record<string, number>;
    tags: Record<string, number>;
    withPlaces: number;
  };
  resultCount: number;
  onChange: (next: EventFilters) => void;
  onClear: () => void;
  onClose?: () => void;
  mobile?: boolean;
};

type SectionId = "status" | "campus" | "category" | "clubs" | "tags" | "availability";

function Chevron({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-block text-gray-400 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden
    >
      ⌄
    </span>
  );
}

function FilterCheck({
  label,
  count,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  count: number;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={checked}
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition ${
        disabled
          ? "cursor-not-allowed opacity-35"
          : checked
            ? "bg-purple-50"
            : "hover:bg-gray-50"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${
          checked
            ? "border-purple-700 bg-purple-700 text-white"
            : "border-gray-300 bg-white"
        }`}
        aria-hidden
      >
        {checked ? "✓" : ""}
      </span>
      <span className="min-w-0 flex-1 leading-5">{label}</span>
      <span className="tabular-nums text-xs text-gray-400">{count}</span>
    </button>
  );
}

function Section({
  id,
  title,
  selected,
  open,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  selected: number;
  open: boolean;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-gray-100 py-3 last:border-b-0">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between py-1 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold">
          {title}
          {selected > 0 ? (
            <span className="ml-2 rounded-full bg-purple-700 px-2 py-0.5 text-[11px] font-bold text-white">
              {selected}
            </span>
          ) : null}
        </span>
        <Chevron open={open} />
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-2">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function FilterPanel({
  filters,
  counts,
  resultCount,
  onChange,
  onClear,
  onClose,
  mobile = false,
}: FilterPanelProps) {
  const [open, setOpen] = useState<Record<SectionId, boolean>>({
    status: true,
    campus: true,
    category: true,
    clubs: true,
    tags: false,
    availability: true,
  });
  const [clubQuery, setClubQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const selected = activeFilterCount(filters);

  const clubs = useMemo(() => {
    const query = clubQuery.trim().toLowerCase();
    return studentClubs.filter((club) => {
      if (!query) return true;
      return (
        club.shortName.toLowerCase().includes(query) ||
        club.name.toLowerCase().includes(query) ||
        club.focus.toLowerCase().includes(query)
      );
    });
  }, [clubQuery]);

  const tags = useMemo(() => {
    const query = tagQuery.trim().toLowerCase();
    return Object.keys(counts.tags)
      .sort((a, b) => (counts.tags[b] ?? 0) - (counts.tags[a] ?? 0) || a.localeCompare(b))
      .filter((tag) => (query ? tag.toLowerCase().includes(query) : true));
  }, [counts.tags, tagQuery]);

  const toggleSection = (id: SectionId) => {
    setOpen((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <p className="text-base font-semibold">Filters</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {selected ? `${selected} selected` : "Refine the catalogue"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selected > 0 ? (
            <button
              type="button"
              onClick={onClear}
              className="text-sm font-semibold text-purple-700 hover:underline"
            >
              Clear
            </button>
          ) : null}
          {mobile && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold text-gray-500"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <Section
          id="availability"
          title="Availability"
          selected={filters.hasPlaces ? 1 : 0}
          open={open.availability}
          onToggle={toggleSection}
        >
          <FilterCheck
            label="Places still open"
            count={counts.withPlaces}
            checked={filters.hasPlaces}
            disabled={counts.withPlaces === 0 && !filters.hasPlaces}
            onToggle={() =>
              onChange({ ...filters, hasPlaces: !filters.hasPlaces })
            }
          />
        </Section>

        <Section
          id="status"
          title="Status"
          selected={filters.statuses.length}
          open={open.status}
          onToggle={toggleSection}
        >
          {statusOptions.map((status) => (
            <FilterCheck
              key={status}
              label={status === "In progress" ? "Happening now" : status}
              count={counts.statuses[status] ?? 0}
              checked={filters.statuses.includes(status)}
              disabled={
                (counts.statuses[status] ?? 0) === 0 &&
                !filters.statuses.includes(status)
              }
              onToggle={() =>
                onChange({
                  ...filters,
                  statuses: toggleListValue(filters.statuses, status),
                })
              }
            />
          ))}
        </Section>

        <Section
          id="campus"
          title="Campus"
          selected={filters.campuses.length}
          open={open.campus}
          onToggle={toggleSection}
        >
          {campusOptions.map((campus) => (
            <FilterCheck
              key={campus}
              label={campus}
              count={counts.campuses[campus] ?? 0}
              checked={filters.campuses.includes(campus)}
              disabled={
                (counts.campuses[campus] ?? 0) === 0 &&
                !filters.campuses.includes(campus)
              }
              onToggle={() =>
                onChange({
                  ...filters,
                  campuses: toggleListValue(filters.campuses, campus),
                })
              }
            />
          ))}
        </Section>

        <Section
          id="category"
          title="Category"
          selected={filters.categories.length}
          open={open.category}
          onToggle={toggleSection}
        >
          {categoryOptions.map((category) => (
            <FilterCheck
              key={category}
              label={category}
              count={counts.categories[category] ?? 0}
              checked={filters.categories.includes(category)}
              disabled={
                (counts.categories[category] ?? 0) === 0 &&
                !filters.categories.includes(category)
              }
              onToggle={() =>
                onChange({
                  ...filters,
                  categories: toggleListValue(filters.categories, category),
                })
              }
            />
          ))}
        </Section>

        <Section
          id="clubs"
          title="Student clubs"
          selected={filters.clubIds.length}
          open={open.clubs}
          onToggle={toggleSection}
        >
          <input
            type="search"
            value={clubQuery}
            onChange={(event) => setClubQuery(event.target.value)}
            placeholder="Search clubs"
            className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-700"
          />
          {clubs.length === 0 ? (
            <p className="px-2 py-2 text-sm text-gray-500">No clubs match that search.</p>
          ) : (
            clubs.map((club) => (
              <FilterCheck
                key={club.id}
                label={club.shortName}
                count={counts.clubIds[club.id] ?? 0}
                checked={filters.clubIds.includes(club.id)}
                disabled={
                  (counts.clubIds[club.id] ?? 0) === 0 &&
                  !filters.clubIds.includes(club.id)
                }
                onToggle={() =>
                  onChange({
                    ...filters,
                    clubIds: toggleListValue(filters.clubIds, club.id),
                  })
                }
              />
            ))
          )}
        </Section>

        <Section
          id="tags"
          title="Tags"
          selected={filters.tags.length}
          open={open.tags}
          onToggle={toggleSection}
        >
          <input
            type="search"
            value={tagQuery}
            onChange={(event) => setTagQuery(event.target.value)}
            placeholder="Search tags"
            className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-700"
          />
          {tags.length === 0 ? (
            <p className="px-2 py-2 text-sm text-gray-500">No tags match that search.</p>
          ) : (
            tags.map((tag) => (
              <FilterCheck
                key={tag}
                label={tag}
                count={counts.tags[tag] ?? 0}
                checked={filters.tags.includes(tag)}
                disabled={
                  (counts.tags[tag] ?? 0) === 0 && !filters.tags.includes(tag)
                }
                onToggle={() =>
                  onChange({
                    ...filters,
                    tags: toggleListValue(filters.tags, tag),
                  })
                }
              />
            ))
          )}
        </Section>
      </div>

      {mobile ? (
        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-md bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700"
          >
            Show {resultCount} {resultCount === 1 ? "event" : "events"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
