package handler

import (
	"net/http"

	"github.com/merqe/backend/internal/store"
)

// Handler holds the shared store dependency.
type Handler struct {
	store *store.Store
}

// New creates a Handler with the given store.
func New(s *store.Store) *Handler {
	return &Handler{store: s}
}

// RegisterRoutes attaches all API routes and the static file server to mux.
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	// REST API — register these first with specific prefixes
	mux.HandleFunc("/api/categories", h.HandleCategories)
	mux.HandleFunc("/api/products", h.HandleProducts)
	mux.HandleFunc("/api/products/", h.HandleProductByID)
	mux.HandleFunc("/api/users/", h.HandleUserByID)
	mux.HandleFunc("/api/orders", h.HandleOrders)
	mux.HandleFunc("/api/orders/", h.HandleOrderByID)
	mux.HandleFunc("/api/reports/daily", h.HandleDailyReport)
}