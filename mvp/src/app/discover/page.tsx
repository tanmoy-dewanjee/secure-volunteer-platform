import { Suspense } from "react";

import EventBrowse from "@/components/browse/EventBrowse";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

export default function DiscoverPage() {
  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <SiteHeader active="discover" />
      <Suspense
        fallback={
          <div className="bg-[#f3f1ed] px-6 py-24 text-center text-gray-600">
            Loading opportunities...
          </div>
        }
      >
        <EventBrowse />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
