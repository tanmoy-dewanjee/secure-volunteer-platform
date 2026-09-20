import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4">
        <div>
          <h2 className="text-xl font-semibold">Adelaide University</h2>
          <p className="mt-3 text-sm text-gray-400">
            Volunteer & Event Coordination Demo
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Explore</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-300">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/discover" className="hover:text-white">
              Discover events
            </Link>
            <Link href="/my-applications" className="hover:text-white">
              My applications
            </Link>
            <Link href="/my-shifts" className="hover:text-white">
              My shifts
            </Link>
            <Link href="/profile" className="hover:text-white">
              Profile
            </Link>
            <Link href="/current-students" className="hover:text-white">
              Current students
            </Link>
            <Link href="/volunteer-support" className="hover:text-white">
              Volunteer support
            </Link>
          </div>
        </div>
        <div>
          <h3 className="font-semibold">Account</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-300">
            <Link href="/login" className="hover:text-white">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-white">
              Create account
            </Link>
          </div>
        </div>
        <div>
          <h3 className="font-semibold">Prototype notice</h3>
          <p className="mt-4 text-sm leading-6 text-gray-400">
            Educational demonstration only. Not an official Adelaide University
            production service.
          </p>
        </div>
      </div>
    </footer>
  );
}
