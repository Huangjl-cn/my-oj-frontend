# myoj-frontend

## 根据后台生成代码

```shell
openapi --input http://localhost:8102/api/v3/api-docs --output ./generated --client axios
```

## Project setup

```
npm ci
```

### 开发（Vite，端口 8080，/api 转发到 127.0.0.1:8102）

```
npm run serve
```

### 构建（先用 vue-tsc 做类型检查，产物在 deploy/oj-frontend/dist）

```
npm run build
```

### 代码检查和单测

```
npm run lint
npm run test:unit
```

配置见 `vite.config.mts`（开发服务、构建和 Vitest 都在这一个文件里）。

### CI 和部署

- 每次 push 和 PR：`.github/workflows/ci.yml` 跑 lint、格式检查、单测和构建。
- 合进 master：`.github/workflows/deploy.yml` 构建后，在 GitHub 的 `production` 环境里批准，就会用 SSH 发到服务器。服务器上的部署脚本在后端仓库的 `deploy/server/deploy.sh`，它负责切换版本、出问题时切回上一版。
- 重新部署旧提交：Actions → Deploy → Run workflow，填提交号。
