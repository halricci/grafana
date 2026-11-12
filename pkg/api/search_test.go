package api

import (
	"encoding/json"
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

	for _, role := range []org.RoleType{org.RoleViewer, org.RoleEditor} {
		t.Run("signed-in "+string(role)+" is forbidden", func(t *testing.T) {
			req := webtest.RequestWithSignedInUser(server.NewGetRequest("/api/search?deleted=true"), &user.SignedInUser{
				UserID:  1,
				OrgID:   1,
				OrgRole: role,
			})
			resp, err := server.Send(req)
			require.NoError(t, err)
			require.Equal(t, http.StatusForbidden, resp.StatusCode)

			var body struct {
				Message string `json:"message"`
			}
			require.NoError(t, json.NewDecoder(resp.Body).Decode(&body))
			require.NoError(t, resp.Body.Close())
			require.Equal(t, "Unauthorized", body.Message)
		})
	}

	t.Run("org admin is allowed", func(t *testing.T) {
		req := webtest.RequestWithSignedInUser(server.NewGetRequest("/api/search?deleted=true"), &user.SignedInUser{
			UserID:  2,
			OrgID:   1,
			OrgRole: org.RoleAdmin,
		})
		resp, err := server.Send(req)
		require.NoError(t, err)
		require.NoError(t, resp.Body.Close())
		require.Equal(t, http.StatusOK, resp.StatusCode)
	})

	t.Run("anonymous caller is unauthorized", func(t *testing.T) {
		req := webtest.RequestWithWebContext(server.NewGetRequest("/api/search?deleted=true"), &contextmodel.ReqContext{
			SignedInUser: &user.SignedInUser{},
			IsSignedIn:   false,
		})
		resp, err := server.Send(req)
		require.NoError(t, err)
		require.NoError(t, resp.Body.Close())
		require.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})
}
