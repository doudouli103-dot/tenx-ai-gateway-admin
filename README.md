# tenx-ai-gateway-admin

Vue admin console for `tenx-ai-gateway`.

It is a frontend-only project. It does not execute local scripts directly. Start and stop actions call the Gateway admin API:

```text
GET  /admin/models
POST /admin/models/{model}/start
POST /admin/models/{model}/stop
```

After each start or stop action, the page shows:

```text
command exit code
command output
status before and after the action
whether the expected online/offline status was verified
optional resource check output
```

## Start

```bash
npm install
npm run dev
```

Open:

```text
http://macstudio.tentest.cn:5173
```

Default connection values in the page:

```text
Gateway URL: http://macstudio.tentest.cn:8088
API Key:     local-dev-key
```

The page stores these values in browser local storage.

## Build

```bash
npm run build
```

## Runtime Boundary

Model commands run inside the `tenx-ai-gateway` process, using commands configured in the Gateway `application.yml` or environment variables.

If `tenx-ai-gateway` runs in Docker, commands run inside the container. To control Mac Studio host processes, run the Gateway directly on the Mac host, or mount the scripts and required runtime paths into the container.
