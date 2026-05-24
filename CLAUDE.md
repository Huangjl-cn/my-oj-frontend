# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run serve              # Start dev server (vue-cli-service serve, port 8080)
npm run build              # Production build (sourcemaps disabled)
npm run lint -- --fix      # Lint and auto-fix (use this instead of npx prettier --write)
```

- **No test runner** is configured. Do not attempt to run tests.
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

## Project Structure

```
src/
├── access/               # Route-level permission guard
│   ├── accessEnum.ts     # NOT_LOGIN / USER / ADMIN roles
│   ├── checkAccess.ts    # Permission check logic
│   └── index.ts          # Vue Router beforeEach guard (auto-login, route auth)
├── components/
│   ├── CodeEditor.vue    # Monaco Editor wrapper (do not modify)
│   ├── GlobalHeader.vue  # Top nav: logo + links + user avatar + switch-account
│   ├── MdEditor.vue      # ByteMD editor (for question content/answer editing)
│   └── MdViewer.vue      # ByteMD viewer (read-only markdown rendering)
├── layouts/
│   ├── BasicLayout.vue   # Main layout: height:100vh fixed viewport, sticky header, footer with cycling quotes
│   └── UserLayout.vue    # Minimal layout for login/register
├── plugins/
│   └── axios.ts          # Axios config (credentials, interceptors)
├── router/
│   ├── index.ts          # Router instance
│   └── routes.ts         # Route definitions with access meta
├── store/
│   ├── index.ts          # Vuex store
│   └── user.ts           # User state (loginUser), getLoginUser action
├── views/
│   ├── question/
│   │   ├── QuestionsView.vue         # Main workspace: sidebar + embedded editor + polling
│   │   ├── ViewQuestionView.vue      # Standalone coding page (unused from nav, kept for direct links)
│   │   ├── AddQuestionView.vue       # Create/edit form (judge config, test cases, side-by-side editors)
│   │   ├── ManageQuestionView.vue    # Admin CRUD table in card
│   │   └── QuestionSubmitView.vue    # Submission history list with filters in card
│   └── user/
│       ├── UserLoginView.vue         # Login form
│       └── UserRegisterView.vue      # Register form
├── App.vue              # Root component + global Claude Design System CSS + Arco overrides
└── main.ts              # Bootstrap: ArcoVue + router + store + axios + access guard

generated/               # Auto-generated API client — DO NOT EDIT
└── services/            # e.g. QuestionControllerService, UserControllerService
```

## Design System (Claude-inspired)

All CSS custom properties are defined in `src/App.vue` `:root`. Key tokens:

- **Canvas:** `#faf9f5` cream, **Primary:** `#cc785c` coral, **Dark:** `#181715` navy
- **Fonts:** Cormorant Garamond (serif, for page titles h1/h2), Inter (sans, for body and section titles h3/h4), JetBrains Mono (code)
- **Spacing:** `--space-xs` (8px) through `--space-xxl` (48px)
- **Radii:** `--radius-sm` (6px) through `--radius-pill` (9999px)

Typography utility classes: `.claude-title-lg` (22px), `.claude-title-md` (18px), `.claude-title-sm` (16px), `.claude-body` (16px), `.claude-body-sm` (14px), `.claude-caption` (13px/500), `.claude-caption-up` (12px/500/uppercase/1.5px tracking).

### Arco Design CSS Override Patterns

Overrides live in `src/App.vue` unscoped styles. Key patterns:

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
1. Submit via `doQuestionSubmitUsingPost` → returns submit ID
2. Poll `getQuestionSubmitByIdUsingGet` every 3s (30s timeout)
3. Stop when status is 2 (completed) or 3 (failed)
4. Judge info arrives as JSON string — must be parsed: `typeof d.judgeInfo === "string" && JSON.parse(d.judgeInfo)`
5. The getStatusText function uses status enum: 0=等待中, 1=判题中, 2=成功, 3=失败

### Question Answer Visibility
- Admins always see answers
- Normal users see answers only after an "Accepted" submission on that question
- Check queries submission history for `judgeInfo.message === "Accepted"`
- ViewQuestionView also keeps this pattern (for direct `/view/question/:id` links)

### API Client
- `openapi-typescript-codegen` generates static service classes (e.g., `QuestionControllerService.listQuestionByPageUsingPost`)
- All methods are static, return `{ code, data, message }` — check `res.code === 0` for success
- Do NOT edit generated files

### GlobalHeader Mock Login
In `GlobalHeader.vue`, there's a 3-second `setTimeout` that dispatches a mock admin user to `store.dispatch("user/getLoginUser", ...)`. This is a development convenience — the real login flow goes through `UserLoginView.vue` which calls the backend.

## Build & Deployment

### Build Optimization
- `compression-webpack-plugin` generates `.gz` files for all JS/CSS/HTML/SVG during build
- `vue.config.js` splits node_modules into 3 chunks: `chunk-vue` (Vue core), `chunk-arco` (Arco Design), `chunk-vendors` (rest)
- Monaco Editor is lazy-loaded via `defineAsyncComponent` in QuestionsView
- `moment.js` was removed — use native `formatTime()` helper for date formatting instead

### Nginx Configuration
- Use `gzip_static on` alongside `gzip on` to serve pre-built `.gz` files
- Nginx reverse-proxies `/api/` to the backend service (port 8101 in Docker, 8102 in dev)
- SPA fallback via `try_files $uri $uri/ /index.html;` for `createWebHistory` mode
