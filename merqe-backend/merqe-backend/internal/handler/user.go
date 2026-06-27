package handler

import "net/http"

func (h *Handler) HandleUserByID(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(lastSegment(r.URL.Path))
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	switch r.Method {
	case http.MethodGet:
		u, err := h.store.GetUserByID(id)
		if err != nil {
			writeError(w, http.StatusNotFound, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, u)
	case http.MethodDelete:
		err := h.store.DeleteUser(id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to delete user: "+err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
