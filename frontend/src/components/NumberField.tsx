import { useEffect, useRef, useState } from "react";

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
  const [draft, setDraft] = useState(String(value));
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) setDraft(String(value));
  }, [value]);

  const update = (raw: string) => {
    const cleaned = raw
      .replace(/[^\d.]/g, "")
      .replace(/(\..*)\./g, "$1")
      .replace(/^0+(?=\d)/, "");
    setDraft(cleaned);
    if (cleaned !== "" && cleaned !== ".") {
      const parsed = Number(cleaned);
      if (Number.isFinite(parsed)) onChange(parsed);
    }
  };

  const finishEditing = () => {
    editing.current = false;
    const parsed = Number(draft);
    const next = Number.isFinite(parsed)
      ? Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, parsed))
      : min;
    setDraft(String(next));
    onChange(next);
  };

  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <div className="relative">
        <input
          aria-label={label}
          type="text"
          inputMode={step % 1 === 0 ? "numeric" : "decimal"}
          value={draft}
          onFocus={(event) => {
            editing.current = true;
            event.currentTarget.select();
          }}
          onChange={(event) => update(event.target.value)}
          onBlur={finishEditing}
          className={suffix ? "pr-20 tabular-nums" : "tabular-nums"}
          required
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-black/40">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}
