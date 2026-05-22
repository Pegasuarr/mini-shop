package handler

import "net/http"

// HandleProducts serves GET /api/products[?categoryId=N].
func (h *Handler) HandleProducts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	catID := 0
	if raw := r.URL.Query().Get("categoryId"); raw != "" {
		if id, ok := parseID(raw); ok {
			catID = id
		}
	}
	writeJSON(w, http.StatusOK, h.store.GetProducts(catID))
}

// HandleProductByID serves GET /api/products/:id.
func (h *Handler) HandleProductByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	id, ok := parseID(lastSegment(r.URL.Path))
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid product id")
		return
	}
	p, err := h.store.GetProductByID(id)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, p)
}
