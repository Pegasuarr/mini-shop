package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/merqe/backend/internal/models"
)

// writeJSON encodes v as JSON and writes it with the given status code.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// writeError writes a standard JSON error response.
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, models.ErrorResponse{Error: msg})
}

// parseID converts a string to a positive int. Returns (id, true) on success.
func parseID(s string) (int, bool) {
	id, err := strconv.Atoi(s)
	return id, err == nil && id > 0
}

// lastSegment returns the last non-empty segment of a URL path.
// e.g. "/api/orders/42" → "42"
func lastSegment(path string) string {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	return parts[len(parts)-1]
}
