import type { ReactNode } from "react";
const tones = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-800",
};
export default function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
