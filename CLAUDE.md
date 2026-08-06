# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run serve              # Start dev server (vue-cli-service serve, port 8080)
npm run build              # Production build (sourcemaps disabled)
npm run lint -- --fix      # Lint and auto-fix (use this instead of npx prettier --write)
npm run test:unit          # Jest unit tests (tests/unit/*.spec.ts, @vue/cli-plugin-unit-jest)
```

- **Unit tests exist** in `tests/unit/`: `questionSubmit.spec.ts` (judge-info adaptation), `questionSubmitPolling.spec.ts` (poller, uses fake timers), `useTheme.spec.ts`. Run one file via `npm run test:unit tests/unit/<file>.spec.ts`.
- **Regenerate the API client** from the backend OpenAPI spec (from README): `openapi --input http://localhost:8102/api/v3/api-docs --output ./generated --client axios`
- The dev server proxies `/api` to `http://localhost:8102` (configured in `vue.config.js`).
- If the dev server shows stale results, kill `node` processes and restart `npm run serve`.
- ESLint cache can cause stale lint errors — clear `node_modules/.cache/eslint/` if needed.

## Tech Stack

- **Framework:** Vue 3 (Composition API, `<script setup lang="ts">`)
- **Build:** Vue CLI 5 + Babel + TypeScript ~4.5
- **UI Library:** Arco Design Vue (`@arco-design/web-vue`) — heavily overridden with Claude Design tokens
- **State:** Vuex 4 (namespaced `user` module)
- **Router:** Vue Router 4 (`createWebHistory`)
- **HTTP:** Axios (`withCredentials: true`, interceptors in `src/plugins/axios.ts`)
- **Editor:** Monaco Editor via `monaco-editor-webpack-plugin` (java, javascript, typescript, python, cpp)
- **Markdown:** ByteMD (`@bytemd/vue-next`) with plugin-gfm and plugin-highlight
- **Codegen:** `openapi-typescript-codegen` generates API client from OpenAPI spec into `generated/`
- **Tests:** Jest 27 via `@vue/cli-plugin-unit-jest` (vue3-jest + ts-jest)

## Project Structure

```
src/
├── access/               # Route-level permission guard
│   ├── accessEnum.ts     # NOT_LOGIN / USER / ADMIN roles
│   ├── checkAccess.ts    # Permission check logic
│   └── index.ts          # Vue Router beforeEach guard (auto-login, route auth)
├── components/
│   ├── editor/
│   │   ├── CodeEditor.vue  # Monaco Editor wrapper (do not modify)
│   │   ├── MdEditor.vue    # ByteMD editor (for question content/answer editing)
│   │   └── MdViewer.vue    # ByteMD viewer (read-only markdown rendering)
│   └── layout/
│       └── GlobalHeader.vue  # Top nav: logo + links + user avatar + theme toggle + switch-account
├── composables/
│   └── useTheme.ts       # Dark/light theme toggle (data-theme on <html>, arco-theme on <body>, localStorage "myoj-theme")
├── constants/
│   ├── quotes.ts         # Footer cycling quotes
│   └── languages.ts      # Code editor language options
├── layouts/
│   ├── BasicLayout.vue   # Main layout: height:100vh fixed viewport, sticky header, footer with cycling quotes
│   └── UserLayout.vue    # Minimal layout for login/register
├── plugins/
│   └── axios.ts          # Axios config (credentials, interceptors)
├── router/
│   ├── index.ts          # Router instance
│   └── routes.ts         # Route definitions with access meta
├── services/
│   ├── questionSubmit.ts          # Judge-info adaptation (normalizeJudgeInfo, getJudgeResultPresentation) + submission request wrapper
│   └── questionSubmitPolling.ts   # createQuestionSubmitPoller (poll/cancel/timeout)
├── store/
│   ├── index.ts          # Vuex store
│   └── user.ts           # User state (loginUser), getLoginUser action
├── styles/
│   └── global.css        # Claude Design System tokens + Arco overrides + dark theme (imported in main.ts)
├── views/
│   ├── question/
│   │   ├── QuestionsView.vue         # Main workspace: sidebar + embedded editor + polling
│   │   ├── AddQuestionView.vue       # Create/edit form (judge config, test cases, side-by-side editors)
│   │   ├── ManageQuestionView.vue    # Admin CRUD table in card
│   │   └── QuestionSubmitView.vue    # Submission history list with filters in card
│   ├── NoAuthView.vue               # 403 page (route /noAuth)
│   └── user/
│       ├── UserLoginView.vue         # Login form
│       └── UserRegisterView.vue      # Register form
├── App.vue              # Thin shell: route-based layout switching (UserLayout for /user/*) + useTheme() init
└── main.ts              # Bootstrap: ArcoVue + router + store + axios + access guard + global.css

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

### Footer Cycling Quotes

BasicLayout.vue has a footer that cycles through 50 inspirational quotes every 60 seconds. Uses Vue `<Transition>` for fade effect. Quote in Cormorant Garamond italic, author in Inter 10px uppercase. Layout is flex row with quote text wrapping freely.

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

### Code Submission & Polling
Polling logic lives in `src/services/` — do not re-implement inline in views:
1. `questionSubmit.ts` — `requestQuestionSubmit(submitId)` wraps `getQuestionSubmitByIdUsingGet` with a 10s per-request timeout + cancellation; `normalizeQuestionSubmit`/`normalizeJudgeInfo` parse the judgeInfo JSON string (falling back to raw text when it isn't JSON); `getJudgeResultPresentation` maps submissions to `{ label, message, tone }` for the UI — status 2 is only "通过" when the message is exactly `Accepted`, never inferred from status alone
2. `questionSubmitPolling.ts` — `createQuestionSubmitPoller({ request, onUpdate, onTimeout, interval?, timeout? })` polls every 3s by default with a **75s overall timeout** (deliberately covers the backend's 60s sandbox limit); stops on `!isJudging(status)` (statuses 0 and 1 = judging) or timeout; `stop()` cancels the in-flight request
3. Status enum: 0=等待中, 1=判题中, 2=已判完, 3=判题失败
4. Tests in `tests/unit/questionSubmitPolling.spec.ts` and `questionSubmit.spec.ts` pin this behavior — update them when touching these services

### Question Answer Visibility
- Admins always see answers
- Normal users see answers only after an "Accepted" submission on that question
- Implemented in QuestionsView.vue's `canViewAnswer` computed, which queries submission history for `judgeInfo.message === "Accepted"`

### API Client
- `openapi-typescript-codegen` generates static service classes (e.g., `QuestionControllerService.listQuestionByPageUsingPost`)
- All methods are static, return `{ code, data, message }` — check `res.code === 0` for success
- Do NOT edit generated files

### GlobalHeader Mock Login
In `GlobalHeader.vue`, there's a 3-second `setTimeout` that dispatches a mock admin user to `store.dispatch("user/getLoginUser", ...)`. This is a development convenience — the real login flow goes through `UserLoginView.vue` which calls the backend.

## Build & Deployment

### Build Optimization
- `compression-webpack-plugin` generates `.gz` files for all JS/CSS/HTML/SVG during build
- `vue.config.js` splits node_modules into 4 chunks: `chunk-vue` (Vue core), `chunk-arco` (Arco Design), `chunk-vendors` (rest), `chunk-common` (shared); prefetch/preload are disabled
- Monaco is configured with only `["coreCommands", "find"]` features (plus the 5 languages listed above)
- Monaco Editor is lazy-loaded via `defineAsyncComponent` in QuestionsView
- `moment.js` was removed — use native `formatTime()` helper for date formatting instead

### Nginx Configuration
- The full config lives in `nginx.conf` at the repo root; `docker-compose.yml` mounts it (plus `dist/`) into an nginx:1.20.2 container on port 80
- Use `gzip_static on` alongside `gzip on` to serve pre-built `.gz` files
- Nginx reverse-proxies `/api/` to the backend service (port 8101 in Docker, 8102 in dev)
- SPA fallback via `try_files $uri $uri/ /index.html;` for `createWebHistory` mode
