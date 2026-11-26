# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run serve              # Vite dev server on port 8080
npm run build              # vue-tsc type check, then vite build (no sourcemaps, outputs to deploy/oj-frontend/dist)
npm run type-check         # vue-tsc only (checks templates too)
npm run lint               # ESLint (src, tests, vite.config.mts); lint:fix to auto-fix
npm run format             # Prettier format all src/**/*.{ts,vue,css}
npm run test:unit          # Vitest unit tests (tests/unit/*.spec.ts, jsdom, globals on)
npm run generate:api       # Regenerate API client from backend OpenAPI spec (requires backend running on :8102)
```

- **Unit tests exist** in `tests/unit/`: `questionSubmit.spec.ts` (judge-info adaptation), `questionSubmitPolling.spec.ts` (poller, uses fake timers), `questionJudgeCase.spec.ts` (judge case service), `questionJudgeConfig.spec.ts` (judge config normalization), `questionProgress.spec.ts` (submission → progress state, acceptance rate), `questionStarterCode.spec.ts` (language options + starter code), `questionDraft.spec.ts` (draft management), `useTheme.spec.ts`, `companionStream.spec.ts` (SSE parsing + stream errors), `codeEditProposal.spec.ts` (applying AI code edits), `useCompanion.spec.ts` (companion state, services mocked), `petPlacement.spec.ts` (pet position/size clamping + storage parsing), `editorSelection.spec.ts` (selected line range), `useProblemEditor.spec.ts` (language pick, drafts, reset), `problemNavigation.spec.ts` (prev / next across pages), `difficulty.spec.ts`, `dateTime.spec.ts` (relative time, compact numbers), `apiConfig.spec.ts`, `apiId.spec.ts`, `checkAccess.spec.ts`, `userSummary.spec.ts`, `userRole.spec.ts`, `duckPoses.spec.ts` (mascot poses, wing angles, face shapes), `usePetBehavior.spec.ts` (pet states over time, fake timers), `useDuckFlight.spec.ts`. Run one file via `npm run test:unit tests/unit/<file>.spec.ts`.
- The dev server proxies `/api` to `http://127.0.0.1:8102` (configured in `vite.config.mts`).
- If the dev server shows stale results, kill `node` processes and restart `npm run serve`.
- Env values come from `import.meta.env` (e.g. `BASE_URL`); there is no `process.env` in app code.
- Tests use Vitest's `vi.*` API (`vi.fn`, `vi.mock`, fake timers). A mock factory for a module with a default export must return `{ default: ... }`; use `importOriginal` instead of `requireActual`.

## Package Manager

npm only: `package-lock.json` is the lockfile (`npm ci` to install). Do not add a `yarn.lock` or `pnpm-lock.yaml`.

## Tech Stack

- **Framework:** Vue 3 (Composition API, `<script setup lang="ts">`)
- **Build:** Vite 6 (`@vitejs/plugin-vue`) + TypeScript ~5.6, type-checked by `vue-tsc`
- **UI Library:** own components in `src/components/ui/` (`AppIcon`, `UiInput`, `UiSelect`, `UiNumberInput`, `UiTagInput`, `UiSwitch`, `UiSegmented`, `UiPagination`). Arco Design Vue is only used for `message` toasts (styled by `src/styles/arco.css`); no Arco components are registered
- **Fonts:** Geist / Geist Mono (`@fontsource-variable/*`, self-hosted); Chinese falls back to system fonts
- **State:** Vuex 4 (namespaced `user` module)
- **Router:** Vue Router 4 (`createWebHistory`)
- **HTTP:** Axios (`withCredentials: true`, interceptors in `src/plugins/axios.ts`)
- **Editor:** Monaco Editor, assembled on demand in `src/components/editor/monaco.ts` (java, javascript, typescript, python, cpp, go)
- **Markdown:** ByteMD (`@bytemd/vue-next`) with plugin-gfm and plugin-highlight
- **Syntax highlighting:** `highlight.js` (direct dependency) — used by `CodeBlock.vue` and ByteMD's plugin-highlight; colors come from `styles/code.css`
- **Codegen:** `openapi-typescript-codegen` generates API client from OpenAPI spec into `generated/`
- **Tests:** Vitest 3 (jsdom), configured in `vite.config.mts`

## Project Structure

```
src/
├── access/               # Route-level permission guard (accessEnum, checkAccess, beforeEach guard)
├── components/
│   ├── common/ConfirmDialog.vue
│   ├── companion/        # AI 陪练（see "AI Companion" below）
│   │   ├── CompanionAvatar.vue      # 鸭鸭: line-art duck built from parts, one pose per mood / action; fill via --mascot-fill
│   │   ├── duck/duckPoses.ts + duckShapes.ts  # Pose table (eyes, beak, wing angles, motion, effects) and face shapes
│   │   ├── CompanionPet.vue         # Draggable / resizable pet (teleported to body) + speech bubble; pendulum swing while dragged
│   │   ├── DuckFlight.vue           # The duck flying between the editor and the panel header when the panel opens / closes
│   │   ├── CompanionPanel.vue       # Third panel on the problem page: header, messages, composer + toolbar
│   │   ├── ContextUsageRing.vue / HintLevelPicker.vue / ConversationMenu.vue / SelectionAskBox.vue
│   │   ├── CompanionMessageItem.vue / CodeEditPreviewBar.vue / AiSettingDialog.vue
│   ├── editor/
│   │   ├── CodeBlock.vue        # Read-only highlighted code (highlight.js, 6 languages)
│   │   ├── CodeEditor.vue       # Monaco wrapper (format / getCursorInfo / collapseSelection / replaceAll, diff preview, selection events)
│   │   ├── monaco.ts            # Loads only the Monaco parts we use + sets up its workers (lazy-imported by CodeEditor)
│   │   ├── monacoThemes.ts      # myoj-light / myoj-dark editor themes (same colors as styles/code.css)
│   │   ├── MdEditor.vue / MdViewer.vue
│   ├── layout/
│   │   ├── AppRail.vue          # Left icon rail (bottom bar on narrow screens): 题库, 提交记录, 出题 / 管理 menus, theme, account
│   │   ├── RailMenu.vue + railMenu.ts  # Rail popover menu
│   ├── problem/             # 题库页和做题页（PaneResizer：做题页面板之间的拖动条）
│   │   ├── ProblemStatement.vue   # Title, facts (difficulty, rate, limits), tags, content, author
│   │   ├── MySubmissionList.vue / SubmissionDetail.vue
│   │   ├── VerdictDock.vue        # Judge result bar at the bottom of the editor panel
│   │   ├── ProblemListDrawer.vue  # List drawer over the statement panel
│   │   ├── DifficultyLabel.vue / ProblemStatusIcon.vue
│   ├── question/            # Judge value editors, SubmissionRankRings, SubmissionDiagnosticPanel, admin details
│   ├── ui/                  # AppIcon + icons.ts, UiInput, UiSelect, UiNumberInput, UiTagInput, UiSwitch, UiSegmented, UiPagination
│   └── user/                # AuthShell, AvatarPicker, UserAvatar, UserFormDialog, UserIdentity
├── composables/
│   ├── problem/useProblemEditor.ts   # Languages, starter code, local drafts (300ms debounce)
│   ├── problem/useJudge.ts           # Submit, queue polling, rank, verdict state
│   ├── problem/useMySubmissions.ts   # My submissions page + detail tabs with pollers
│   ├── problem/useProblemLayout.ts   # Draggable panel widths on the problem page (localStorage["myoj:problem-layout"])
│   ├── useMyProgress.ts   # Whole-library progress (GET /question/progress/my), shared by list and problem pages
│   ├── useCompanion.ts / usePetPlacement.ts / usePetBehavior.ts (which pose the duck shows) / usePetLook.ts (eyes follow the mouse) / useDuckFlight.ts / useDismissable.ts / useTheme.ts
├── layouts/
│   ├── AppLayout.vue     # Rail + main area + ICP footer
│   └── UserLayout.vue    # Login / register
├── services/             # apiId, companion(+Stream), codeEditProposal, problemNavigation, questionDraft,
│                         # questionJudgeCase, questionJudgeConfig, questionProgress, questionStarterCode,
│                         # questionSubmit, questionSubmitPolling, userSummary
├── styles/
│   ├── tokens.css        # Design tokens (light + dark) and legacy aliases for old pages
│   ├── base.css          # Reset, typography, .panel, .btn, .icon-btn, [data-tip] tooltips
│   ├── code.css          # Theme-aware code colors (--code-*, --sx-*) and highlight.js token rules
│   ├── page.css          # Page skeleton for normal pages: .page, .page-head, .list-panel, .list-row, .field, .tag, .verdict-text
│   └── arco.css          # Styles the Arco message toast (the only Arco piece left)
├── utils/                # dateTime (+ relative time, compact numbers), difficulty, editorSelection, userRole, copyText
├── views/
│   ├── problem/ProblemsView.vue   # 题库 (/ and /questions)
│   ├── problem/ProblemView.vue    # 做题页 (/problem/:id)
│   ├── question/                  # AddQuestionView, ManageQuestionView (also /my/question with scope=mine), QuestionSubmitView
│   ├── user/                      # Login, Register, Profile, UserManage
│   └── NoAuthView.vue
├── App.vue               # AppLayout, or UserLayout for /user/*
└── main.ts               # Fonts, styles, Arco message CSS, router, store, access guard

generated/               # Auto-generated API client — DO NOT EDIT (npm run generate:api)
```

## Design System

Gray canvas with floating white panels (gaps between them, no hairline-glued blocks), black / white / gray only. Color is used only for meaning: difficulty (`--easy` / `--medium` / `--hard`) and verdicts (`--success` / `--danger`). Prefer icons with `data-tip` tooltips over text labels where the meaning is obvious; keep text short.

- **Tokens** live in `src/styles/tokens.css` for light and `:root[data-theme="dark"]`: surfaces `--bg` (canvas), `--panel`, `--fill`, `--fill-strong`; lines `--line`, `--line-strong`; text `--ink`, `--body`, `--muted`, `--faint`; `--primary` is black in light mode and near-white in dark mode (`--on-primary` flips with it); radii `--radius-sm` 8 / `md` 12 / `lg` 18 / `xl` 22 / `pill`; `--shadow-panel`, `--shadow-float`, `--focus-ring`; motion `--motion-fast|standard|layout`, `--ease-out|in-out|drawer`.
- The bottom of `tokens.css` keeps **legacy aliases** (`--canvas`, `--hairline`, `--surface-soft`, `--surface-dark`, `--font-display`, `--error`, …) that a few companion components still use. New code uses the new names.
- **Shared classes** (`base.css`): `.panel` (white floating block), `.btn` / `.btn.primary` / `.btn.sm` (pills), `.icon-btn` (36px round, `.on` = pressed), `.num` (tabular numbers), `[data-tip]` CSS tooltips (right by default, `.tip-up` / `.tip-down`).
- **Normal pages** (`page.css`): `div.page` grid → `.panel.page-head` (h1 + `.count`, `.head-end` actions) → `.panel.list-panel` (`.list-toolbar`, `.list-rows` with `.list-head` + `.list-row` grids whose columns each page defines, `.list-empty`, `.list-pager`). Filters apply as you type (300ms) — no 搜索 buttons. Row actions are icon buttons with `data-tip`. Forms use `.field` / `.field-label` + `Ui*` inputs and `.textarea`.
- **Code colors** (`code.css`): `--code-surface`, `--code-ink`, `--sx-keyword|type|string|number|comment|function|tag|deletion`. Code follows the theme (white in light mode). Monaco can't read CSS variables, so `monacoThemes.ts` repeats the same colors; change both together.
- **Mascot:** 鸭鸭, a duck drawn like the Ollama icon: one stroke width, `currentColor` lines, fill `--mascot-fill` (defaults to `--panel`; set it to the background it sits on), small dot eyes. `CompanionAvatar` takes `mood` (static uses) or `pose` (the pet); body motion only runs with `lively`, so static icons just blink. Parts (head, tuft, wings, feet) rotate around their own boxes (`transform-box: fill-box`); add a pose in `duckPoses.ts`, not in the component.
- **Theme toggle:** `useTheme` sets `data-theme` + `color-scheme` on `<html>`, `arco-theme="dark"` on `<body>`, persists `localStorage["myoj-theme"]`; `CodeEditor` switches the Monaco theme when it changes.
- **ICP 备案号** 渝ICP备2026019190号 (link `http://beian.miit.gov.cn/`) is always shown in AppLayout's footer, on every page including the problem page.

### Vue Scoped CSS Limitation

The `:has()` selector does NOT work across Vue scoped component boundaries, because scoped CSS adds `data-v-xxx` attributes to elements. Use `:deep()` for penetrating component boundaries in scoped CSS.

### Monaco Editor ResizeObserver Loop

Monaco uses ResizeObserver internally; when the editor's container changes size (verdict bar appearing) it can loop. `ProblemView.vue` pins the container:
```css
.editor-body :deep(#code-editor) {
  height: 100% !important;
  min-height: 200px !important;
  width: 100% !important;
  overflow: hidden !important;
  contain: strict !important;
}
```

## Key Architecture Patterns

### Layout

`AppLayout` is a grid: 68px icon rail + main area (on screens ≤720px the rail becomes a bottom bar — `AppRail` must keep a single root element so `class="app-rail"` falls through). The main area scrolls, except for routes with `meta.fullHeight` (the problem page), which fill the viewport and scroll inside their panels. The router view is keyed by `fullPath`, except routes with `meta.queryState` (the problem list keeps its filters in the query string and must not remount on every filter change).

### 题库 (ProblemsView)

Top row: title + count and 「继续上次」 (latest local draft via `getLatestQuestionDraft`) or 「随机一题」; progress ring + per-difficulty bars from `useMyProgress` (login prompt when logged out). Below: topic tabs (`GET /question/tags`), search (300ms debounce), difficulty segmented control (`difficulty` param), 「只看还没通过的」 (`unsolvedOnly`, logged in only), sort menu (`sortField` createTime / submitNum / acceptedNum, descend), one row per question linking to `/problem/:id`, pagination. All filters live in the query string (`tag`, `level`, `q`, `page`, `todo`, `sort`). Question IDs are snowflake IDs, so rows don't show them.

Each loaded page is recorded with `setProblemListContext` (sessionStorage); the problem page's prev / next and list drawer follow that list and load the adjacent page with the same filters at page edges.

### 做题页 (ProblemView, /problem/:id)

Three floating panels (widths draggable via `PaneResizer` + `useProblemLayout`; the editor always keeps at least 380px): statement (tabs 题目 / 题解 / 我的提交 / 公开提交 ↗ / submission detail tabs; list drawer, prev / next), editor (language, draft-saved indicator, format, reset, submit; `VerdictDock` at the bottom), and the companion panel as a third column only while it is open (otherwise the pet floats over the editor). `?lang=` picks the initial language, then the last used one (`localStorage["myoj:last-language"]`). Logged-out users see 「登录后提交」 and are sent to login for 题解 / 我的提交. The component is recreated per question (route key), so composables start fresh.

### ApiId: Bridging Java Long ↔ Routing

The backend exposes Java `Long` IDs. The generated client declares them as `number`, but JSON serializes them as strings. `src/services/apiId.ts` provides:
- `ApiId = string | number` — the canonical ID type used throughout the app
- `parseRouteApiId(value)` — extracts and validates a route param (accepts string or array, validates numeric format)
- `toGeneratedApiId(id: ApiId): number` — casts for the generated client (which expects `number` even when the wire format is string)

Always use `ApiId` in app code; only cast with `toGeneratedApiId` at the generated service boundary.

### Language Configuration

Programming languages are fetched dynamically from the backend (`getSupportedLanguages()`), not hardcoded. `src/services/questionStarterCode.ts` handles:
- **`getSupportedLanguageOptions()`** — fetches and normalizes language options from the backend (cached via module-level promise deduplication)
- **`normalizeLanguageOptions()`** — validates the backend response, ensures `text` and `value` are present and unique
- **Starter code templates** — fetched per-question, validated against supported languages, normalized into `StarterCodeMap` (language → code)
- Errors are thrown as `StarterCodeServiceError` (includes backend `code` for error display)

### Code Drafts (localStorage)

`src/services/questionDraft.ts` manages per-user+question+language code drafts in `localStorage` (single source of truth — `sessionStorage` is NOT used; legacy sessionStorage entries are ignored):
- **Key format:** `myoj:question-draft:<userId>:<questionId>:<language>` (each part URL-encoded)
- **Storage:** `localStorage` with a **7-day TTL** (`DRAFT_TTL_MS`); expired/corrupted entries return `undefined` from `getQuestionDraft`
- **`sweepExpiredQuestionDrafts()`** — removes all expired/corrupted drafts; called once at startup in `main.ts`
- **`getQuestionDraft` is a pure read** — it never writes/removes; cleanup is the sweep's job
- **`clearQuestionDraftsForUser(userId)`** clears all drafts for a user (called by Vuex's `updateUser` ONLY when the logged-in user id changes — i.e. account switch without logout; `resetUser` on logout/401/session-expiry deliberately does NOT clear drafts so the same user's drafts refill after re-login)
- **`clearQuestionDraftsForQuestion(questionId)`** clears all drafts for a specific question (called after question update/deletion)
- Draft functions silently catch storage errors (unavailable/full) — editing must never break due to draft failures

Save behavior lives in `useProblemEditor` (do not re-implement elsewhere):
- Editing triggers a **300ms debounce** before writing; drafts are written only after the user stops typing
- When the code equals the starter template the draft is deleted (template state = no draft)
- Nothing is written while the template failed to load (so a failed request can't wipe a real draft)
- `dispose()` on unmount saves synchronously as a safety net

### Code Highlighting

- `CodeBlock.vue` — read-only code with highlight.js (java, javascript, typescript, python, cpp, go + aliases `c++`, `golang`, `js`, `ts`); falls back to `highlightAuto`.
- `MdViewer.vue` — ByteMD with `@bytemd/plugin-highlight`, which only adds token classes. Token colors for both come from `styles/code.css` (no highlight.js theme CSS is imported); code blocks use `--code-surface` / `--code-ink` and follow the theme.

### Code Editor Formatting

`CodeEditor.vue` exposes `format()` via `defineExpose` and calls the `onFormat` prop callback afterwards (ProblemView turns the format icon into a check for a moment):
- **Shortcut:** Ctrl+Alt+L, registered via `editor.addCommand` — both button and shortcut go through the same `format()`
- **Supported languages:** Monaco has built-in formatting providers only for `javascript`/`typescript` (the standalone build never sets the `editorHasDocumentFormattingProvider` context key, so `action.isSupported()` is unreliable — a `FORMATTABLE_LANGUAGES` whitelist is used instead). For other languages, a hint "暂不支持 xxx 格式化" fades in/out over the editor (2.2s, `<Transition>`), and `onFormat` is NOT called
- If you add formatting for other languages, update the whitelist or register a real `DocumentFormattingEditProvider`

### Code Submission & Polling
Polling logic lives in `src/services/` and `useJudge` — do not re-implement inline in views:
1. `questionSubmit.ts` — `requestQuestionSubmit(submitId)` wraps `getQuestionSubmitById` with a 10s per-request timeout + cancellation; `normalizeQuestionSubmit`/`normalizeJudgeInfo` parse the judgeInfo JSON string; `getJudgeResultPresentation` maps submissions to `{ label, message, tone }` — status 2 is only "通过" when the message is exactly `Accepted`
2. `questionSubmitPolling.ts` — `createQuestionSubmitPoller({ request, queueRequest, onUpdate, onQueueUpdate, onTimeout, interval?, timeout? })`; the problem page passes `timeout: null` and lets the queue status end polling
3. `useJudge` — submit, queue position text, rank (同语言超过 x%) after Accepted, `resume()` for a submission still judging when the page opens; `onUpdate` / `onFinished` hooks update progress, reload my submissions, refresh the acceptance rate and trigger the companion reaction
4. Status enum: 0=等待中, 1=判题中, 2=已判完, 3=判题失败
5. Tests in `questionSubmitPolling.spec.ts` and `questionSubmit.spec.ts` pin this behavior

### Question Answer Visibility
The 题解 tab requires login; whether the user may see it (admin, or after an Accepted submission) is decided by the backend (`getQuestionSolution`), whose message is shown as-is when refused.

### Judge Case Architecture

`src/services/questionJudgeCase.ts` manages the structured judge case system (replacing the old flat JSON):

- **`getSupportedJudgeTypeOptions()`** — fetches supported judge value types from backend (cached), returns `JudgeTypeOption[]` with `{ value, text, category, dimensions, elementType }`
- **`createJudgeCaseConfigDraft(config, options)`** — normalizes a backend `JudgeCaseConfig` into a UI-friendly `JudgeCaseConfigDraft` with stable draft keys
- **`validateJudgeCaseConfig(config, options)`** — validates the entire config (unique parameter names, valid types, correct input counts, valid values), returns the first error message or `undefined`
- **`buildJudgeCaseConfig(config)`** — strips draft keys and builds the `JudgeCaseConfig` for submission
- Judge values support 0D scalars, 1D arrays, and 2D arrays based on `dimensions`; each type (BOOLEAN, INTEGER, LONG, DOUBLE, STRING) has its own default value and validation

Components: `JudgeValueEditor.vue` renders the full config editor (parameters + cases), `JudgeScalarInput.vue` renders individual scalar input fields.

### Question Progress Tracking

`useMyProgress` fetches `GET /question/progress/my` once per user: totals and solved counts per difficulty plus `statuses` (questionId → `passed` / `failed` / `judging`). State is module-level, so the list page, the list drawer and the problem page share it; the problem page calls `markStatus` as judging progresses instead of refetching. `services/questionProgress.ts` only keeps `getQuestionProgressState(submission)` and `formatAcceptanceRate`. Difficulty is read from tags in either spelling (`easy` / `简单`), see `utils/difficulty.ts` (mirrors the backend's `QuestionDifficultyEnum`).

### Arco Message

Only Arco's `message` is used: components import `@arco-design/web-vue/es/message`, and `main.ts` imports its CSS (`es/message/style/css.js`). No Arco components are registered.

### ResizeObserver Error Suppression

`main.ts` adds a global `window.addEventListener("error", ...)` to suppress benign "ResizeObserver loop completed with undelivered notifications" and "ResizeObserver loop limit exceeded" errors from Monaco Editor. These are harmless and noisy — they are stopped from propagating via `e.stopPropagation()`.

### API Client
- `openapi-typescript-codegen` generates static service classes (e.g., `QuestionControllerService.listQuestionByPageUsingPost`)
- All methods are static, return `{ code, data, message }` — check `res.code === 0` for success
- Do NOT edit generated files

### AI Companion（AI 陪练）

Backend contract: `docs/frontend/ai-companion.md` in the backend repo. `generated/` also contains `CompanionControllerService`, but the app calls these endpoints through `src/services/companion.ts` (axios) and `companionStream.ts` (fetch) — chat / solution are SSE streams the generated client can't consume.

- **State:** `useCompanion()` owns everything for the current question; ProblemView wraps it in `reactive()` and passes it to `CompanionPanel` as the `companion` prop (children call its methods instead of mutating it). Switching question or logging out resets it and aborts an in-flight stream.
- **Streaming:** chat / solution are `POST` + `text/event-stream`, so `EventSource` can't be used. Errors before the stream starts come back as plain JSON (check `Content-Type`); errors mid-stream arrive as an `error` event. Events: `thinking`, `delta`, `edits`, `done`, `error`.
- **Reactions:** when polling reaches a terminal status, ProblemView calls `companion.onJudged()`: an instant mood plays first, then `POST /companion/react` replaces it with the model-chosen mood and a bubble (idempotent per submission).
- **Conversations:** one question can have several conversations (each with its own memory and context usage); the session carries the current `conversationId`, and chat / hint / solution / compact send it. 「新对话」 is disabled while the current one is still empty; the header dropdown switches back to an earlier one. The hint level belongs to the question, not the conversation.
- **Hint level:** one concept for users — how much the companion may reveal. `hintSteps` is a single list (index = level) of track-neutral titles and descriptions; whether the user lacks an idea or has a bug is the model's call and is never shown. The composer toolbar has `HintLevelPicker` (L0–L4 via `PUT /level`, hover shows each level's description; 「看答案」 at the bottom, confirmed first) and 「给点提示」, which asks one hint at the current level without changing it. `direct` mode shows 「不设限」.
- **Ask about a selection:** `CodeEditor` emits `selection-change` (lines, text, position); ProblemView renders `SelectionAskBox` next to the selection. Its input (or Ctrl+I) sends a chat message with `quote: {startLine, endLine, code}`, opens the panel and clears the selection; quoted code shows above the user's message.
- **Pet:** drag to move (under 4px of movement counts as a click), drag the corner handle to resize (40–120px, double-click resets). It is teleported to `body` and positioned `fixed`; until moved it sits on the anchor span at the editor's top-right.
- **One duck:** ProblemView creates a single `usePetBehavior` and passes it to `CompanionPet` (`behavior` prop) and `CompanionPanel` (`duck` prop). While the panel is open the floating pet is hidden and the duck in the panel header (40px, `lively`) shows the same poses — thinking, typing out a reply, waiting for a verdict, reactions. Opening / closing the panel flies the duck between the two spots (`useDuckFlight` + `DuckFlight.vue`, 520ms arc; both ends are hidden while it flies, `land()` plays on arrival; skipped with reduced motion). `CompanionPanel.duckRect()` subtracts the panel's slide-in offset so the duck lands where it will end up.
- **Pet behavior** (`usePetBehavior`, tested in `usePetBehavior.spec.ts`): priority drag > short reactions (land, dizzy, wave, startled) > sleep > activity (`talking` while a reply streams, `judging` while a submission is pending) > companion mood (6s; `thinking` until changed) > watching you type (2s after the last key) > random idle action > idle. Pressing only shows the lifted pose after 180ms, so a click never flashes it. Fast shaking (>0.6s) makes it dizzy, a slow drag (>1.5s) makes it fly, release plays a squash landing. After 60s without mouse or keyboard it yawns, dozes and sleeps; moving the mouse 40px wakes it startled. Hover waves (at most every 6s). While dragged, `CompanionPet` swings it like a pendulum from the horizontal drag speed.
- **Code edits:** proposals are previewed in Monaco's diff editor (`CodeEditor` `previewCode` prop) with `CodeEditPreviewBar`; applying uses `replaceAll()` → `executeEdits`, so Ctrl+Z undoes it. If the code changed since the request, `resolveProposal` re-applies each edit by unique `oldText`; rewrites ask to overwrite.
- **Error codes:** 40020/40021 open the settings dialog; 42900 = another AI request in flight; see `describeCompanionError`.
- **nginx:** `/api/companion/` has its own location with `proxy_buffering off` and a 300s read timeout — without it SSE replies arrive all at once.

### Route Access Control

`src/access/accessEnum.ts` defines four roles: `NOT_LOGIN`, `USER`, `ADMIN`, `BAN`. The router guard (`src/access/index.ts`) runs `beforeEach`:
1. If `store.state.user.initialized` is false, dispatches `user/getLoginUser` (auto-login)
2. Checks `to.meta.access` against the user's role
3. Redirects unauthenticated users to `/user/login?redirect=...`
4. Redirects unauthorized users to `/noAuth`
5. `BAN` role users are blocked like `NOT_LOGIN`

### Route Lazy Loading

All page-level routes in `src/router/routes.ts` are dynamic imports, so each page is its own chunk (Rollup names chunks after the file, e.g. `js/ProblemView.<hash>.js`):

```typescript
const ProblemView = () => import("@/views/problem/ProblemView.vue");
```

## Build & Deployment

### Build Optimization
- `vite.config.mts` has a small plugin that writes `.gz` next to every JS/CSS/HTML/SVG file over 8KB (kept only when it saves at least 20%), for nginx's `gzip_static`
- Output names are `js/[name].[hash].js` and `assets/[name].[hash][ext]` with an 8-character hex hash (`hashCharacters: "hex"`, also for workers) — this is what nginx's immutable-cache rule `\.[0-9a-f]{8}\.` matches, so keep them in sync
- `monaco.ts` imports `editor.api` plus only the `coreCommands` and `find` features and the 6 languages; JavaScript / TypeScript use Monaco's TypeScript worker, everything else the editor worker (`?worker` imports). Importing `monaco-editor` directly would pull in every language and feature
- Monaco Editor is lazy-loaded via `defineAsyncComponent` in ProblemView; MdViewer and CodeBlock are lazy-loaded too

### Docker & Nginx Configuration

This repo only ships `deploy/oj-frontend/`. The compose file that runs MySQL, the backend and this nginx lives in the backend repository (its `deploy/docker-compose.yml`, secrets from its `deploy/.env`). At deploy time this directory is placed under the backend's `deploy/`, and the `my-oj-frontend` nginx container (ports 80/443, healthcheck on `/healthz`) mounts `nginx.conf`, `dist/`, `certs/` and `acme-challenge/` from it. Do not add a compose file or any credentials to this repo.

- `deploy/oj-frontend/nginx.conf` — nginx config with `gzip_static on`, immutable cache headers for hashed assets, `/api/` proxy to backend (`my-oj-backend:8101` upstream), and SPA `try_files` fallback
- `deploy/oj-frontend/dist/` — production build output (`vite.config.mts` `build.outDir`, gitignored), mounted read-only into the nginx container
