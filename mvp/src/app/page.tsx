import LandingPage from "@/components/landing/LandingPage";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <SiteHeader active="home" />
      <LandingPage />
      <SiteFooter />
    </main>
  );
}
