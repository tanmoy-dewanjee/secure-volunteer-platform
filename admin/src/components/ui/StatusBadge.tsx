export default function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Open" || status === "Approved" || status === "Published" || status === "Active"
      ? "bg-green-100 text-green-800"
      : status === "In progress" || status === "Ongoing" || status === "Shortlisted"
        ? "bg-purple-700 text-white"
        : status === "Coming soon" || status === "Pending" || status === "Draft"
          ? "bg-amber-100 text-amber-800"
          : status === "Full" || status === "Rejected" || status === "Suspended"
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-700";

  return (
    <span className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${tone}`}>
      {status === "In progress" ? "Happening now" : status}
    </span>
  );
}
