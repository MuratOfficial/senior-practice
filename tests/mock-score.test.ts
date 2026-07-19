import { describe, expect, it } from "vitest";
import { computeScore } from "@/features/mock/score";

describe("computeScore", () => {
  it("null, если ничего не оценено", () => {
    expect(computeScore([])).toBeNull();
    expect(computeScore([{ quality: null }, { quality: null }])).toBeNull();
  });

  it("100 при всех «Знал» (5)", () => {
    expect(computeScore([{ quality: 5 }, { quality: 5 }])).toBe(100);
  });

  it("средняя по оценённым, пропуски не считаются", () => {
    // (5 + 3) / (2 * 5) = 80%
    expect(
      computeScore([{ quality: 5 }, { quality: 3 }, { quality: null }])
    ).toBe(80);
  });

  it("округляет до целого процента", () => {
    // (5 + 3 + 1) / 15 = 60%; (1) / 5 = 20%
    expect(computeScore([{ quality: 5 }, { quality: 3 }, { quality: 1 }])).toBe(60);
    expect(computeScore([{ quality: 1 }])).toBe(20);
  });

  it("0 при всех «не знал» с оценкой 0", () => {
    expect(computeScore([{ quality: 0 }, { quality: 0 }])).toBe(0);
  });
});
