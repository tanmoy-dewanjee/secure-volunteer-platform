import EventBrowse from "@/components/browse/EventBrowse";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

function toQueryString(
  searchParams: Record<string, string | string[] | undefined>
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(","));
    } else if (value) {
      params.set(key, value);
    }
  }
  return params.toString();
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;

  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <SiteHeader active="discover" />
      <EventBrowse initialQuery={toQueryString(raw)} />
      <SiteFooter />
    </main>
  );
}
