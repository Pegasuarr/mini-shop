package handler

import "net/http"

// HandleCategories serves GET /api/categories.
func (h *Handler) HandleCategories(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	writeJSON(w, http.StatusOK, h.store.GetCategories())
}
