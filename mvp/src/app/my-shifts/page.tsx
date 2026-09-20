import AuthGuard from "@/components/AuthGuard";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import ShiftsBoard from "@/components/shifts/ShiftsBoard";

export default function MyShiftsPage() {
  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <SiteHeader active="shifts" />
      <AuthGuard>
        <ShiftsBoard />
      </AuthGuard>
      <SiteFooter />
    </main>
  );
}
