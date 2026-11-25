# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run serve              # Start dev server (vue-cli-service serve, port 8080)
npm run build              # Production build (sourcemaps disabled, outputs to deploy/oj-frontend/dist)
npm run lint:fix           # Lint and auto-fix (shorthand for lint -- --fix)
npm run format             # Prettier format all src/**/*.{ts,vue,css}
npm run test:unit          # Jest unit tests (tests/unit/*.spec.ts, @vue/cli-plugin-unit-jest)
npm run generate:api       # Regenerate API client from backend OpenAPI spec (requires backend running on :8102)
```

- **Unit tests exist** in `tests/unit/`: `questionSubmit.spec.ts` (judge-info adaptation), `questionSubmitPolling.spec.ts` (poller, uses fake timers), `questionJudgeCase.spec.ts` (judge case service), `questionJudgeConfig.spec.ts` (judge config normalization), `questionProgress.spec.ts` (progress state), `questionStarterCode.spec.ts` (language options + starter code), `questionDraft.spec.ts` (draft management), `useTheme.spec.ts`, `companionStream.spec.ts` (SSE parsing + stream errors), `codeEditProposal.spec.ts` (applying AI code edits), `useCompanion.spec.ts` (companion state, services mocked), `petPlacement.spec.ts` (pet position/size clamping + storage parsing), `editorSelection.spec.ts` (selected line range), `apiConfig.spec.ts`, `apiId.spec.ts`, `checkAccess.spec.ts`, `userSummary.spec.ts`, `userRole.spec.ts`. Run one file via `npm run test:unit tests/unit/<file>.spec.ts`.
- The dev server proxies `/api` to `http://localhost:8102` (configured in `vue.config.js`).
- If the dev server shows stale results, kill `node` processes and restart `npm run serve`.
- ESLint cache can cause stale lint errors — clear `node_modules/.cache/eslint/` if needed.

## Package Manager

npm only: `package-lock.json` is the lockfile (`npm ci` to install). Do not add a `yarn.lock` — Vue CLI sees it and refuses to start `serve` when yarn is not installed.

## Tech Stack

- **Framework:** Vue 3 (Composition API, `<script setup lang="ts">`)
- **Build:** Vue CLI 5 + Babel + TypeScript ~4.5
- **UI Library:** Arco Design Vue (`@arco-design/web-vue`) — heavily overridden with Claude Design tokens
- **State:** Vuex 4 (namespaced `user` module)
- **Router:** Vue Router 4 (`createWebHistory`)
- **HTTP:** Axios (`withCredentials: true`, interceptors in `src/plugins/axios.ts`)
- **Editor:** Monaco Editor via `monaco-editor-webpack-plugin` (java, javascript, typescript, python, cpp, go)
- **Markdown:** ByteMD (`@bytemd/vue-next`) with plugin-gfm and plugin-highlight
- **Syntax highlighting:** `highlight.js` (direct dependency) — used by `CodeBlock.vue` and by ByteMD's plugin-highlight via the `atom-one-dark` theme
- **Codegen:** `openapi-typescript-codegen` generates API client from OpenAPI spec into `generated/`
- **Tests:** Jest 27 via `@vue/cli-plugin-unit-jest` (vue3-jest + ts-jest)

## Project Structure

```
src/
├── access/               # Route-level permission guard
│   ├── accessEnum.ts     # NOT_LOGIN / USER / ADMIN / BAN roles
│   ├── checkAccess.ts    # Permission check logic
│   └── index.ts          # Vue Router beforeEach guard (auto-login, route auth)
├── components/
│   ├── common/
│   │   └── ConfirmDialog.vue    # Reusable confirmation modal
│   ├── companion/               # AI 陪练（see "AI Companion" below）
│   │   ├── CompanionAvatar.vue      # Chestnut SVG face, one expression per mood
│   │   ├── CompanionPet.vue         # Draggable / resizable pet (teleported to body) + speech bubble + mood animations
│   │   ├── CompanionPanel.vue       # Right-side panel: header (new / earlier conversations), messages, composer + toolbar
│   │   ├── ContextUsageRing.vue     # Composer toolbar: context usage ring, popover with "现在整理"
│   │   ├── HintLevelPicker.vue      # Composer toolbar: hint level L0–L4 (hover shows what each level reveals) + 看答案
│   │   ├── ConversationMenu.vue     # Header dropdown listing this question's conversations
│   │   ├── SelectionAskBox.vue      # "问栗子" pill + inline input that follows the editor selection
│   │   ├── CompanionMessageItem.vue # One message (markdown, badges, quoted code, thinking, "查看代码修改")
│   │   ├── CodeEditPreviewBar.vue   # Apply / reject bar shown above the editor while previewing edits
│   │   └── AiSettingDialog.vue      # BYOK DeepSeek key, model, hint mode
│   ├── editor/
│   │   ├── CodeBlock.vue        # Read-only syntax-highlighted code display (highlight.js, 6 registered languages)
│   │   ├── CodeEditor.vue       # Monaco Editor wrapper (format/getCursorInfo/collapseSelection/replaceAll via defineExpose, onFormat callback, Ctrl+Alt+L, previewCode → read-only diff editor, emits selection-change / ask-selection (Ctrl+I))
│   │   ├── MdEditor.vue         # ByteMD editor (for question content/answer editing)
│   │   └── MdViewer.vue         # ByteMD viewer (read-only markdown rendering, imports atom-one-dark hljs theme, lazy-loaded in QuestionsView)
│   ├── layout/
│   │   └── GlobalHeader.vue     # Top nav: logo + links + user avatar + theme toggle + user info popover
│   ├── question/
│   │   ├── JudgeScalarInput.vue            # Scalar value input for judge cases
│   │   ├── JudgeValueEditor.vue            # Structured judge value editor (supports 0D/1D/2D arrays)
│   │   ├── QuestionAdminDetailsPanel.vue   # Admin-only question details panel (author, create time)
│   │   └── SubmissionDiagnosticPanel.vue   # Judge result display with diagnostics + submission code
│   └── user/
│       ├── AuthShell.vue        # Shared login/register layout wrapper
│       ├── AvatarPicker.vue     # Avatar selection grid (DiceBear avatars)
│       ├── UserAvatar.vue       # Avatar display (DiceBear or custom URL)
│       ├── UserFormDialog.vue   # Create/edit user dialog
│       └── UserIdentity.vue     # Role badge display
├── composables/
│   ├── useCompanion.ts   # Per-question AI companion state (session, conversations, messages, streaming, edit preview, pet mood)
│   ├── usePetPlacement.ts # Pet position + size shared across remounts, persisted in localStorage["myoj:companion-pet"]
│   ├── useDismissable.ts # Close a popover on outside pointerdown / Esc
│   └── useTheme.ts       # Dark/light theme toggle (data-theme on <html>, arco-theme on <body>, localStorage "myoj-theme")
├── constants/
│   ├── companionMoods.ts # Mood labels + instant mood shown before the reaction API returns
│   ├── quotes.ts         # Footer cycling quotes
│   └── userAvatars.ts    # DiceBear avatar URL generators (by seed)
├── layouts/
│   ├── BasicLayout.vue   # Main layout: height:100vh fixed viewport, sticky header, footer with cycling quotes
│   └── UserLayout.vue    # Minimal layout for login/register
├── plugins/
│   └── axios.ts          # Axios config (credentials, interceptors, unauthorized redirect handler)
├── router/
│   ├── index.ts          # Router instance
│   └── routes.ts         # Route definitions with access meta
├── services/
│   ├── apiId.ts                   # ApiId type (string|number), route param parsing, generated ID casting
│   ├── codeEditProposal.ts        # Resolve AI code-edit proposals against the current code (hash check, per-edit fallback)
│   ├── companion.ts               # AI companion + AI setting types and JSON APIs (axios, not generated)
│   ├── companionStream.ts         # SSE parser + fetch-based streaming for chat / solution
│   ├── questionDraft.ts           # localStorage-based code drafts (per user+question+language, 7-day TTL)
│   ├── questionJudgeCase.ts       # Judge case config types, normalization, validation, build for submission
│   ├── questionJudgeConfig.ts     # normalizeJudgeConfig — handles JudgeConfig | string | null input
│   ├── questionProgress.ts        # Per-user question progress cache (unattempted/judging/passed/failed); formatAcceptanceRate
│   ├── questionStarterCode.ts     # Language options normalization, starter code fetching/validation
│   ├── questionSubmit.ts          # normalizeJudgeInfo, getJudgeResultPresentation, listMyQuestionSubmissions
│   ├── questionSubmitPolling.ts   # createQuestionSubmitPoller (poll/cancel/timeout)
│   └── userSummary.ts             # Cached user info fetches (getUserSummary, clear cache)
├── utils/
│   ├── dateTime.ts                # formatDateTime helper
│   ├── editorSelection.ts         # EditorSelection type (lines, text, position in the editor) + selectedLineRange
│   └── userRole.ts                # formatUserRole (role string → display label)
├── store/
│   ├── index.ts          # Vuex store
│   └── user.ts           # User state (loginUser, initialized), getLoginUser action, draft-clearing mutations
├── styles/
│   └── global.css        # Claude Design System tokens + Arco overrides + dark theme (imported in main.ts)
├── views/
│   ├── question/
│   │   ├── QuestionsView.vue         # Main workspace: sidebar + embedded editor + polling
│   │   ├── AddQuestionView.vue       # Create/edit form (judge config, test cases, side-by-side editors)
│   │   ├── ManageQuestionView.vue    # Admin CRUD table in card
│   │   └── QuestionSubmitView.vue    # Submission history list with filters in card
│   ├── user/
│   │   ├── UserLoginView.vue         # Login form
│   │   ├── UserRegisterView.vue      # Register form
│   │   ├── UserProfileView.vue       # User profile page
│   │   └── UserManageView.vue        # Admin user management table
│   └── NoAuthView.vue                # 403 page (route /noAuth)
├── App.vue              # Thin shell: route-based layout switching (UserLayout for /user/*) + useTheme() init
└── main.ts              # Bootstrap: ArcoVue (tree-shaken, per-component imports) + router + store + axios + access guard + global.css

generated/               # Auto-generated API client — DO NOT EDIT
└── services/            # e.g. QuestionControllerService, UserControllerService
```

## Design System (Claude-inspired)

All CSS custom properties and Arco overrides live in `src/styles/global.css` (imported in `main.ts`) — not in `App.vue`, which is only a thin shell. Key tokens:

- **Canvas:** `#faf9f5` cream, **Primary:** `#cc785c` coral, **Dark:** `#181715` navy
- **Fonts:** Cormorant Garamond (serif, for page titles h1/h2), Inter (sans, for body and section titles h3/h4), JetBrains Mono (code)
- **Spacing:** `--space-xs` (8px) through `--space-xxl` (48px)
- **Radii:** `--radius-sm` (6px) through `--radius-pill` (9999px)

Typography utility classes: `.claude-title-lg` (22px), `.claude-title-md` (18px), `.claude-title-sm` (16px), `.claude-body` (16px), `.claude-body-sm` (14px), `.claude-caption` (13px/500), `.claude-caption-up` (12px/500/uppercase/1.5px tracking).

### Dark Theme

`global.css` defines `:root[data-theme="dark"]` overrides for every token. The `useTheme` composable (`src/composables/useTheme.ts`) toggles it: sets `data-theme` + `color-scheme` on `<html>`, sets/removes `arco-theme="dark"` on `<body>` (Arco's dark mode), and persists the choice in `localStorage["myoj-theme"]`. Toggle button lives in GlobalHeader; `App.vue` calls `useTheme()` once at startup.

### Arco Design CSS Override Patterns

Overrides live in `src/styles/global.css` (unscoped, `!important`-heavy). Key patterns:

- **Table header:** `.arco-table-th` uses `--surface-soft` background, uppercase 12px/600, with `--muted` color
- **Table body:** `.arco-table-td` transparent background on `--canvas` card; first column gets `--ink` color + 500 weight
- **Inputs:** Apply border/background to `.arco-input-inner-wrapper`; inner `.arco-input` is `background: transparent; border: none`
- **Form grid:** Override `.arco-form-item-label-col` to `flex: 0 0 auto; width: auto` and `.arco-form-item-wrapper-col` to `flex: 1` (break the default arco-col-5/19 grid)
- **Input-tag:** Set `.arco-input-tag { height: 40px; display: flex; align-items: center }`, hide `.arco-input-tag-mirror`, make inner/flex/input `flex: 1; width: 100%`
- **Labels:** Use `.arco-form-item-label { font-size: 13px; font-weight: 500 }` (caption token)

### Page Card Pattern

ManageQuestionView and QuestionSubmitView use a card wrapper around tables:
```css
.page-card {
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
}
.page-card::before {
  /* Coral accent line at top */
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--primary);
  opacity: 0.3;
}
```

### Footer Cycling Quotes & ICP 备案号

BasicLayout.vue has a footer that cycles through 50 inspirational quotes every 60 seconds. Uses Vue `<Transition>` for fade effect. Quote in Cormorant Garamond italic, author in Inter 10px uppercase. Layout is flex row with quote text wrapping freely.

Below the quotes, the footer must always display the ICP 备案号 **渝ICP备2026019190号**, centered, linked to `http://beian.miit.gov.cn/` (`.footer-beian` / `.beian-link` in BasicLayout.vue). Since BasicLayout is shared, it appears on all main pages.

### Vue Scoped CSS Limitation

The `:has()` selector does NOT work across Vue scoped component boundaries, because scoped CSS adds `data-v-xxx` attributes to elements. Use `:deep()` for penetrating component boundaries in scoped CSS.

### Monaco Editor ResizeObserver Loop

Monaco Editor uses ResizeObserver internally. When placed in a flex layout that changes size (e.g., results panel appearing), it can trigger "ResizeObserver loop completed with undelivered notifications" errors. Fix in `QuestionsView.vue`:
```css
.editor-body :deep(#code-editor) {
  height: 100% !important;
  min-height: 200px !important;
  width: 100% !important;
  overflow: hidden !important;
  contain: strict !important;
}
```
`contain: strict` prevents Monaco's internal content changes from affecting the container size, breaking the ResizeObserver loop.

## Key Architecture Patterns

### Layout Height Constraint Chain

The layout uses `height: 100vh` (not `min-height: 100vh`) on `#basicLayout` and `.layout-wrapper` to lock viewport height. The chain flows through:
```
.layout-wrapper (height: 100vh, flex column)
  → .content (flex: 1, overflow-y: auto)
    → .router-wrap (flex: 1, flex column, min-height: 0)  [wrapper div around router-view]
      → #questionsView (flex: 1) properly constrained
```
The `.router-wrap` div in BasicLayout.vue is required because `<router-view>` may not render as a DOM element, breaking the flex chain. Without this, `.description-panel` with `flex: 4; overflow-y: auto` won't be height-constrained and will grow with content.

### Page-Level Scrolling
The "题库" page (QuestionsView) uses internal scroll areas (description panel scrolls, problem list scrolls) — the page itself does NOT scroll. Other pages (AddQuestionView, ManageQuestionView, QuestionSubmitView) scroll normally via `.content`'s `overflow-y: auto`.

### Workspace Layout (QuestionsView)
The main "题库" page uses a sidebar + embedded editor pattern (no page navigation, click loads in right panel):
- Sidebar (300px): search input, difficulty filter chips (全部/简单/中等/困难), scrollable problem list, pagination always visible
- Main content: description panel (`flex: 4`, scrollable) + Monaco CodeEditor (`flex: 6`, fixed) + results panel (absolutely positioned, doesn't affect flex flow)
- Backend API: `listQuestionVoByPageUsingPost` (supports `title` and `tags` filter params, where `tags` uses English values: `["easy"]`, `["medium"]`, `["hard"]`)

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

Save behavior in `QuestionsView.vue` (do not re-implement elsewhere):
- Editing triggers a **300ms debounce** (`scheduleDraftSave` → `persistCurrentDraft`) — NOT a periodic timer; drafts are written only after the user stops typing for 300ms
- `persistCurrentDraft` deletes the draft when the code equals the starter template (template state = no draft), otherwise saves it
- Component unmount also calls `persistCurrentDraft()` synchronously as a safety net

### Code Highlighting

- **`CodeBlock.vue`** (`src/components/editor/`) — read-only code display with highlight.js: registers only the 6 supported languages (java, javascript, typescript, python, cpp, go) + aliases (`c++`→cpp, `golang`→go, `js`, `ts`); falls back to `highlightAuto` for unknown languages. Props: `code`, `language`. Token colors are hand-written atom-one-dark style rules embedded in the component (no external theme CSS), background uses `--surface-dark`
- **`MdViewer.vue`** — imports `highlight.js/styles/atom-one-dark.css` because `@bytemd/plugin-highlight` only applies hljs token spans to the DOM and ships **no CSS**. Code blocks sit on `--surface-dark` in both themes, so `.markdown-body pre code` sets the plain-text color to the atom-one-dark base `#abb2bf` (same as `CodeBlock.vue`); without it the inline-code `--ink` color leaks in and plain text turns near-black on dark in the light theme. Token spans keep their own hljs colors — just don't put a color on the token spans themselves
- Used in `SubmissionDiagnosticPanel.vue` (browse submissions expand rows/mobile details) and QuestionsView's my-submission detail panel; 题解 (solution) tab gets highlighting for free via ByteMD's plugin

### Code Editor Formatting

`CodeEditor.vue` exposes `format()` via `defineExpose` and calls the `onFormat` prop callback afterwards (QuestionsView uses it to show "已格式化" button feedback):
- **Shortcut:** Ctrl+Alt+L, registered via `editor.addCommand` — both button and shortcut go through the same `format()`
- **Supported languages:** Monaco has built-in formatting providers only for `javascript`/`typescript` (the standalone build never sets the `editorHasDocumentFormattingProvider` context key, so `action.isSupported()` is unreliable — a `FORMATTABLE_LANGUAGES` whitelist is used instead). For other languages, a hint "暂不支持 xxx 格式化" fades in/out over the editor (2.2s, `<Transition>`), and `onFormat` is NOT called
- If you add formatting for other languages, update the whitelist or register a real `DocumentFormattingEditProvider`

### Code Submission & Polling
Polling logic lives in `src/services/` — do not re-implement inline in views:
1. `questionSubmit.ts` — `requestQuestionSubmit(submitId)` wraps `getQuestionSubmitByIdUsingGet` with a 10s per-request timeout + cancellation; `normalizeQuestionSubmit`/`normalizeJudgeInfo` parse the judgeInfo JSON string (falling back to raw text when it isn't JSON); `getJudgeResultPresentation` maps submissions to `{ label, message, tone }` for the UI — status 2 is only "通过" when the message is exactly `Accepted`, never inferred from status alone
2. `questionSubmitPolling.ts` — `createQuestionSubmitPoller({ request, onUpdate, onTimeout, interval?, timeout? })` polls every 3s by default with a **75s overall timeout** (deliberately covers the backend's 60s sandbox limit); stops on `!isJudging(status)` (statuses 0 and 1 = judging) or timeout; `stop()` cancels the in-flight request
3. Status enum: 0=等待中, 1=判题中, 2=已判完, 3=判题失败
4. Tests in `tests/unit/questionSubmitPolling.spec.ts` and `questionSubmit.spec.ts` pin this behavior — update them when touching these services
5. Judge message titles ("Accepted", "Wrong Answer", …) are color-coded by `tone` class: `passed` → `--success` (green), `failed` → `--error` (red), `pending` → `--accent-amber` — in `SubmissionDiagnosticPanel.vue` (`.diagnostic-content strong`) and QuestionsView (`.submission-diagnostic strong`)

### Question Answer Visibility
- Admins always see answers
- Normal users see answers only after an "Accepted" submission on that question
- Implemented in QuestionsView.vue's `canViewAnswer` computed, which queries submission history for `judgeInfo.message === "Accepted"`

### Judge Case Architecture

`src/services/questionJudgeCase.ts` manages the structured judge case system (replacing the old flat JSON):

- **`getSupportedJudgeTypeOptions()`** — fetches supported judge value types from backend (cached), returns `JudgeTypeOption[]` with `{ value, text, category, dimensions, elementType }`
- **`createJudgeCaseConfigDraft(config, options)`** — normalizes a backend `JudgeCaseConfig` into a UI-friendly `JudgeCaseConfigDraft` with stable draft keys
- **`validateJudgeCaseConfig(config, options)`** — validates the entire config (unique parameter names, valid types, correct input counts, valid values), returns the first error message or `undefined`
- **`buildJudgeCaseConfig(config)`** — strips draft keys and builds the `JudgeCaseConfig` for submission
- Judge values support 0D scalars, 1D arrays, and 2D arrays based on `dimensions`; each type (BOOLEAN, INTEGER, LONG, DOUBLE, STRING) has its own default value and validation

Components: `JudgeValueEditor.vue` renders the full config editor (parameters + cases), `JudgeScalarInput.vue` renders individual scalar input fields.

### Question Progress Tracking

`src/services/questionProgress.ts` provides per-user question progress:
- **`getMyQuestionProgress(userId, questionId)`** — fetches latest submission and returns `QuestionProgressState` (`unattempted` | `judging` | `passed` | `failed`), with in-memory cache
- **`setMyQuestionProgress(userId, questionId, submission)`** — manually updates the cache (used after polling completes)
- **`formatAcceptanceRate(accepted, submitted)`** — formats a percentage string for display

### ArcoVue On-Demand Import

`main.ts` imports ArcoVue components individually (not full `ArcoVue` plugin). Only 18 components are registered: `Button, Col, Form, FormItem, Input, InputNumber, InputPassword, InputTag, Layout, LayoutContent, LayoutFooter, LayoutHeader, Option, Pagination, Row, Select, Switch, Table`. Each component's CSS is imported separately via `@arco-design/web-vue/es/<component>/style/css.js`.

### ResizeObserver Error Suppression

`main.ts` adds a global `window.addEventListener("error", ...)` to suppress benign "ResizeObserver loop completed with undelivered notifications" and "ResizeObserver loop limit exceeded" errors from Monaco Editor. These are harmless and noisy — they are stopped from propagating via `e.stopPropagation()`.

### API Client
- `openapi-typescript-codegen` generates static service classes (e.g., `QuestionControllerService.listQuestionByPageUsingPost`)
- All methods are static, return `{ code, data, message }` — check `res.code === 0` for success
- Do NOT edit generated files

### AI Companion（AI 陪练）

Backend contract: `docs/frontend/ai-companion.md` in the backend repo. These endpoints are not in `generated/`; they are called through `src/services/companion.ts` (axios) and `companionStream.ts` (fetch).

- **State:** `useCompanion()` owns everything for the current question; QuestionsView wraps it in `reactive()` and passes it to `CompanionPanel` as the `companion` prop (children call its methods instead of mutating it). Switching question or logging out resets it and aborts an in-flight stream.
- **Streaming:** chat / solution are `POST` + `text/event-stream`, so `EventSource` can't be used. Errors before the stream starts come back as plain JSON (check `Content-Type`); errors mid-stream arrive as an `error` event. Events: `thinking`, `delta`, `edits`, `done`, `error`.
- **Reactions:** when polling reaches a terminal status, QuestionsView calls `companion.onJudged()`: an instant mood plays first, then `POST /companion/react` replaces it with the model-chosen mood and a bubble (idempotent per submission).
- **Conversations:** one question can have several conversations (each with its own memory and context usage); the session carries the current `conversationId`, and chat / hint / solution / compact send it. 「新对话」 is disabled while the current one is still empty; the header dropdown switches back to an earlier one. The hint level belongs to the question, not the conversation.
- **Hint level:** one concept for users — how much the companion may reveal. `hintSteps` is a single list (index = level) of track-neutral titles and descriptions; whether the user lacks an idea or has a bug is the model's call and is never shown. The composer toolbar has `HintLevelPicker` (L0–L4 via `PUT /level`, hover shows each level's description; 「看答案」 at the bottom, confirmed first) and 「给点提示」, which asks one hint at the current level without changing it. `direct` mode shows 「不设限」.
- **Ask about a selection:** `CodeEditor` emits `selection-change` (lines, text, position); QuestionsView renders `SelectionAskBox` next to the selection. Its input (or Ctrl+I) sends a chat message with `quote: {startLine, endLine, code}`, opens the panel and clears the selection; quoted code shows above the user's message.
- **Pet:** drag to move (under 4px of movement counts as a click), drag the corner handle to resize (40–120px, double-click resets). It is teleported to `body` and positioned `fixed`; until moved it sits on the anchor span at the editor's top-right.
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

All page-level routes use dynamic imports with webpack chunk names for code splitting:

```typescript
const QuestionsView = () =>
  import(/* webpackChunkName: "page-questions" */ "@/views/question/QuestionsView.vue");
```

Named chunks: `page-auth` (login/register), `page-questions`, `page-question-editor`, `page-question-manage`, `page-submissions`, `page-user-manage`, `page-user-profile`, `page-no-auth`.

## Build & Deployment

### Build Optimization
- `compression-webpack-plugin` generates `.gz` files for all JS/CSS/HTML/SVG during build
- `image-webpack-loader` compresses images (mozjpeg quality 65, pngquant 0.65-0.9) during build
- `vue.config.js` splits node_modules into 4 chunks: `chunk-vue` (Vue core), `chunk-arco` (Arco Design), `chunk-vendors` (rest), `chunk-common` (shared); prefetch/preload are disabled
- Monaco is configured with only `["coreCommands", "find"]` features (plus the 6 languages listed above)
- Monaco Editor is lazy-loaded via `defineAsyncComponent` in QuestionsView; MdViewer is lazy-loaded too

### Docker & Nginx Configuration

This repo only ships `deploy/oj-frontend/`. The compose file that runs MySQL, the backend and this nginx lives in the backend repository (its `deploy/docker-compose.yml`, secrets from its `deploy/.env`). At deploy time this directory is placed under the backend's `deploy/`, and the `my-oj-frontend` nginx container (ports 80/443, healthcheck on `/healthz`) mounts `nginx.conf`, `dist/`, `certs/` and `acme-challenge/` from it. Do not add a compose file or any credentials to this repo.

- `deploy/oj-frontend/nginx.conf` — nginx config with `gzip_static on`, immutable cache headers for hashed assets, `/api/` proxy to backend (`my-oj-backend:8101` upstream), and SPA `try_files` fallback
- `deploy/oj-frontend/dist/` — production build output (`vue.config.js` `outputDir`, gitignored), mounted read-only into the nginx container
