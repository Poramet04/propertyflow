export function monthRange(value?: unknown) {
  const now = new Date();
  const fallback = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
    ? value
    : fallback;
  const [year, monthNumber] = month.split("-").map(Number);
  return {
    month,
    start: new Date(year!, monthNumber! - 1, 1),
    end: new Date(year!, monthNumber!, 1),
  };
}
