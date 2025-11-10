export const now = (): string => new Date().toISOString();

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const isPastDue = (dueDate: string): boolean => {
  if (!dueDate) return false;
  // Si viene como 'YYYY-MM-DD', parsear en local
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dueDate)
    ? parseLocalDateFromYMD(dueDate)
    : new Date(dueDate);
  return date < new Date();
};

export const getDaysUntilDue = (dueDate: string): number => {
  const today = new Date();
  const due = /^\d{4}-\d{2}-\d{2}$/.test(dueDate)
    ? parseLocalDateFromYMD(dueDate)
    : new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- Fecha local sin desfase de zona horaria ---

// Devuelve YYYY-MM-DD usando la zona horaria local (no UTC)
export const toLocalYMD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Parsea 'YYYY-MM-DD' como fecha local (no lo interpreta como UTC)
export const parseLocalDateFromYMD = (ymd: string): Date => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

// Formatea 'YYYY-MM-DD' a fecha larga en español, interpretando localmente
export const formatYMDLongEs = (ymd: string): string => {
  const date = parseLocalDateFromYMD(ymd);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
