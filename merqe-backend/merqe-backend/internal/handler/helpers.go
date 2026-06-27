package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/merqe/backend/internal/models"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, models.ErrorResponse{Error: msg})
}

func parseID(s string) (int, bool) {
	id, err := strconv.Atoi(s)
	return id, err == nil && id > 0
}

func lastSegment(path string) string {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	return parts[len(parts)-1]
}