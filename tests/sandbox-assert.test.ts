import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, beforeAll } from "vitest";

/**
 * Тестирует ЯДРО автопроверки (assert/deepEqual) из public/sandbox/runner.html.
 * Мы не дублируем логику: читаем блок #lib-src из самого раннера и исполняем
 * его — то есть проверяем ровно тот код, что крутится в песочнице у пользователя.
 * Если deepEqual ошибётся, все вердикты задач станут врать — этот файл страхует.
 */

interface AssertFn {
  (cond: unknown, msg?: string): void;
  equal(actual: unknown, expected: unknown, msg?: string): void;
  deepEqual(actual: unknown, expected: unknown, msg?: string): void;
  throws(fn: () => unknown, msg?: string): Promise<void>;
}

let assert: AssertFn;
let deepEqual: (a: unknown, b: unknown) => boolean;

beforeAll(() => {
  const html = readFileSync(
    path.join(__dirname, "..", "public", "sandbox", "runner.html"),
    "utf-8"
  );
  const match = html.match(
    /<script type="text\/sandbox-lib" id="lib-src">([\s\S]*?)<\/script>/
  );
  if (!match) throw new Error("Блок #lib-src не найден в runner.html");

  // Исполняем библиотечный код и достаём из его области видимости хелперы
  const factory = new Function(
    match[1] + "\nreturn { assert: assert, deepEqual: deepEqual };"
  );
  const lib = factory();
  assert = lib.assert;
  deepEqual = lib.deepEqual;
});

describe("sandbox deepEqual", () => {
  it("примитивы, включая NaN и -0/+0", () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual("a", "a")).toBe(true);
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual(NaN, NaN)).toBe(true); // Object.is — ключевое отличие от ===
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
  });

  it("объекты: порядок ключей не важен, число ключей важно", () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("вложенные массивы и объекты", () => {
    expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2, 3], [3, 2, 1])).toBe(false); // порядок массива важен
  });

  it("массив против объекта с теми же индексами — не равны", () => {
    expect(deepEqual([1, 2], { 0: 1, 1: 2 })).toBe(false);
    expect(deepEqual([], {})).toBe(false);
  });

  it("ключ с undefined-значением отличается от отсутствующего ключа", () => {
    expect(deepEqual({ a: 1, b: undefined }, { a: 1 })).toBe(false);
  });
});

describe("sandbox assert", () => {
  it("assert бросает AssertionError на falsy", () => {
    expect(() => assert(false)).toThrow(/ожидалось/);
    expect(() => assert(true)).not.toThrow();
    expect(() => assert(0)).toThrow();
  });

  it("assert.equal использует Object.is", () => {
    expect(() => assert.equal(2, 2)).not.toThrow();
    expect(() => assert.equal(NaN, NaN)).not.toThrow();
    expect(() => assert.equal(2, 3)).toThrow(/ожидалось 3, получено 2/);
  });

  it("assert.deepEqual делегирует в deepEqual", () => {
    expect(() => assert.deepEqual([1, 2], [1, 2])).not.toThrow();
    expect(() => assert.deepEqual([1, 2], [2, 1])).toThrow();
  });

  it("assert.throws проходит только при исключении", async () => {
    await expect(
      assert.throws(() => {
        throw new Error("boom");
      })
    ).resolves.toBeUndefined();
    await expect(
      assert.throws(async () => {
        throw new Error("async boom");
      })
    ).resolves.toBeUndefined();
    await expect(assert.throws(() => 42)).rejects.toThrow(/ожидалось исключение/);
  });

  it("сообщение об ошибке содержит ожидаемое и полученное", () => {
    try {
      assert.deepEqual({ a: 1 }, { a: 2 });
      throw new Error("должен был бросить");
    } catch (e) {
      expect((e as Error).message).toContain('{"a":2}');
      expect((e as Error).message).toContain('{"a":1}');
    }
  });
});
