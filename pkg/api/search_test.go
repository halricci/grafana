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

func TestSearchDeletedDashboardsAuthorization(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.SearchService = &mockSearchService{ExpectedResult: model.HitList{}}
	})

	viewer := &user.SignedInUser{UserID: 1, OrgID: 1, OrgRole: org.RoleViewer}
	editor := &user.SignedInUser{UserID: 2, OrgID: 1, OrgRole: org.RoleEditor}
	admin := &user.SignedInUser{UserID: 3, OrgID: 1, OrgRole: org.RoleAdmin}

	tests := []struct {
		name       string
		path       string
		user       *user.SignedInUser
		signedOut  bool
		wantStatus int
		wantMsg    string
	}{
		{
			name:       "signed-in viewer searching deleted dashboards is forbidden",
			path:       "/api/search?deleted=true",
			user:       viewer,
			wantStatus: http.StatusForbidden,
			wantMsg:    "Unauthorized",
		},
		{
			name:       "signed-in editor searching deleted dashboards is forbidden",
			path:       "/api/search?deleted=true",
			user:       editor,
			wantStatus: http.StatusForbidden,
			wantMsg:    "Unauthorized",
		},
		{
			name:       "admin searching deleted dashboards is allowed",
			path:       "/api/search?deleted=true",
			user:       admin,
			wantStatus: http.StatusOK,
		},
		{
			name:       "signed-in viewer searching live dashboards is allowed",
			path:       "/api/search",
			user:       viewer,
			wantStatus: http.StatusOK,
		},
		{
			name:       "unauthenticated search for deleted dashboards stays unauthorized",
			path:       "/api/search?deleted=true",
			signedOut:  true,
			wantStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := server.NewGetRequest(tt.path)
			if tt.user != nil {
				webtest.RequestWithSignedInUser(req, tt.user)
			} else if tt.signedOut {
				// The test server reuses one ReqContext. Set signed-out explicitly so a
				// previous case cannot leave IsSignedIn set and skip the 401 middleware.
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
			if tt.wantMsg != "" {
				var body map[string]any
				require.NoError(t, json.NewDecoder(res.Body).Decode(&body))
				assert.Equal(t, tt.wantMsg, body["message"])
			}
		})
	}
}
