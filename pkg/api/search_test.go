package api

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/search/model"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestSearchDeletedDashboardsAuthz(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.SearchService = &mockSearchService{ExpectedResult: model.HitList{}}
	})

	t.Run("anonymous caller is unauthorized", func(t *testing.T) {
		req := server.NewGetRequest("/api/search?deleted=true")
		resp, err := server.Send(req)
		require.NoError(t, err)
		require.NoError(t, resp.Body.Close())
		require.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("signed-in non-admin is forbidden", func(t *testing.T) {
		req := server.NewGetRequest("/api/search?deleted=true")
		req = webtest.RequestWithSignedInUser(req, &user.SignedInUser{
			UserID:  1,
			OrgID:   1,
			OrgRole: org.RoleEditor,
		})
		resp, err := server.Send(req)
		require.NoError(t, err)
		require.NoError(t, resp.Body.Close())
		require.Equal(t, http.StatusForbidden, resp.StatusCode)
	})

	t.Run("org admin can search deleted dashboards", func(t *testing.T) {
		req := server.NewGetRequest("/api/search?deleted=true")
		req = webtest.RequestWithSignedInUser(req, &user.SignedInUser{
			UserID:  1,
			OrgID:   1,
			OrgRole: org.RoleAdmin,
		})
		resp, err := server.Send(req)
		require.NoError(t, err)
		require.NoError(t, resp.Body.Close())
		require.Equal(t, http.StatusOK, resp.StatusCode)
	})
}
