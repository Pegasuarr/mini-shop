// Package store provides a thread-safe in-memory data store.
package store

import (
	"sync"

	"github.com/merqe/backend/internal/models"
)

// Store is the central in-memory data store.
type Store struct {
	mu          sync.RWMutex
	categories  []models.Category
	products    []models.Product
	users       []models.User
	orders      []models.Order
	nextOrderID int
	nextUserID  int
}

// New creates and returns a seeded Store.
func New() *Store {
	s := &Store{
		nextOrderID: 1,
		nextUserID:  2, // ID 1 is the default guest user
	}
	s.seed()
	return s
}
