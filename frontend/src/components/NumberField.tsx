interface Props {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}
export default function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
}: Props) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <div className="relative">
      <input
        aria-label={label}
        type="number"
          value={value}
          min={min}
          max={max}
          step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        required
        />
        {suffix && (
          <span className="absolute right-4 top-3 text-sm text-black/40">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}
