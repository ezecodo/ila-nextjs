// Objetivo de artículos por dossier (base de la proyección de carga).
export const TARGET_PER_DOSSIER = 25;

const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

// Calcula la proyección de finalización a partir del backlog (artículos que
// faltan para que cada dossier llegue al objetivo) y del ritmo de carga por mes.
// El mes en curso se excluye de los promedios (está incompleto).
export function computeProjection(remaining, monthly = [], now = new Date()) {
  const monthlyCounts = new Map(monthly.map((m) => [m.month, m.count]));
  const currentKey = monthKey(now);
  const completeMonths = monthly.filter((m) => m.month < currentKey);

  // Promedio histórico: logs de meses completos / meses calendario
  // transcurridos (desde el 1er mes hasta el mes anterior, incluye ceros).
  let avgAll = 0;
  if (completeMonths.length > 0) {
    const totalLogs = completeMonths.reduce((s, m) => s + m.count, 0);
    const [fy, fm] = completeMonths[0].month.split("-").map(Number);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthsElapsed =
      (prev.getFullYear() - fy) * 12 + (prev.getMonth() + 1 - fm) + 1;
    avgAll = totalLogs / Math.max(1, monthsElapsed);
  }

  // Ritmo reciente: últimos 3 meses calendario (incluye meses en cero).
  let recentAvg = 0;
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    recentAvg += monthlyCounts.get(monthKey(d)) || 0;
  }
  recentAvg = recentAvg / 3;

  const estimate = (pace) => {
    if (!pace || pace <= 0 || remaining <= 0) return null;
    const monthsNeeded = Math.ceil(remaining / pace);
    const finish = new Date(now.getFullYear(), now.getMonth() + monthsNeeded, 1);
    return { monthsNeeded, finish };
  };

  return {
    remaining,
    avgAll,
    recentAvg,
    currentKey,
    estAll: estimate(avgAll),
    estRecent: estimate(recentAvg),
  };
}
