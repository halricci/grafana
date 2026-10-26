---
name: add-backend-endpoint
description: Add a Grafana HTTP API endpoint end to end. Use when adding a route under pkg/api, a handler on HTTPServer, and the matching test. Invoke as /add-backend-endpoint.
disable-model-invocation: true
---

# Add a backend API endpoint

Add one HTTP endpoint. Follow `.cursor/rules/grafana-go-backend.mdc`. Do not hand-edit `wire_gen.go`.

## Where the pieces go

1. Handler. Add a method on `*HTTPServer` in a new or existing file under `pkg/api/`. The signature used throughout `pkg/api/` is `func (hs *HTTPServer) Name(c *contextmodel.ReqContext)`. The context type is `github.com/grafana/grafana/pkg/services/contexthandler/model`. Write the JSON response with `c.JSON(http.StatusOK, payload)`, the same way `searchPlaylists` does in `pkg/api/playlist.go`.
2. Business logic. If the handler does more than read the request and write a response, put that logic in `pkg/services/<domain>/` and call it from the handler. Keep the handler thin.
3. Route. Register it in `registerRoutes` in `pkg/api/api.go`. The router is `hs.RouteRegister` (`r := hs.RouteRegister`). Auth middleware is declared at the top of that function: `reqSignedIn`, `reqGrafanaAdmin`, `authorize(...)`. Pick the same middleware the neighboring route uses. A signed-in GET looks like `r.Get("/api/...", reqSignedIn, routing.Wrap(hs.Name))` when the handler needs `routing.Wrap`, or `r.Get("/api/...", reqSignedIn, hs.Name)` when the neighboring routes pass the method directly. Match the neighbors.
4. Errors and logs. Wrap returned errors with `fmt.Errorf("what failed: %w", err)`. Log with `hs.log` or `log.New` from `pkg/infra/log`, message first, then key/value pairs.
5. Wire. A new constructor argument or a new service provider means editing the provider set and running `make gen-go`. A handler that only uses fields `HTTPServer` already has does not need Wire. Do not touch `pkg/server/wire_gen.go` by hand.
6. Test. Add `_test.go` next to the handler. Use `require` from `github.com/stretchr/testify/require`. Copy the smallest setup from an existing test in `pkg/api/` that calls a handler. Assert the status code and the response body. Run `go test -count=1 -run TestName ./pkg/api/`.

## Do not

- Do not put SQL or domain decisions in the handler.
- Do not register the route only in a comment. The line in `registerRoutes` is what exposes it.
- Do not edit generated files. `make swagger-gen` regenerates the OpenAPI spec when a swagger comment changes. Skip swagger unless the task asks for the public spec.
