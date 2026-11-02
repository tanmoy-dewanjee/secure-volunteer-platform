import {
  PASSWORD_POLICY,
  passwordChecks,
  type PasswordContext,
} from "@/lib/security/password";

export default function PasswordStrength({
  password,
  context,
}: {
  password: string;
  context?: PasswordContext;
}) {
  const checks = passwordChecks(password, context);
  const passed = checks.filter((check) => check.ok).length;
  const ready = password.length > 0;

  return (
    <div className="mt-3" aria-live="polite">
      <p className="text-sm font-normal text-gray-600">{PASSWORD_POLICY}</p>
      <div className="mt-3 h-1.5 w-full bg-gray-200">
        <div
          className={`h-1.5 transition-all ${
            passed >= 7
              ? "bg-green-600"
              : passed >= 5
                ? "bg-amber-500"
                : "bg-red-500"
          }`}
          style={{ width: ready ? `${(passed / checks.length) * 100}%` : "0%" }}
        />
      </div>
      <ul className="mt-3 space-y-1 text-sm font-normal">
        {checks.map((check) => (
          <li
            key={check.id}
            className={
              !ready
                ? "text-gray-500"
                : check.ok
                  ? "text-green-700"
                  : "text-red-700"
            }
          >
            {check.ok && ready ? "✓" : "•"} {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
