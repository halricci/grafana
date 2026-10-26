# Grafana desktop window

This note describes how a desktop window opens the local Grafana UI. The goal is to keep the running server, the session cookie, and the login page as they are, and to load the UI from that server.

Electron opens one window to `http://127.0.0.1:3000`. The Go server stays unchanged. The `grafana_session` cookie name stays unchanged. CSRF stays unchanged. `root_url` stays unchanged.

Before you begin, the local Grafana server and frontend build come from the existing developer commands. This pull request does not add a launcher.

## How the UI loads

`public/views/index.html` is a Go template. The window loads the UI from the running server. It does not read `public/views/index.html` from disk.

`make run` serves the UI. `yarn start` builds the frontend. `yarn desktop` launches Electron once Electron is installed. Another branch adds the `yarn desktop` script.

## Sign-in

Signing in uses the normal login page. The repository already documents the local default user `admin` and password `admin` in `conf/defaults.ini` (`admin_user` and `admin_password`) and in `AGENTS.md`. This window adds no credential.

Refresh keeps the session because the window uses the default session. A browser tab at `http://localhost:3000` still works.

## Files outside this pull request

Sibling rehearsal branches own the launcher, the security helper, the package script, and the builder config. This pull request leaves those files out:

- `desktop/main.cjs`
- `desktop/security.cjs`
- the `desktop` script in `package.json`
- `desktop/electron-builder.config.cjs`

This change includes no Go files.

## Manual checklist

This is the ticket's manual checklist. These steps were not run on this branch. Sign-in was not performed.

- [ ] `make run`
- [ ] `yarn start`
- [ ] `go test -count=1 ./pkg/api/webassets/`
- [ ] `yarn desktop`
- [ ] Sign in
