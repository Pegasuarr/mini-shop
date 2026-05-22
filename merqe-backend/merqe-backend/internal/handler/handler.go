// Package handler wires HTTP routes to store operations.
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
	// Static frontend (place index.html / style.css / app.js in ./static)
	mux.Handle("/", http.FileServer(http.Dir("./static")))

	// REST API
	mux.HandleFunc("/api/categories",  h.HandleCategories)
	mux.HandleFunc("/api/products",    h.HandleProducts)
	mux.HandleFunc("/api/products/",   h.HandleProductByID)
	mux.HandleFunc("/api/users/",      h.HandleUserByID)
	mux.HandleFunc("/api/orders",      h.HandleOrders)
	mux.HandleFunc("/api/orders/",     h.HandleOrderByID)
}
