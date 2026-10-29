package api

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/search/model"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestSearchDeletedDashboardsAuthz(t *testing.T) {
	newServer := func() *webtest.Server {
		return SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.SearchService = &mockSearchService{ExpectedResult: model.HitList{}}
		})
	}
	// Signed-in cases share a server. The unauthenticated case uses its own:
	// webtest reuses one ReqContext, so a later request would still look signed in.
	server := newServer()

	editor := &user.SignedInUser{UserID: 1, OrgID: 1, OrgRole: org.RoleEditor}
	viewer := &user.SignedInUser{UserID: 2, OrgID: 1, OrgRole: org.RoleViewer}
	admin := &user.SignedInUser{UserID: 3, OrgID: 1, OrgRole: org.RoleAdmin}

	tests := []struct {
		name       string
		user       *user.SignedInUser
		path       string
		wantStatus int
		wantMsg    string
	}{
		{
			name:       "signed-in editor searching deleted dashboards is forbidden",
			user:       editor,
			path:       "/api/search/?deleted=true",
			wantStatus: http.StatusForbidden,
			wantMsg:    "Unauthorized",
		},
		{
			name:       "signed-in viewer searching deleted dashboards is forbidden",
			user:       viewer,
			path:       "/api/search/?deleted=true",
			wantStatus: http.StatusForbidden,
			wantMsg:    "Unauthorized",
		},
		{
			name:       "signed-in admin searching deleted dashboards succeeds",
			user:       admin,
			path:       "/api/search/?deleted=true",
			wantStatus: http.StatusOK,
		},
		{
			name:       "signed-in editor searching live dashboards succeeds",
			user:       editor,
			path:       "/api/search/",
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := server.NewGetRequest(tt.path)
			webtest.RequestWithSignedInUser(req, tt.user)

			res, err := server.Send(req)
			require.NoError(t, err)
			t.Cleanup(func() {
				require.NoError(t, res.Body.Close())
			})
			assert.Equal(t, tt.wantStatus, res.StatusCode)

			if tt.wantMsg == "" {
				return
			}
			var body map[string]any
			require.NoError(t, json.NewDecoder(res.Body).Decode(&body))
			assert.Equal(t, tt.wantMsg, body["message"])
		})
	}

	t.Run("unauthenticated search for deleted dashboards is unauthorized", func(t *testing.T) {
		anon := newServer()
		req := anon.NewGetRequest("/api/search/?deleted=true")
		res, err := anon.Send(req)
		require.NoError(t, err)
		t.Cleanup(func() {
			require.NoError(t, res.Body.Close())
		})
		assert.Equal(t, http.StatusUnauthorized, res.StatusCode)

		var body map[string]any
		require.NoError(t, json.NewDecoder(res.Body).Decode(&body))
		assert.Equal(t, "Unauthorized", body["message"])
	})
}
