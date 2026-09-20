"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import DemoBanner from "@/components/DemoBanner";

export default function SignupPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [acceptedTerms, setAcceptedTerms] =
        useState(false);

    const [errors, setErrors] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        terms: "",
    });

    const [popupMessage, setPopupMessage] =
        useState("");

    const [popupTitle, setPopupTitle] =
        useState("");

    const [showPopup, setShowPopup] =
        useState(false);

    // Accept common Adelaide University student email formats.
    const isValidStudentEmail = (
        emailValue: string
    ) => {
        const cleanEmail =
            emailValue.trim().toLowerCase();

        // Example: firstname.lastname@student.adelaide.edu.au
        const studentEmail =
            /^[a-z0-9._%+-]+@student\.adelaide\.edu\.au$/i.test(
                cleanEmail
            );

        // Example: a1991246@adelaide.edu.au
        const studentIdEmail =
            /^a\d+@adelaide\.edu\.au$/i.test(
                cleanEmail
            );

        return studentEmail || studentIdEmail;
    };

    // Show our website popup.
    const openPopup = (
        title: string,
        message: string
    ) => {
        setPopupTitle(title);
        setPopupMessage(message);
        setShowPopup(true);
    };

    // Check all fields before signup.
    const handleSubmit = (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const newErrors = {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            terms: "",
        };

        let valid = true;
        let firstProblem = "";

        // Name validation.
        if (!name.trim()) {
            newErrors.name =
                "Full name is required.";

            valid = false;

            if (!firstProblem) {
                firstProblem =
                    "Please enter your full name.";
            }
        } else if (name.trim().length < 2) {
            newErrors.name =
                "Please enter a valid full name.";

            valid = false;

            if (!firstProblem) {
                firstProblem =
                    "Please enter a valid full name.";
            }
        }

        // Email validation.
        if (!email.trim()) {
            newErrors.email =
                "University email is required.";

            valid = false;

            if (!firstProblem) {
                firstProblem =
                    "Please enter your Adelaide University student email.";
            }
        } else if (!isValidStudentEmail(email)) {
            newErrors.email =
                "Please enter a valid Adelaide University student email.";

            valid = false;

            if (!firstProblem) {
                firstProblem =
                    "Please use an Adelaide University student email such as name@student.adelaide.edu.au or a student ID email such as a1234567@adelaide.edu.au.";
            }
        }

        // Password validation.
        if (!password) {
            newErrors.password =
                "Password is required.";

            valid = false;

            if (!firstProblem) {
                firstProblem =
                    "Please create a password.";
            }
        } else if (password.length < 8) {
            newErrors.password =
                "Password must contain at least 8 characters.";

            valid = false;

            if (!firstProblem) {
                firstProblem =
                    "Your password must contain at least 8 characters.";
            }
        }

        // Confirm password.
        if (!confirmPassword) {
            newErrors.confirmPassword =
                "Please confirm your password.";

            valid = false;

            if (!firstProblem) {
                firstProblem =
                    "Please confirm your password.";
            }
        } else if (
            password !== confirmPassword
        ) {
            newErrors.confirmPassword =
                "Passwords do not match.";

            valid = false;

            if (!firstProblem) {
                firstProblem =
                    "The passwords do not match. Please enter them again.";
            }
        }

        // Demo confirmation.
        if (!acceptedTerms) {
            newErrors.terms =
                "Please confirm the demo notice.";

            valid = false;

            if (!firstProblem) {
                firstProblem =
                    "Please confirm that you understand this is an educational prototype.";
            }
        }

        setErrors(newErrors);

        if (!valid) {
            openPopup(
                "Check your details",
                firstProblem
            );

            return;
        }

        // Save only basic demo information.
        // Never store the password here.
        localStorage.setItem(
            "demoRegisteredEmail",
            email.trim().toLowerCase()
        );

        localStorage.setItem(
            "demoRegisteredName",
            name.trim()
        );

        openPopup(
            "Account created",
            "Your demo Student / Volunteer account has been created successfully. You can now sign in."
        );

        setTimeout(() => {
            router.push("/login");
        }, 1000);
    };

    return (
        <main className="min-h-screen bg-[#f3f1ed] text-[#171717]">
            <DemoBanner />

            {/* Header */}
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
                    <div>
                        <p className="text-2xl font-bold tracking-tight">
                            Adelaide University
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Volunteer & Event Coordination
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="font-semibold text-purple-700 hover:underline"
                    >
                        Back to home
                    </Link>
                </div>
            </header>

            {/* Signup area */}
            <section className="mx-auto flex max-w-7xl justify-center px-6 py-16">
                <div className="w-full max-w-xl bg-white p-8 shadow-sm md:p-10">
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-purple-700">
                        Student / Volunteer Portal
                    </p>

                    <h1 className="mt-3 text-4xl font-semibold">
                        Create your account
                    </h1>

                    <p className="mt-4 leading-7 text-gray-600">
                        Register using your Adelaide University student
                        email to discover opportunities, apply for
                        volunteer roles and manage your activities.
                    </p>

                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        className="mt-9 space-y-7"
                    >
                        {/* Full name */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block font-semibold"
                            >
                                Full name *
                            </label>

                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={name}
                                onChange={(event) => {
                                    setName(event.target.value);

                                    setErrors((current) => ({
                                        ...current,
                                        name: "",
                                    }));
                                }}
                                placeholder="Enter your full name"
                                autoComplete="name"
                                aria-invalid={Boolean(
                                    errors.name
                                )}
                                className={`mt-2 w-full border px-4 py-3 outline-none transition focus:ring-2 focus:ring-purple-200 ${errors.name
                                        ? "border-red-500"
                                        : "border-gray-300 focus:border-purple-700"
                                    }`}
                            />

                            {errors.name && (
                                <p
                                    role="alert"
                                    className="mt-2 text-sm font-medium text-red-600"
                                >
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* University email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block font-semibold"
                            >
                                University email *
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);

                                    setErrors((current) => ({
                                        ...current,
                                        email: "",
                                    }));
                                }}
                                placeholder="Student university email"
                                autoComplete="email"
                                aria-invalid={Boolean(
                                    errors.email
                                )}
                                className={`mt-2 w-full border px-4 py-3 outline-none transition focus:ring-2 focus:ring-purple-200 ${errors.email
                                        ? "border-red-500"
                                        : "border-gray-300 focus:border-purple-700"
                                    }`}
                            />

                            {errors.email && (
                                <p
                                    role="alert"
                                    className="mt-2 text-sm font-medium text-red-600"
                                >
                                    {errors.email}
                                </p>
                            )}

                            <div className="mt-2 text-sm leading-6 text-gray-500">
                                <p>
                                    Accepted student email examples:
                                </p>

                                <p>
                                    name@student.adelaide.edu.au
                                </p>

                                <p>
                                    a1234567@adelaide.edu.au
                                </p>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block font-semibold"
                            >
                                Password *
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(event) => {
                                    setPassword(
                                        event.target.value
                                    );

                                    setErrors((current) => ({
                                        ...current,
                                        password: "",
                                    }));
                                }}
                                placeholder="At least 8 characters"
                                autoComplete="new-password"
                                aria-invalid={Boolean(
                                    errors.password
                                )}
                                className={`mt-2 w-full border px-4 py-3 outline-none transition focus:ring-2 focus:ring-purple-200 ${errors.password
                                        ? "border-red-500"
                                        : "border-gray-300 focus:border-purple-700"
                                    }`}
                            />

                            {errors.password && (
                                <p
                                    role="alert"
                                    className="mt-2 text-sm font-medium text-red-600"
                                >
                                    {errors.password}
                                </p>
                            )}

                            <p className="mt-2 text-sm text-gray-500">
                                Minimum 8 characters for this
                                prototype.
                            </p>
                        </div>

                        {/* Confirm password */}
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block font-semibold"
                            >
                                Confirm password *
                            </label>

                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => {
                                    setConfirmPassword(
                                        event.target.value
                                    );

                                    setErrors((current) => ({
                                        ...current,
                                        confirmPassword: "",
                                    }));
                                }}
                                placeholder="Enter your password again"
                                autoComplete="new-password"
                                aria-invalid={Boolean(
                                    errors.confirmPassword
                                )}
                                className={`mt-2 w-full border px-4 py-3 outline-none transition focus:ring-2 focus:ring-purple-200 ${errors.confirmPassword
                                        ? "border-red-500"
                                        : "border-gray-300 focus:border-purple-700"
                                    }`}
                            />

                            {errors.confirmPassword && (
                                <p
                                    role="alert"
                                    className="mt-2 text-sm font-medium text-red-600"
                                >
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>

                        {/* Demo confirmation */}
                        <div>
                            <div className="flex items-start gap-3">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(event) => {
                                        setAcceptedTerms(
                                            event.target.checked
                                        );

                                        setErrors((current) => ({
                                            ...current,
                                            terms: "",
                                        }));
                                    }}
                                    className="mt-1 h-4 w-4"
                                />

                                <label
                                    htmlFor="terms"
                                    className="text-sm leading-6 text-gray-700"
                                >
                                    I understand that this is an
                                    educational demonstration and not
                                    an official Adelaide University
                                    production service. *
                                </label>
                            </div>

                            {errors.terms && (
                                <p
                                    role="alert"
                                    className="mt-2 text-sm font-medium text-red-600"
                                >
                                    {errors.terms}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-black px-6 py-4 font-semibold text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:ring-offset-2"
                        >
                            Create account
                        </button>
                    </form>

                    <p className="mt-7 text-center text-gray-600">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-purple-700 hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>

                    {/* Demo note */}
                    <div className="mt-8 border-l-4 border-purple-700 bg-purple-50 p-4">
                        <p className="font-semibold text-purple-900">
                            Demo account creation
                        </p>

                        <p className="mt-1 text-sm leading-6 text-gray-700">
                            Email format checking on this page is
                            only frontend validation. Real student
                            account verification, authentication and
                            session management will be handled
                            securely using Supabase Auth.
                        </p>
                    </div>
                </div>
            </section>

            {/* Popup */}
            {showPopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="w-full max-w-md bg-white p-7 shadow-xl">
                        <p className="text-sm font-bold uppercase tracking-wide text-purple-700">
                            Student / Volunteer Portal
                        </p>

                        <h2 className="mt-3 text-2xl font-semibold">
                            {popupTitle}
                        </h2>

                        <p className="mt-4 leading-7 text-gray-700">
                            {popupMessage}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setShowPopup(false)
                            }
                            className="mt-7 w-full bg-black px-5 py-3 font-semibold text-white hover:bg-purple-700"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="mt-10 bg-black text-white">
                <div className="mx-auto max-w-7xl px-6 py-8">
                    <p className="font-semibold">
                        Adelaide University
                    </p>

                    <p className="mt-2 text-sm text-gray-400">
                        Volunteer & Event Coordination — Educational Demo
                    </p>
                </div>
            </footer>
        </main>
    );
}