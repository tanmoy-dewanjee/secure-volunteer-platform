export const colors = {
  ink: "#171717",
  paper: "#ffffff",
  canvas: "#fafafa",
  limestone: "#f3f1ed",
  accent: "#7C00E8",
  accentHover: "#6b21a8",
  accentSoft: "#f4ecff",
  accentText: "#581c87",
  teal: "#18a999",
  coral: "#ee626b",
  demo: "#f4d35e",
  line: "#e5e7eb",
  lineStrong: "#d1d5db",
  muted: "#4b5563",
  muted2: "#6b7280",
  successBg: "#dcfce7",
  successFg: "#166534",
  warningBg: "#fef3c7",
  warningFg: "#92400e",
  dangerBg: "#fee2e2",
  dangerFg: "#991b1b",
  dangerBorder: "#ef4444",
  closedBg: "#f3f4f6",
  closedFg: "#374151",
  focusRing: "#e9d5ff",
  adminChrome: "#171717",
} as const;

export const type = {
  kicker:
    "text-xs font-bold uppercase tracking-[0.18em] text-purple-700",
  kickerWide:
    "text-sm font-bold uppercase tracking-[0.2em] text-[#7C00E8]",
  wordmark: "text-2xl font-bold tracking-tight",
  pageTitle: "text-2xl font-semibold md:text-3xl",
  sectionTitle: "text-xl font-semibold md:text-2xl",
  body: "text-[15px] leading-7 text-gray-600",
  meta: "text-sm text-gray-500",
} as const;

export const layout = {
  max: "max-w-7xl",
  padX: "px-6 lg:px-10",
  headerPy: "py-5",
  utilityPy: "py-3",
  sidebar: "300px",
} as const;

export const motion = {
  pageEnter: "0.45s cubic-bezier(0.22, 1, 0.36, 1)",
  cardIn: "0.4s cubic-bezier(0.22, 1, 0.36, 1)",
  hoverLift: "transform 0.3s ease, box-shadow 0.3s ease",
  staggerMs: 45,
} as const;

export const buttons = {
  primary:
    "bg-black px-6 py-3 font-semibold text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-[#7C00E8] focus:ring-offset-2",
  secondary:
    "border border-black px-6 py-3 font-semibold transition hover:bg-[#f3f1ed]",
  text: "font-semibold text-[#7C00E8] hover:underline",
  pill: "rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-900 transition hover:bg-purple-100",
} as const;

export const fields = {
  input:
    "w-full border border-gray-300 px-4 py-3.5 outline-none transition focus:border-[#7C00E8] focus:ring-2 focus:ring-purple-200",
  inputError: "border-red-500",
  label: "block font-semibold",
} as const;
