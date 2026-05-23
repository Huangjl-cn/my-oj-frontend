# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run serve     # Start dev server (vue-cli-service serve)
npm run build     # Production build (vue-cli-service build, disables sourcemaps)
npm run lint      # Lint with ESLint + Prettier (vue-cli-service lint)
```

**Important:** There is no test runner configured. Do not attempt to run tests.

## Tech Stack

- **Framework:** Vue 3 (Composition API, `<script setup lang="ts">`)
- **Build:** Vue CLI 5 + Babel + TypeScript ~4.5
- **UI Library:** Arco Design Vue (`@arco-design/web-vue`)
- **State:** Vuex 4 (namespaced `user` module)
- **Router:** Vue Router 4 (createWebHistory)
- **HTTP:** Axios (with credentials, interceptors)
- **Editor:** Monaco Editor (languages: java, cpp, go, python, javascript)
- **Markdown:** ByteMD (plugin-gfm, plugin-highlight) for editing and rendering
- **Codegen:** openapi-typescript-codegen (generates API client from OpenAPI spec)

## Project Structure

```
src/
├── access/               # Route-level permission guard
│   ├── accessEnum.ts     # NOT_LOGIN / USER / ADMIN roles
│   ├── checkAccess.ts    # Permission check logic
│   └── index.ts          # Vue Router beforeEach guard (auto-login, route auth)
├── components/
│   ├── CodeEditor.vue    # Monaco Editor wrapper
│   ├── GlobalHeader.vue  # Top nav with menu + user info
│   ├── MdEditor.vue      # ByteMD editor (for question content/answer)
│   └── MdViewer.vue      # ByteMD viewer (read-only rendering)
├── layouts/
│   ├── BasicLayout.vue   # Main layout: header + content + footer
│   └── UserLayout.vue    # Minimal layout for login/register pages
├── plugins/
│   └── axios.ts          # Axios config (withCredentials: true, interceptors)
├── router/
│   ├── index.ts          # Router instance (createWebHistory)
│   └── routes.ts         # Route definitions with access meta
├── store/
│   ├── index.ts          # Vuex store with user module
│   └── user.ts           # User state (loginUser), getLoginUser action
├── views/
│   ├── question/
│   │   ├── QuestionsView.vue         # Question list with search + pagination
│   │   ├── ViewQuestionView.vue      # Coding page: problem + editor + submit + poll result
│   │   ├── AddQuestionView.vue       # Create/edit question form (judge config, test cases)
│   │   ├── ManageQuestionView.vue    # Admin CRUD table for questions
│   │   └── QuestionSubmitView.vue    # Submission history list with filters
│   └── user/
│       ├── UserLoginView.vue         # Login form
│       └── UserRegisterView.vue      # Register form
├── App.vue              # Root: conditional layout (user routes vs main routes)
└── main.ts              # App bootstrap (ArcoVue + router + store + axios + access)

generated/  # Auto-generated API client code — do not edit manually
├── core/                # HTTP request infrastructure
├── models/              # TypeScript interfaces (Question, User, JudgeConfig, etc.)
└── services/            # API service classes (QuestionControllerService, UserControllerService, etc.)
```

## Architecture Notes

### Route-based Access Control
Routes declare required access level via `meta.access`. The global `beforeEach` guard in `src/access/index.ts` auto-fetches the logged-in user (if not already loaded), then checks permission — redirects to `/user/login` or `/noAuth` as needed. Routes with `meta.hideInMenu: true` are excluded from the nav bar.

### Code Submission & Polling
`ViewQuestionView.vue` submits code via `doQuestionSubmitUsingPost`, gets back a submit ID, then **polls** `getQuestionSubmitByIdUsingGet` every 3s (30s timeout) until status is 2 (completed) or 3 (failed).

### Question Answer Visibility
Answers are hidden from normal users unless they have an "Accepted" submission on that question. Admins always see answers. The check queries submission history for a `judgeInfo.message === "Accepted"` record.

### API Client Codegen
TypeScript API client lives in `generated/` and is produced by `openapi-typescript-codegen`. Service classes use static methods (e.g., `QuestionControllerService.listQuestionByPageUsingPost`). Do not edit generated files directly.

### Axios
Configured with `withCredentials: true` to send session cookies. Request/response interceptors are set up but currently only log to console.

### Webpack Config
- Monaco Editor: bundles java, javascript, typescript, python, cpp language support
- gzip compression (compression-webpack-plugin, threshold 8KB)
- Image optimization (image-webpack-loader via chainWebpack)
- Prefetch/preload disabled
- Page title set to "MyOJ"
