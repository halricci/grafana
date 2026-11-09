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

func TestSearch_DeletedDashboardsAuthz(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.SearchService = &mockSearchService{
			ExpectedResult: model.HitList{
				{UID: "deleted-dash", Title: "Deleted"},
			},
		}
	})

	tests := []struct {
		name       string
		signedIn   bool
		role       org.RoleType
		query      string
		wantStatus int
	}{
		{
			name:       "signed-in viewer is forbidden",
			signedIn:   true,
			role:       org.RoleViewer,
			query:      "deleted=true",
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "signed-in editor is forbidden",
			signedIn:   true,
			role:       org.RoleEditor,
			query:      "deleted=true",
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "signed-in admin can search deleted dashboards",
			signedIn:   true,
			role:       org.RoleAdmin,
			query:      "deleted=true",
			wantStatus: http.StatusOK,
		},
		{
			name:       "unauthenticated request stays unauthorized",
			signedIn:   false,
			query:      "deleted=true",
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "signed-in viewer can search without deleted",
			signedIn:   true,
			role:       org.RoleViewer,
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			target := "/api/search/"
			if tt.query != "" {
				target += "?" + tt.query
			}
			req := server.NewGetRequest(target)
			if tt.signedIn {
				req = webtest.RequestWithSignedInUser(req, &user.SignedInUser{
					UserID:  1,
					OrgID:   1,
					OrgRole: tt.role,
				})
			} else {
				req = webtest.RequestWithWebContext(req, &contextmodel.ReqContext{
					SignedInUser: &user.SignedInUser{},
					IsSignedIn:   false,
				})
			}

			res, err := server.Send(req)
			require.NoError(t, err)
			t.Cleanup(func() {
				require.NoError(t, res.Body.Close())
			})
			require.Equal(t, tt.wantStatus, res.StatusCode)

			if tt.wantStatus == http.StatusOK {
				var hits model.HitList
				require.NoError(t, json.NewDecoder(res.Body).Decode(&hits))
				require.Len(t, hits, 1)
				require.Equal(t, "deleted-dash", hits[0].UID)
				require.Equal(t, "Deleted", hits[0].Title)
				return
			}

			var body struct {
				Message string `json:"message"`
			}
			require.NoError(t, json.NewDecoder(res.Body).Decode(&body))
			require.Equal(t, "Unauthorized", body.Message)
		})
	}
}
