import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import MustEventBrowse from "@/components/browse/MustEventBrowse";

export default function DiscoverPage() {
  return (
    <main className="min-h-screen bg-white text-[#140F50]">
      <SiteHeader active="discover" />
      <MustEventBrowse />
      <SiteFooter />
    </main>
  );
}
