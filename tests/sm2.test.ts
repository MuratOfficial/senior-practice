import { describe, expect, it } from "vitest";
import { SM2_INITIAL, nextDueAt, sm2, type Sm2State } from "@/features/review/sm2";

describe("sm2", () => {
  it("первое успешное повторение: интервал 1 день", () => {
    const next = sm2(SM2_INITIAL, 5);
    expect(next.interval).toBe(1);
    expect(next.repetition).toBe(1);
  });

  it("второе успешное повторение: интервал 6 дней", () => {
    const next = sm2(sm2(SM2_INITIAL, 5), 5);
    expect(next.interval).toBe(6);
    expect(next.repetition).toBe(2);
  });

  it("третье и далее: interval = round(prev * easeFactor)", () => {
    let state: Sm2State = SM2_INITIAL;
    state = sm2(state, 4); // interval 1, EF 2.5
    state = sm2(state, 4); // interval 6, EF 2.5
    const third = sm2(state, 4);
    expect(third.interval).toBe(Math.round(6 * state.easeFactor));
    expect(third.repetition).toBe(3);
  });

  it("оценка 5 увеличивает easeFactor, оценка 3 уменьшает", () => {
    expect(sm2(SM2_INITIAL, 5).easeFactor).toBeCloseTo(2.6);
    expect(sm2(SM2_INITIAL, 3).easeFactor).toBeCloseTo(2.36);
  });

  it("оценка 4 не меняет easeFactor", () => {
    expect(sm2(SM2_INITIAL, 4).easeFactor).toBeCloseTo(2.5);
  });

  it("провал (q < 3) сбрасывает повторения и возвращает интервал 1", () => {
    let state: Sm2State = SM2_INITIAL;
    state = sm2(state, 5);
    state = sm2(state, 5);
    state = sm2(state, 5); // interval 15+
    const failed = sm2(state, 1);
    expect(failed.repetition).toBe(0);
    expect(failed.interval).toBe(1);
  });

  it("провал тоже снижает easeFactor", () => {
    const failed = sm2(SM2_INITIAL, 0);
    expect(failed.easeFactor).toBeCloseTo(1.7);
  });

  it("easeFactor не опускается ниже 1.3", () => {
    let state: Sm2State = SM2_INITIAL;
    for (let i = 0; i < 10; i++) state = sm2(state, 0);
    expect(state.easeFactor).toBe(1.3);
  });

  it("длинная успешная серия растит интервал экспоненциально", () => {
    let state: Sm2State = SM2_INITIAL;
    const intervals: number[] = [];
    for (let i = 0; i < 5; i++) {
      state = sm2(state, 5);
      intervals.push(state.interval);
    }
    expect(intervals[0]).toBe(1);
    expect(intervals[1]).toBe(6);
    for (let i = 2; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
    }
  });
});

describe("nextDueAt", () => {
  it("прибавляет interval дней к текущей дате", () => {
    const now = new Date("2026-07-16T10:00:00Z");
    const due = nextDueAt(6, now);
    expect(due.toISOString()).toBe("2026-07-22T10:00:00.000Z");
  });
});
