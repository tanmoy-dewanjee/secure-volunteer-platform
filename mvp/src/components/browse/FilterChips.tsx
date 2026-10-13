"use client";

type FilterOption = {
  value: string;
  label: string;
};

type FilterChipsProps = {
  legend: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
  multiple?: boolean;
  tone?: "light" | "dark";
};

export default function FilterChips({
  legend,
  options,
  selected,
  onToggle,
  multiple = true,
  tone = "light",
}: FilterChipsProps) {
  const isDark = tone === "dark";

  return (
    <fieldset>
      <legend
        className={`text-sm font-semibold ${
          isDark ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {legend}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(option.value)}
              className={`px-3 py-1.5 text-sm font-medium transition ${
                isSelected
                  ? "bg-purple-700 text-white"
                  : isDark
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "border border-gray-200 bg-white text-gray-800 hover:border-purple-700"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {multiple ? (
        <p className="sr-only">Multiple options can be selected.</p>
      ) : null}
    </fieldset>
  );
}
