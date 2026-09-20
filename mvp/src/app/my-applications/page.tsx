import AuthGuard from "@/components/AuthGuard";
import ApplicationsBoard from "@/components/applications/ApplicationsBoard";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

export default function MyApplicationsPage() {
  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <SiteHeader active="applications" />
      <AuthGuard>
        <ApplicationsBoard />
      </AuthGuard>
      <section className="bg-[#f3f1ed]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <h2 className="text-2xl font-semibold">Application status guide</h2>
          <div className="mt-7 grid gap-5 md:grid-cols-4">
            <div className="bg-white p-6">
              <span className="bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                Pending
              </span>
              <p className="mt-4 leading-6 text-gray-600">
                Submitted and waiting for a club coordinator.
              </p>
            </div>
            <div className="bg-white p-6">
              <span className="bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                Approved
              </span>
              <p className="mt-4 leading-6 text-gray-600">
                Accepted. The assigned activity appears in My Shifts.
              </p>
            </div>
            <div className="bg-white p-6">
              <span className="bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
                Rejected
              </span>
              <p className="mt-4 leading-6 text-gray-600">
                Not approved for this opportunity.
              </p>
            </div>
            <div className="bg-white p-6">
              <span className="bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                Withdrawn
              </span>
              <p className="mt-4 leading-6 text-gray-600">
                You cancelled the application before a decision.
              </p>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
