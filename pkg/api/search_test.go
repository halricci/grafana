package api

import (
	"encoding/json"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/search/model"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestSearchDeletedDashboardsAuthz(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.SearchService = &mockSearchService{ExpectedResult: model.HitList{}}
	})

	const path = "/api/search?deleted=true"

	t.Run("signed-in non-admin is forbidden", func(t *testing.T) {
		users := []struct {
			name string
			user *user.SignedInUser
		}{
			{"viewer", &user.SignedInUser{UserID: 1, OrgID: 1, OrgRole: org.RoleViewer}},
			{"editor", &user.SignedInUser{UserID: 2, OrgID: 1, OrgRole: org.RoleEditor}},
		}
		for _, tc := range users {
			t.Run(tc.name, func(t *testing.T) {
				req := webtest.RequestWithSignedInUser(server.NewGetRequest(path), tc.user)
				resp, err := server.Send(req)
				require.NoError(t, err)
				t.Cleanup(func() { require.NoError(t, resp.Body.Close()) })
				require.Equal(t, http.StatusForbidden, resp.StatusCode)

				body, err := io.ReadAll(resp.Body)
				require.NoError(t, err)
				var payload map[string]any
				require.NoError(t, json.Unmarshal(body, &payload))
				require.Equal(t, "Unauthorized", payload["message"])
			})
		}
	})

	t.Run("unauthenticated is unauthorized", func(t *testing.T) {
		// The test server keeps one ReqContext. A request with no signed-in user
		// must clear it, or the previous case's user leaks into this one.
		req := webtest.RequestWithWebContext(server.NewGetRequest(path), &contextmodel.ReqContext{
			SignedInUser: &user.SignedInUser{},
			IsSignedIn:   false,
		})
		resp, err := server.Send(req)
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, resp.Body.Close()) })
		require.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("org admin can search deleted dashboards", func(t *testing.T) {
		admin := &user.SignedInUser{UserID: 3, OrgID: 1, OrgRole: org.RoleAdmin}
		req := webtest.RequestWithSignedInUser(server.NewGetRequest(path), admin)
		resp, err := server.Send(req)
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, resp.Body.Close()) })
		require.Equal(t, http.StatusOK, resp.StatusCode)
	})
}
