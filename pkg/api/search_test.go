package api

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/search"
	"github.com/grafana/grafana/pkg/services/search/model"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestSearchDeletedDashboardsAuthz(t *testing.T) {
	searchSvc := &recordingSearchService{result: model.HitList{}}
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.SearchService = searchSvc
	})

	const deletedSearch = "/api/search?deleted=true"

	t.Run("unauthenticated request returns 401", func(t *testing.T) {
		resp, err := server.Send(server.NewGetRequest(deletedSearch))
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, resp.Body.Close()) })
		require.Equal(t, http.StatusUnauthorized, resp.StatusCode)
		require.Zero(t, searchSvc.calls)
	})

	t.Run("signed-in non-admin returns 403", func(t *testing.T) {
		for _, role := range []org.RoleType{org.RoleViewer, org.RoleEditor} {
			t.Run(string(role), func(t *testing.T) {
				before := searchSvc.calls
				resp := searchAs(t, server, deletedSearch, role)
				require.Equal(t, http.StatusForbidden, resp.StatusCode)
				require.Equal(t, "Unauthorized", responseMessage(t, resp))
				require.Equal(t, before, searchSvc.calls)
			})
		}
	})

	t.Run("signed-in admin can search deleted dashboards", func(t *testing.T) {
		before := searchSvc.calls
		resp := searchAs(t, server, deletedSearch, org.RoleAdmin)
		require.Equal(t, http.StatusOK, resp.StatusCode)
		require.Equal(t, before+1, searchSvc.calls)
		require.True(t, searchSvc.last.IsDeleted)
	})

	t.Run("signed-in non-admin can search without deleted", func(t *testing.T) {
		before := searchSvc.calls
		resp := searchAs(t, server, "/api/search", org.RoleViewer)
		require.Equal(t, http.StatusOK, resp.StatusCode)
		require.Equal(t, before+1, searchSvc.calls)
		require.False(t, searchSvc.last.IsDeleted)
	})
}

func searchAs(t *testing.T, server *webtest.Server, url string, role org.RoleType) *http.Response {
	t.Helper()
	req := webtest.RequestWithSignedInUser(server.NewGetRequest(url), &user.SignedInUser{
		UserID:  1,
		OrgID:   1,
		OrgRole: role,
	})
	resp, err := server.Send(req)
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, resp.Body.Close()) })
	return resp
}

func responseMessage(t *testing.T, resp *http.Response) string {
	t.Helper()
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	var payload struct {
		Message string `json:"message"`
	}
	require.NoError(t, json.Unmarshal(body, &payload))
	return payload.Message
}

type recordingSearchService struct {
	result model.HitList
	calls  int
	last   *search.Query
}

func (s *recordingSearchService) SearchHandler(_ context.Context, q *search.Query) (model.HitList, error) {
	s.calls++
	copied := *q
	s.last = &copied
	return s.result, nil
}

func (s *recordingSearchService) SortOptions() []model.SortOption { return nil }
