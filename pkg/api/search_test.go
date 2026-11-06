package api

import (
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/search/model"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestSearchDeletedDashboardsStatus(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.SearchService = &mockSearchService{ExpectedResult: model.HitList{}}
	})

	t.Run("unauthenticated request still returns 401", func(t *testing.T) {
		req := server.NewGetRequest("/api/search?deleted=true")
		resp, err := server.Send(req)
		require.NoError(t, err)
		require.Equal(t, http.StatusUnauthorized, resp.StatusCode)
		require.NoError(t, resp.Body.Close())
	})

	t.Run("signed-in non-admin returns 403", func(t *testing.T) {
		for _, role := range []org.RoleType{org.RoleViewer, org.RoleEditor} {
			t.Run(string(role), func(t *testing.T) {
				usr := &user.SignedInUser{UserID: 1, OrgID: 1, OrgRole: role}
				req := webtest.RequestWithSignedInUser(server.NewGetRequest("/api/search?deleted=true"), usr)
				resp, err := server.Send(req)
				require.NoError(t, err)
				require.Equal(t, http.StatusForbidden, resp.StatusCode)
				body, err := io.ReadAll(resp.Body)
				require.NoError(t, err)
				require.NoError(t, resp.Body.Close())
				require.Contains(t, string(body), "Unauthorized")
			})
		}
	})

	t.Run("signed-in admin is unaffected", func(t *testing.T) {
		usr := &user.SignedInUser{UserID: 1, OrgID: 1, OrgRole: org.RoleAdmin}
		req := webtest.RequestWithSignedInUser(server.NewGetRequest("/api/search?deleted=true"), usr)
		resp, err := server.Send(req)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)
		require.NoError(t, resp.Body.Close())
	})

	t.Run("signed-in non-admin without deleted flag is unaffected", func(t *testing.T) {
		usr := &user.SignedInUser{UserID: 1, OrgID: 1, OrgRole: org.RoleViewer}
		req := webtest.RequestWithSignedInUser(server.NewGetRequest("/api/search"), usr)
		resp, err := server.Send(req)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)
		require.NoError(t, resp.Body.Close())
	})
}
