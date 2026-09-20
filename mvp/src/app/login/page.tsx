"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { useSession } from "@/hooks/useSession";
import { signIn, takeReturnPath } from "@/lib/session";

export default function LoginPage() {
    const router = useRouter();
    const { session, signedIn, signOut } = useSession();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [keepSignedIn, setKeepSignedIn] = useState(false);

    const [usernameError, setUsernameError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const [popupTitle, setPopupTitle] = useState("");
    const [popupMessage, setPopupMessage] = useState("");
    const [showPopup, setShowPopup] = useState(false);

    // Demo student ID format.
    // Example: a1991246
    const isValidStudentId = (value: string) => {
        return /^a\d{7}$/i.test(value.trim());
    };

    // Show a popup inside our demo website.
    const openPopup = (title: string, message: string) => {
        setPopupTitle(title);
        setPopupMessage(message);
        setShowPopup(true);
    };

    // Check the login fields.
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        let valid = true;
        let firstProblem = "";

        setUsernameError("");
        setPasswordError("");

        // Check student ID.
        if (!username.trim()) {
            setUsernameError("University username is required.");
            firstProblem = "Please enter your university username.";
            valid = false;
        } else if (!isValidStudentId(username)) {
            setUsernameError(
                "Enter a valid student username, for example a1234567."
            );

            firstProblem =
                "Your university username should start with 'a' followed by 7 digits.";

            valid = false;
        }

        // Check password.
        if (!password) {
            setPasswordError("Password is required.");

            if (!firstProblem) {
                firstProblem = "Please enter your password.";
            }

            valid = false;
        } else if (password.length < 8) {
            setPasswordError(
                "Password must contain at least 8 characters."
            );

            if (!firstProblem) {
                firstProblem =
                    "Your password must contain at least 8 characters.";
            }

            valid = false;
        }

        if (!valid) {
            openPopup("Check your details", firstProblem);
            return;
        }

        // Demo session only.
        // Supabase Auth will replace this later.
        signIn({
            username: username.trim().toLowerCase(),
            keepSignedIn,
        });

        openPopup(
            "Sign in successful",
            "You are now signed in to the Student / Volunteer Portal."
        );

        setTimeout(() => {
            router.push(takeReturnPath() || "/profile");
        }, 900);
    };

    return (
        <main className="min-h-screen bg-[#f3f1ed] text-[#171717]">
            <SiteHeader />

            {/* Login area */}
            <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">

                {/* Left information */}
                <div className="hidden lg:block">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7C00E8]">
                        Student / Volunteer Portal
                    </p>

                    <h1 className="mt-5 max-w-lg text-5xl font-semibold leading-tight">
                        Your volunteering,
                        <span className="block text-[#7C00E8]">
                            all in one place.
                        </span>
                    </h1>

                    <p className="mt-6 max-w-lg text-lg leading-8 text-gray-600">
                        Sign in to manage your volunteer applications,
                        assigned shifts and profile.
                    </p>

                    <div className="mt-9 grid max-w-lg gap-4">
                        <div className="border-l-4 border-[#7C00E8] bg-white p-5">
                            <p className="font-semibold">
                                Track applications
                            </p>

                            <p className="mt-1 text-sm leading-6 text-gray-600">
                                View pending, approved and rejected volunteer
                                applications.
                            </p>
                        </div>

                        <div className="border-l-4 border-[#18a999] bg-white p-5">
                            <p className="font-semibold">
                                Manage your shifts
                            </p>

                            <p className="mt-1 text-sm leading-6 text-gray-600">
                                See your assigned roles, dates and volunteer
                                activities.
                            </p>
                        </div>

                        <div className="border-l-4 border-[#ee626b] bg-white p-5">
                            <p className="font-semibold">
                                Keep your profile updated
                            </p>

                            <p className="mt-1 text-sm leading-6 text-gray-600">
                                Manage your volunteer information and preferences.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Login card */}
                <div className="mx-auto w-full max-w-xl bg-white p-8 shadow-sm md:p-10">
                    {signedIn && session ? (
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#7C00E8]">
                                Already signed in
                            </p>
                            <h2 className="mt-3 text-4xl font-semibold">Welcome back</h2>
                            <p className="mt-4 leading-7 text-gray-600">
                                You are signed in as{" "}
                                <strong>{session.username}</strong>. Your session stays
                                active while you move between Discover, applications,
                                shifts and profile.
                            </p>
                            <Link
                                href="/profile"
                                className="mt-8 block bg-black px-6 py-4 text-center text-lg font-semibold text-white transition hover:bg-[#7C00E8]"
                            >
                                Continue to your portal
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    signOut();
                                }}
                                className="mt-4 w-full border border-black px-6 py-3 font-semibold transition hover:bg-[#f3f1ed]"
                            >
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#7C00E8]">
                        Secure access
                    </p>

                    <h2 className="mt-3 text-4xl font-semibold">
                        Sign in
                    </h2>

                    <p className="mt-4 leading-7 text-gray-600">
                        Enter your university username and demo password.
                    </p>

                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        className="mt-9 space-y-7"
                    >
                        {/* University username */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block font-semibold"
                            >
                                University username *
                            </label>

                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={username}
                                onChange={(event) => {
                                    setUsername(event.target.value);
                                    setUsernameError("");
                                }}
                                placeholder="a1234567"
                                autoComplete="username"
                                aria-invalid={Boolean(usernameError)}
                                className={`mt-2 w-full border px-4 py-3.5 text-lg outline-none transition focus:ring-2 focus:ring-purple-200 ${usernameError
                                    ? "border-red-500"
                                    : "border-gray-300 focus:border-[#7C00E8]"
                                    }`}
                            />

                            {usernameError && (
                                <p
                                    role="alert"
                                    className="mt-2 text-sm font-medium text-red-600"
                                >
                                    {usernameError}
                                </p>
                            )}

                            <p className="mt-2 text-sm text-gray-500">
                                Example: a1234567
                            </p>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between gap-4">
                                <label
                                    htmlFor="password"
                                    className="font-semibold"
                                >
                                    Password *
                                </label>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="text-sm font-semibold text-[#7C00E8] hover:underline"
                                >
                                    {showPassword ? "Hide password" : "Show password"}
                                </button>
                            </div>

                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                    setPasswordError("");
                                }}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                aria-invalid={Boolean(passwordError)}
                                className={`mt-2 w-full border px-4 py-3.5 text-lg outline-none transition focus:ring-2 focus:ring-purple-200 ${passwordError
                                    ? "border-red-500"
                                    : "border-gray-300 focus:border-[#7C00E8]"
                                    }`}
                            />

                            {passwordError && (
                                <p
                                    role="alert"
                                    className="mt-2 text-sm font-medium text-red-600"
                                >
                                    {passwordError}
                                </p>
                            )}
                        </div>

                        {/* Keep signed in */}
                        <div className="flex items-start gap-3">
                            <input
                                id="keepSignedIn"
                                type="checkbox"
                                checked={keepSignedIn}
                                onChange={(event) =>
                                    setKeepSignedIn(event.target.checked)
                                }
                                className="mt-1 h-4 w-4 accent-[#7C00E8]"
                            />

                            <label
                                htmlFor="keepSignedIn"
                                className="text-sm leading-6 text-gray-700"
                            >
                                Keep me signed in on this device
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-black px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#7C00E8] focus:outline-none focus:ring-2 focus:ring-[#7C00E8] focus:ring-offset-2"
                        >
                            Sign in
                        </button>
                    </form>

                    {/* Signup */}
                    <div className="mt-7 border-t border-gray-200 pt-6">
                        <p className="text-center text-gray-600">
                            Don&apos;t have a demo account?{" "}
                            <Link
                                href="/signup"
                                className="font-semibold text-[#7C00E8] hover:underline"
                            >
                                Create an account
                            </Link>
                        </p>
                    </div>

                    {/* Demo notice */}
                    <div className="mt-8 border-l-4 border-[#7C00E8] bg-[#f4ecff] p-4">
                        <p className="font-semibold text-purple-900">
                            Demo authentication
                        </p>

                        <p className="mt-1 text-sm leading-6 text-gray-700">
                            This educational prototype does not connect to
                        Adelaide University&apos;s production Single Sign-On.
                        Real authentication and session handling will use
                        Supabase Auth.
                    </p>
                    </div>
                        </>
                    )}
                </div>
            </section>

            {/* Popup */}
            {showPopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="login-popup-title"
                >
                    <div className="w-full max-w-md bg-white p-7 shadow-2xl">
                        <div className="h-1.5 w-16 bg-[#7C00E8]" />

                        <p className="mt-5 text-sm font-bold uppercase tracking-[0.15em] text-[#7C00E8]">
                            Student / Volunteer Portal
                        </p>

                        <h2
                            id="login-popup-title"
                            className="mt-3 text-2xl font-semibold"
                        >
                            {popupTitle}
                        </h2>

                        <p className="mt-4 leading-7 text-gray-700">
                            {popupMessage}
                        </p>

                        <button
                            type="button"
                            onClick={() => setShowPopup(false)}
                            className="mt-7 w-full bg-black px-5 py-3 font-semibold text-white transition hover:bg-[#7C00E8]"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            <SiteFooter />
        </main>
    );
}