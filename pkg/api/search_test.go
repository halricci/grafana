package api

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/search"
	"github.com/grafana/grafana/pkg/services/search/model"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web/webtest"
)

type recordingSearchService struct {
	calls int
	last  *search.Query
}

func (s *recordingSearchService) SearchHandler(_ context.Context, q *search.Query) (model.HitList, error) {
	s.calls++
	copied := *q
	s.last = &copied
	return model.HitList{}, nil
}

func (s *recordingSearchService) SortOptions() []model.SortOption { return nil }

func TestSearchDeletedDashboardsAuthz(t *testing.T) {
	searchService := &recordingSearchService{}
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.SearchService = searchService
	})

	tests := []struct {
		name        string
		path        string
		user        *user.SignedInUser
		wantStatus  int
		wantSearch  bool
		wantDeleted bool
	}{
		{
			name:       "signed-in viewer is forbidden",
			path:       "/api/search/?deleted=true",
			user:       &user.SignedInUser{UserID: 1, OrgID: 1, OrgRole: org.RoleViewer},
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "signed-in editor is forbidden",
			path:       "/api/search/?deleted=true",
			user:       &user.SignedInUser{UserID: 2, OrgID: 1, OrgRole: org.RoleEditor},
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "unauthenticated request stays unauthorized",
			path:       "/api/search/?deleted=true",
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:        "org admin can search deleted dashboards",
			path:        "/api/search/?deleted=true",
			user:        &user.SignedInUser{UserID: 3, OrgID: 1, OrgRole: org.RoleAdmin},
			wantStatus:  http.StatusOK,
			wantSearch:  true,
			wantDeleted: true,
		},
		{
			name:       "signed-in viewer can search without deleted",
			path:       "/api/search/",
			user:       &user.SignedInUser{UserID: 1, OrgID: 1, OrgRole: org.RoleViewer},
			wantStatus: http.StatusOK,
			wantSearch: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			before := searchService.calls
			req := server.NewGetRequest(tt.path)
			if tt.user != nil {
				webtest.RequestWithSignedInUser(req, tt.user)
			} else {
				// The test mux reuses one ReqContext and only replaces it when a
				// request installs one. Clear the identity so a previous signed-in
				// call cannot leak into this unauthenticated request.
				webtest.RequestWithWebContext(req, &contextmodel.ReqContext{
					SignedInUser: &user.SignedInUser{},
					IsSignedIn:   false,
				})
			}

			res, err := server.Send(req)
			require.NoError(t, err)
			t.Cleanup(func() {
				require.NoError(t, res.Body.Close())
			})

			assert.Equal(t, tt.wantStatus, res.StatusCode)
			if tt.wantStatus == http.StatusForbidden || tt.wantStatus == http.StatusUnauthorized {
				assert.Equal(t, "Unauthorized", readMessage(t, res))
			}
			if tt.wantSearch {
				require.Equal(t, before+1, searchService.calls)
				require.NotNil(t, searchService.last)
				assert.Equal(t, tt.wantDeleted, searchService.last.IsDeleted)
				return
			}
			assert.Equal(t, before, searchService.calls)
		})
	}
}

func readMessage(t *testing.T, res *http.Response) string {
	t.Helper()
	body, err := io.ReadAll(res.Body)
	require.NoError(t, err)
	var payload struct {
		Message string `json:"message"`
	}
	require.NoError(t, json.Unmarshal(body, &payload))
	return payload.Message
}
