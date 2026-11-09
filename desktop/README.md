# Grafana Desktop (Slice 0)

Electron window that loads a Grafana instance you already started. It does not spawn Grafana, package an installer, or change Grafana application code.

Default URL: `http://127.0.0.1:3000` (override with `GRAFANA_URL`).

## Three-terminal loop

From the repository root:

```sh
yarn start          # webpack → public/build
make run            # grafana on :3000
yarn desktop:dev    # Electron window
```

Sign in as `admin` / `admin`. Grafana will prompt to change the password on first login.

`yarn desktop:start` is the same as `yarn desktop:dev` in this slice.

The window polls `GET /api/health` and shows **Waiting for Grafana…** until that endpoint returns 200, so you can start Electron before the backend is up.

## Tests

```sh
yarn workspace @grafana/desktop test
```
