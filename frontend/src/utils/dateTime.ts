const pad = (part: number) => String(part).padStart(2, "0");

export function dateTimeInputParts(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

export function parseDateTimeInput(dateText: string, timeText: string) {
  const dateMatch = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeText.match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;
  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const date = new Date(year, month - 1, day, hour, minute);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  )
    return null;
  return date;
}

const gregorianDate = new Intl.DateTimeFormat("en-GB-u-ca-gregory", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const gregorianDateTime = new Intl.DateTimeFormat("en-GB-u-ca-gregory", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatGregorianDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : gregorianDate.format(date);
}

export function formatGregorianDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : gregorianDateTime.format(date);
}
