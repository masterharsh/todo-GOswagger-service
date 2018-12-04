package middlewares

import (
	"net/http"
	"path"
	"runtime"
	"strings"
)

//InstallUImiddleware allows the swagger api to be exercised through a standard UI page
func InstallUImiddleware(handler http.Handler) http.Handler {
	handlerFunction := func(w http.ResponseWriter, r *http.Request) {
		basePath := "/api/test/v1"
		apiuiPath := "/api/test/v1/content/"

		if r.URL.Path == basePath {
			http.Redirect(w, r, basePath+"/", http.StatusFound)
			return
		}
		if r.URL.Path == basePath+"/" || strings.Index(r.URL.Path, apiuiPath) == 0 {
			_, filename, _, _ := runtime.Caller(0)
			swaggerUIHandler := http.FileServer(http.Dir(path.Join(path.Dir(filename), "../../swagger-ui")))

			http.StripPrefix(basePath, swaggerUIHandler).ServeHTTP(w, r)
			return
		}
		handler.ServeHTTP(w, r)
	}
	return http.HandlerFunc(handlerFunction)
}
