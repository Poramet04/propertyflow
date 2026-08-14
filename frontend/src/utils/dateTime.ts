export function dayFirstParts(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };
  const pad = (part: number) => String(part).padStart(2, "0");
  return {
    date: `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

export function parseDayFirstDateTime(dateText: string, timeText: string) {
  const match = dateText.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const time = timeText.match(/^(\d{2}):(\d{2})$/);
  if (!match || !time) return null;
  const [, dayText, monthText, yearText] = match;
  const [, hourText, minuteText] = time;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
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

export function formatDayFirstDateTime(value: string | Date) {
  const parts = dayFirstParts(value);
  return parts.date && parts.time ? `${parts.date} ${parts.time}` : "";
}
