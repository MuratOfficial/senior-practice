/**
 * SuperMemo SM-2 — классический алгоритм spaced repetition.
 * Чистая функция без I/O: состояние карточки + оценка → новое состояние.
 * https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm
 */

export interface Sm2State {
  /** Коэффициент лёгкости, ≥ 1.3 (стартовое значение 2.5) */
  easeFactor: number;
  /** Текущий интервал повторения в днях */
  interval: number;
  /** Число подряд успешных повторений (сбрасывается при провале) */
  repetition: number;
}

/** Оценка ответа 0–5: <3 — провал (карточка уходит в начало цикла) */
export type Sm2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export const SM2_INITIAL: Sm2State = {
  easeFactor: 2.5,
  interval: 0,
  repetition: 0,
};

const MIN_EASE_FACTOR = 1.3;

export function sm2(state: Sm2State, quality: Sm2Quality): Sm2State {
  let { easeFactor, interval, repetition } = state;

  if (quality >= 3) {
    if (repetition === 0) interval = 1;
    else if (repetition === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetition += 1;
  } else {
    repetition = 0;
    interval = 1;
  }

  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < MIN_EASE_FACTOR) easeFactor = MIN_EASE_FACTOR;

  return { easeFactor, interval, repetition };
}

/** Дата следующего повторения: now + interval дней */
export function nextDueAt(interval: number, now: Date = new Date()): Date {
  const due = new Date(now);
  due.setDate(due.getDate() + interval);
  return due;
}
