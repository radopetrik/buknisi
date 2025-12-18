export const safeId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export const formatPrice = (value: number) => new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR" }).format(value);

export const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("sk-SK", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dateStr));
};

export const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("sk-SK", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(dateStr));
};
