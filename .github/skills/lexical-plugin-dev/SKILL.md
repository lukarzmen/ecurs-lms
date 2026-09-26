---
name: lexical-plugin-dev
description: 'Use when adding, modifying, or debugging a custom Lexical editor plugin or node in components/editor (interactive/gamified content blocks like quizzes, gap-fill, ordering, true/false, dictionary, task, todo). Covers node+plugin scaffolding, toolbar registration, and ModuleContent JSON persistence conventions for the Ecurs LMS editor.'
---

# Lexical Editor Plugin & Node Development

Ecurs' Lexical editor (`components/editor/`) is a fork of the Meta Lexical playground with many **authorial** plugins/nodes added on top (`QuizPlugin`, `GapPlugin`, `OrderingPlugin`, `TrueFalsePlugin`, `TodoPlugin`, `TaskPlugin`, `DescriptionPlugin`, `DictionaryPlugin`, `SelectAnswerPlugin`, `QuestionAnswerPlugin`, `LessonBuilderPlugin`, `TextToVoicePlugin`, `TranslationPlugin`, `AudioPlugin`, `GenerateDictionaryPlugin`, `TextGeneratorPlugin` …). These add interactive, gamified, learning-focused content blocks. Only touch stock Lexical playground code (`ImagesPlugin`, `TablePlugin`, `LayoutPlugin`, etc.) when explicitly asked — prefer following the custom-plugin pattern for new features.

## File Layout Convention (per feature, e.g. "Foo")

```
components/editor/nodes/FooNode/
  FooNode.tsx          # LexicalNode subclass: createDOM/exportJSON/importJSON/decorate
  FooComponent.tsx      # React component rendered by decorate() (optional, for interactive UI)
components/editor/plugins/FooPlugin/
  index.tsx             # registers INSERT_FOO_COMMAND + editor.registerCommand
  InsertFooDialog.tsx    # form dialog shown via useModal(), dispatches the insert command
```

Look at `nodes/QuizNode/`, `plugins/QuizPlugin/`, `plugins/OrderingPlugin/` as the closest reference implementations before writing new code.

## Steps to Add a New Node/Plugin

1. **Node**: extend `DecoratorNode` (or `ElementNode`), implement `static getType()`, `static clone()`, `static importJSON()`, `exportJSON()`, `createDOM()`, `decorate()`. Keep the exported JSON shape minimal and versioned if it may evolve (add a `version` field like other nodes).
2. **Register the node** in [components/editor/nodes/EditorNodes.ts](../../../components/editor/nodes/EditorNodes.ts) — add to the `EditorNodes` array. Missing this = silent runtime error ("node type not registered") when loading saved content.
3. **Command**: in `plugins/FooPlugin/index.tsx`, `createCommand<Payload>('INSERT_FOO_COMMAND')`, register with `editor.registerCommand(..., COMMAND_PRIORITY_EDITOR)`, wrap inserted node in a paragraph and ensure surrounding paragraphs exist (copy the pattern from `QuizPlugin/index.tsx`).
4. **Dialog**: `InsertFooDialog.tsx` collects input via a form, calls `editor.dispatchCommand(INSERT_FOO_COMMAND, payload)`, then closes the modal.
5. **Toolbar button**: in [components/editor/plugins/ToolbarPlugin/index.tsx](../../../components/editor/plugins/ToolbarPlugin/index.tsx), import the dialog, add a `DropDownItem`/button that calls `showModal(t('ed.insertFoo'), (onClose) => <InsertFooDialog activeEditor={activeEditor} onClose={onClose} />)`. Use `<i className="icon foo" />` + `<span className="text">{t('ed.foo')}</span>` matching existing entries.
6. **i18n**: add the `ed.insertFoo` / `ed.foo` keys to **both** `public/locales/pl/common.json` (first) and `public/locales/en/common.json`. Never hardcode label strings.
7. **Register the plugin** in the composer tree (`Editor.tsx` / `LexicalEditor.tsx`) so `registerCommand` actually runs.
8. **Read-only rendering**: if the node has interactive state (answers, progress), verify `ReadonlyEditor` still renders it sensibly — decorator nodes render the same component tree in both editors unless you gate interactivity via a read-only context flag.

## Persistence Contract

- Editor content round-trips as Lexical JSON stored in `ModuleContent.data` (see `app/api/content/[moduleId]/route.ts`). Whatever `exportJSON()` produces is what gets persisted — keep it JSON-serializable (no functions/class instances) and stable across versions.
- If you change a node's exported shape, keep `importJSON` backward-compatible with previously-saved content (old modules already have the old shape in the DB) — add optional fields with defaults, don't rename existing keys.

## Gamification/UX Guidance

These nodes exist to make lessons more attractive and faster to complete (quizzes, ordering, gap-fill, true/false, dictionary popups). When designing a new interactive node:
- Keep the authoring dialog simple (one focused form) — mirror `InsertQuizDialog.tsx`/`InsertOrderingDialog.tsx` UX (react-hook-form + Zod where validation is needed, shadcn/ui inputs).
- Keep the rendered component self-contained (own local state), so it works both in the editor canvas and in `ReadonlyEditor`/student view without extra wiring.

## Verification

Run `npm run lint` and `npm run build` after adding a node/plugin — missing entries in `EditorNodes.ts` or unregistered plugins in the composer typically surface as TypeScript errors or runtime console warnings, not build failures, so also manually insert the new block once in the dev editor to confirm no console errors.
