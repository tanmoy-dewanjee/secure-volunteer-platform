import AuthGuard from "@/components/AuthGuard";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import StudentProfile from "@/components/profile/StudentProfile";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <SiteHeader active="profile" />
      <AuthGuard>
        <StudentProfile />
      </AuthGuard>
      <SiteFooter />
    </main>
  );
}
