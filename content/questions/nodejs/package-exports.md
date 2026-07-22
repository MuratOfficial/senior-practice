---
title: package.json exports, dual package и разрешение модулей в Node
difficulty: senior
tags: [esm, package-json, exports, module-resolution]
followUps:
  - Чем поле exports отличается от main и почему оно «запечатывает» пакет?
  - Что такое dual package hazard и как его избежать?
  - Как conditional exports различают import/require/node/browser?
references:
  - title: "Node.js docs: Packages — exports"
    url: https://nodejs.org/api/packages.html#exports
---
Как Node определяет, что файл — ESM или CommonJS, и как поле `exports` в package.json управляет тем, что импортируется? Что такое dual package hazard и conditional exports? Почему `exports` строже, чем `main`?

<!-- answer -->

**ESM или CJS?** Node решает по контексту, не по содержимому: `.mjs` → всегда ESM, `.cjs` → всегда CJS, `.js` — зависит от ближайшего `package.json`: `"type": "module"` → ESM, отсутствие/`"commonjs"` → CJS. Отсюда классическая ошибка «Cannot use import statement outside a module» — `.js` без `"type": "module"`.

**Поле `exports`** — современная замена `main`, задаёт **публичную карту точек входа** пакета:

```json
{
  "name": "lib",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./utils": "./dist/utils.mjs"
  }
}
```

Ключевое отличие от `main`: `exports` **инкапсулирует пакет**. Всё, что не перечислено, становится недоступным — `import "lib/dist/internal.js"` бросит ошибку, даже если файл существует. `main` такого не давал: тянуть можно было любой внутренний путь, и пакеты боялись рефакторить структуру. Порядок ключей внутри условия **значим** — Node берёт первое подходящее, поэтому `types` ставят первым, а `default` — последним фолбэком.

**Conditional exports** — `import`/`require`/`node`/`browser`/`default` выбирают файл по тому, *как* и *где* пакет подключают: `import x from` → ветка `import`, `require()` → `require`, сборка под браузер → `browser`. Так один пакет отдаёт разные сборки без развилок в коде.

**Dual package hazard** — если пакет поставляет и ESM-, и CJS-копию, приложение может **загрузить обе** (одну через `import`, другую через `require` из транзитивной зависимости). Тогда в памяти два разных экземпляра модуля: `instanceof` ломается, синглтоны/кэши дублируются, состояние расходится.

Как избегать:

- Держать **состояние** в одном тонком CJS-ядре, а ESM-обёртку делать реэкспортом (`export * from "./core.cjs"`) — обе стороны видят один инстанс.
- Или отдавать **только ESM** (всё чаще предпочтительно) — одна копия по определению.
- Не хранить в модуле мутабельные синглтоны без такой развязки.

Практика: держите `exports` строгим (не открывайте `"./*"` без нужды), всегда указывайте `types` в каждой ветке, тестируйте пакет и через `import`, и через `require`, и проверяйте резолюцию инструментами вроде `arethetypeswrong`.
