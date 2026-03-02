interface UpdateModeSelectorProps {
  value: number;
  onChange: (intervalMs: number) => void;
}

const OPTIONS = [
  { label: "Live", value: 0 },
  { label: "1s", value: 1000 },
  { label: "5s", value: 5000 },
];

export function UpdateModeSelector({ value, onChange }: UpdateModeSelectorProps) {
  return (
    <div className="filter-group">
      <span className="filter-label">Updates:</span>
      <div className="filter-buttons">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`filter-btn ${value === opt.value ? "active" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
