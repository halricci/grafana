package api

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
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

	const deletedSearch = "/api/search?deleted=true"

	t.Run("signed-in non-admin is forbidden", func(t *testing.T) {
		for _, role := range []org.RoleType{org.RoleViewer, org.RoleEditor} {
			t.Run(string(role), func(t *testing.T) {
				req := webtest.RequestWithSignedInUser(server.NewGetRequest(deletedSearch), &user.SignedInUser{
					UserID:  1,
					OrgID:   1,
					OrgRole: role,
				})
				res, err := server.Send(req)
				require.NoError(t, err)
				t.Cleanup(func() { require.NoError(t, res.Body.Close()) })

				assert.Equal(t, http.StatusForbidden, res.StatusCode)
				var body map[string]any
				require.NoError(t, json.NewDecoder(res.Body).Decode(&body))
				assert.Equal(t, "Unauthorized", body["message"])
			})
		}
	})

	t.Run("unauthenticated request stays unauthorized", func(t *testing.T) {
		// Own server: the API test mux reuses one request context, so a
		// signed-in call earlier in this test would leak IsSignedIn into this one.
		anonServer := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.SearchService = &mockSearchService{ExpectedResult: model.HitList{}}
		})
		res, err := anonServer.Send(anonServer.NewGetRequest(deletedSearch))
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, res.Body.Close()) })
		assert.Equal(t, http.StatusUnauthorized, res.StatusCode)
	})

	t.Run("anonymous access stays unauthorized", func(t *testing.T) {
		// Anonymous requests pass ReqSignedIn and hit the handler. They are
		// not signed in, so this must stay 401 rather than 403.
		req := webtest.RequestWithWebContext(server.NewGetRequest(deletedSearch), &contextmodel.ReqContext{
			IsSignedIn:     false,
			AllowAnonymous: true,
			SignedInUser: &user.SignedInUser{
				OrgID:       1,
				OrgRole:     org.RoleViewer,
				IsAnonymous: true,
			},
		})
		res, err := server.Send(req)
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, res.Body.Close()) })
		assert.Equal(t, http.StatusUnauthorized, res.StatusCode)
	})

	t.Run("admin can search deleted dashboards", func(t *testing.T) {
		req := webtest.RequestWithSignedInUser(server.NewGetRequest(deletedSearch), &user.SignedInUser{
			UserID:  1,
			OrgID:   1,
			OrgRole: org.RoleAdmin,
		})
		res, err := server.Send(req)
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, res.Body.Close()) })
		assert.Equal(t, http.StatusOK, res.StatusCode)
	})

	t.Run("signed-in non-admin can search without deleted", func(t *testing.T) {
		req := webtest.RequestWithSignedInUser(server.NewGetRequest("/api/search"), &user.SignedInUser{
			UserID:  1,
			OrgID:   1,
			OrgRole: org.RoleEditor,
		})
		res, err := server.Send(req)
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, res.Body.Close()) })
		assert.Equal(t, http.StatusOK, res.StatusCode)
	})
}
