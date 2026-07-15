import { describe, expect, it } from "vitest";
import { parseQuestionFile } from "@/features/questions/parse-question-file";

const validFile = `---
title: Как работает Event Loop в браузере
difficulty: senior
tags: [event-loop, async]
followUps:
  - Чем отличается event loop в Node.js?
references:
  - title: MDN
    url: https://developer.mozilla.org/ru/docs/Web/JavaScript/Event_loop
---

Объясните, как устроен Event Loop.

<!-- answer -->

Event Loop берёт задачи из очередей, когда стек пуст.
`;

describe("parseQuestionFile", () => {
  it("разбирает валидный файл: slug, вопрос и ответ по маркеру", () => {
    const parsed = parseQuestionFile(validFile, "javascript", "event-loop");

    expect(parsed.slug).toBe("javascript-event-loop");
    expect(parsed.topic).toBe("javascript");
    expect(parsed.title).toBe("Как работает Event Loop в браузере");
    expect(parsed.difficulty).toBe("senior");
    expect(parsed.tags).toEqual(["event-loop", "async"]);
    expect(parsed.body).toBe("Объясните, как устроен Event Loop.");
    expect(parsed.answer).toBe(
      "Event Loop берёт задачи из очередей, когда стек пуст."
    );
    expect(parsed.followUps).toHaveLength(1);
    expect(parsed.references[0].url).toContain("developer.mozilla.org");
  });

  it("подставляет значения по умолчанию: status=published, version=1", () => {
    const parsed = parseQuestionFile(validFile, "javascript", "event-loop");
    expect(parsed.status).toBe("published");
    expect(parsed.version).toBe(1);
  });

  it("бросает ошибку без маркера ответа", () => {
    const noMarker = validFile.replace("<!-- answer -->", "");
    expect(() =>
      parseQuestionFile(noMarker, "javascript", "event-loop")
    ).toThrow(/маркера/);
  });

  it("бросает ошибку при пустом ответе после маркера", () => {
    const emptyAnswer = validFile.slice(
      0,
      validFile.indexOf("<!-- answer -->") + "<!-- answer -->".length
    );
    expect(() =>
      parseQuestionFile(emptyAnswer, "javascript", "event-loop")
    ).toThrow(/пустой вопрос или ответ/);
  });

  it("бросает ошибку при невалидном frontmatter (difficulty вне enum)", () => {
    const badDifficulty = validFile.replace(
      "difficulty: senior",
      "difficulty: expert"
    );
    expect(() =>
      parseQuestionFile(badDifficulty, "javascript", "event-loop")
    ).toThrow();
  });

  it("бросает ошибку без тегов (минимум один)", () => {
    const noTags = validFile.replace("tags: [event-loop, async]", "tags: []");
    expect(() => parseQuestionFile(noTags, "javascript", "event-loop")).toThrow();
  });
});
