export const DEMO_STUDENT_PASSWORD = "Volunteer1!";
export const DEMO_STUDENT_USERNAME = "a1991246";

export const DEMO_STUDENT_USERNAMES = [
  "a1991246",
  "a1882201",
  "a1773344",
  "a1664488",
  "a1556677",
] as const;

export function isDemoStudentAccount(value: string) {
  const key = value.trim().toLowerCase().split("@")[0] ?? "";
  return DEMO_STUDENT_USERNAMES.includes(
    key as (typeof DEMO_STUDENT_USERNAMES)[number]
  );
}

export function isStudentLoginIdentity(value: string) {
  const key = value.trim().toLowerCase();
  return (
    /^a\d{7}$/i.test(key) ||
    /^a\d{7}@adelaide\.edu\.au$/i.test(key) ||
    /^[a-z0-9._%+-]+@student\.adelaide\.edu\.au$/i.test(key)
  );
}
