import Link from "next/link";

import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

const topics = [
  {
    title: "Who can volunteer",
    body: "This prototype is for current Adelaide University students using a student username such as a1234567. Coordinators from student clubs post the opportunities.",
  },
  {
    title: "How applications work",
    body: "Find an event on Discover, open the details and apply for a role. Pending applications can be withdrawn. Approved roles move into My Shifts.",
  },
  {
    title: "Shifts and attendance",
    body: "Check My Shifts for times, meeting points and briefing notes. On the day, use Check in so the host club can record attendance and hours.",
  },
  {
    title: "Ratings and points",
    body: "After a shift, the host club can rate reliability, teamwork and communication. Points and levels on your profile help other clubs shortlist proven volunteers.",
  },
  {
    title: "Cancellations",
    body: "Withdraw a pending application any time. If you cannot attend an approved shift, tell the club through Volunteer support so the role can be reallocated.",
  },
  {
    title: "Access and wellbeing",
    body: "Add access needs on your profile. Event pages also list accessibility notes. If a shift does not feel safe, leave and contact Volunteer support.",
  },
];

export default function VolunteerSupportPage() {
  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <SiteHeader active="support" />

      <section className="bg-[#f3f1ed]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-700">
            Help
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            Volunteer support
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-700">
            Guidance for students using this educational volunteer portal. This
            is not official Adelaide University production support.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          {topics.map((topic) => (
            <article key={topic.title} className="border border-gray-200 p-6">
              <h2 className="text-xl font-semibold">{topic.title}</h2>
              <p className="mt-3 leading-7 text-gray-700">{topic.body}</p>
            </article>
          ))}
        </div>

        <aside className="space-y-6">
          <div className="border border-gray-200 bg-[#f7f7f7] p-6">
            <h2 className="text-xl font-semibold">Demo contact</h2>
            <p className="mt-3 leading-7 text-gray-700">
              In the finished system this would reach a volunteer coordinator.
              For this prototype, use the details below as placeholder copy
              only.
            </p>
            <p className="mt-4 font-semibold">volunteer-support@example.edu.au</p>
            <p className="mt-1 text-gray-600">Weekdays, 9:00 AM – 5:00 PM</p>
          </div>
          <div className="border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Quick links</h2>
            <div className="mt-4 flex flex-col gap-3">
              <Link href="/discover" className="font-semibold text-purple-700 hover:underline">
                Browse events
              </Link>
              <Link href="/my-shifts" className="font-semibold text-purple-700 hover:underline">
                My shifts
              </Link>
              <Link href="/profile" className="font-semibold text-purple-700 hover:underline">
                Profile and ratings
              </Link>
              <Link href="/current-students" className="font-semibold text-purple-700 hover:underline">
                Current students
              </Link>
            </div>
          </div>
        </aside>
      </section>

      <SiteFooter />
    </main>
  );
}
