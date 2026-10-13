type EventMapProps = {
  lat: number;
  lng: number;
  label?: string;
  height?: number;
};

export default function EventMap({
  lat,
  lng,
  label,
  height = 240,
}: EventMapProps) {
  const delta = 0.012;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox
  )}&layer=mapnik&marker=${lat}%2C${lng}`;
  const openSrc = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  return (
    <div>
      {label ? (
        <p className="mb-2 text-sm font-semibold text-gray-700">{label}</p>
      ) : null}
      <iframe
        title={label || "Event map"}
        src={embedSrc}
        className="w-full border border-gray-200"
        style={{ height }}
        loading="lazy"
      />
      <a
        href={openSrc}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-sm font-semibold text-purple-700 hover:underline"
      >
        Open in OpenStreetMap
      </a>
    </div>
  );
}
