/**
 * Итоговый балл mock-сессии: средняя самооценка (0–5) оценённых вопросов,
 * приведённая к процентам. Пропущенные вопросы в счёт не идут; если не оценено
 * ничего — балла нет (null).
 */
export function computeScore(items: { quality: number | null }[]): number | null {
  const rated = items.filter(
    (i): i is { quality: number } => i.quality !== null
  );
  if (rated.length === 0) return null;
  const sum = rated.reduce((acc, i) => acc + i.quality, 0);
  return Math.round((sum / (rated.length * 5)) * 100);
}
