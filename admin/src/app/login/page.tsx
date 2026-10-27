import { Suspense } from "react";

import AdminLoginForm from "@/components/auth/AdminLoginForm";
import DemoBanner from "@/components/layout/DemoBanner";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#f3f1ed] text-[#171717]">
      <DemoBanner />
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="hidden lg:block">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7C00E8]">
            Admin portal
          </p>
          <h1 className="mt-4 max-w-lg text-3xl font-semibold leading-tight md:text-4xl">
            Coordinators sign in here.
            <span className="block text-[#7C00E8]">Students cannot.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-gray-600">
            Separate origin, cookie and audience claim. Student usernames are
            rejected at this door.
          </p>
        </div>

        <div className="mx-auto w-full max-w-xl bg-white p-8 shadow-sm md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#7C00E8]">
            Secure access
          </p>
          <h2 className="mt-3 text-3xl font-semibold">Sign in</h2>
          <p className="mt-4 leading-7 text-gray-600">
            Use a coordinator account, then confirm with an authenticator app.
          </p>
          <Suspense>
            <AdminLoginForm />
          </Suspense>
          <div className="mt-8 border-l-4 border-[#7C00E8] bg-[#f4ecff] p-4">
            <p className="font-semibold text-purple-900">Demo accounts</p>
            <p className="mt-1 text-sm leading-6 text-gray-700">
              Username <strong>rotaract.admin</strong>,{" "}
              <strong>super.admin</strong> or <strong>viewer.admin</strong>.
              Password <strong>Coordinator1!</strong>. First sign-in enrols
              TOTP on your authenticator app; later sign-ins need the current
              app code. Student IDs such as a1234567 are refused.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
