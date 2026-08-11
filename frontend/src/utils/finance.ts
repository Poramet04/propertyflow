export const money = (n: number) =>
  new Intl.NumberFormat("en-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
