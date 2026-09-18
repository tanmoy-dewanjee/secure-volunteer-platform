"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { useSession } from "@/hooks/useSession";
import {
  apiGetEvent,
  apiRecommendations,
  rememberReturnPath,
  type ApiEvent,
} from "@/lib/api";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { ready, signedIn } = useSession();
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [recs, setRecs] = useState<{
    byLocation: ApiEvent[];
    byDepartment: ApiEvent[];
    bySimilarity: ApiEvent[];
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!signedIn) {
      rememberReturnPath(`/events/${id}`);
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        const [detail, recommendations] = await Promise.all([
          apiGetEvent(id),
          apiRecommendations(id),
        ]);
        if (!detail) {
          setError("Event not found");
          return;
        }
        setEvent(detail);
        setRecs({
          byLocation: recommendations.byLocation,
          byDepartment: recommendations.byDepartment,
          bySimilarity: recommendations.bySimilarity,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load event");
      }
    })();
  }, [ready, signedIn, id, router]);

  const rail = (
    label: string,
    items: ApiEvent[]
  ) => (
    <div className="mt-6">
      <h3 className="font-semibold text-[#836BFF]">{label}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600">No matches in this group.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/events/${item.id}`} className="text-[#1448FF]">
                {item.title}
              </Link>
              <span className="text-sm text-gray-600">
                {" "}
                — {item.location} · {item.department}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#FAFAFB] text-[#140F50]">
      <SiteHeader active="discover" />
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 lg:grid-cols-[2fr_1fr]">
        <article className="border border-gray-200 bg-white p-6">
          <Link href="/discover" className="text-sm text-[#1448FF]">
            ← Back to explore
          </Link>
          {error ? (
            <p className="mt-6 text-[#D32362]" role="alert">
              {error}
            </p>
          ) : null}
          {event ? (
            <>
              <h1 className="mt-4 text-3xl font-bold">{event.title}</h1>
              <p className="mt-2 text-sm text-gray-600">
                {event.location} · {event.department}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {new Date(event.startsAt).toLocaleString()} —{" "}
                {new Date(event.endsAt).toLocaleString()}
              </p>
              <p className="mt-6 whitespace-pre-wrap">{event.description}</p>
            </>
          ) : null}
        </article>

        <aside className="border border-[#836BFF]/40 bg-white p-6">
          <h2 className="text-xl font-bold">Recommended</h2>
          <p className="mt-1 text-sm text-gray-600">
            Same location, same department, similar title. This event is never
            listed here.
          </p>
          {recs ? (
            <>
              {rail("By location", recs.byLocation)}
              {rail("By department", recs.byDepartment)}
              {rail("Similar title", recs.bySimilarity)}
            </>
          ) : null}
        </aside>
      </div>
      <SiteFooter />
    </main>
  );
}
