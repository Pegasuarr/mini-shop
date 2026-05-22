package store

import (
	"fmt"

	"github.com/merqe/backend/internal/models"
)

// GetProducts returns all products, optionally filtered by categoryID (0 = all).
func (s *Store) GetProducts(categoryID int) []models.Product {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if categoryID == 0 {
		out := make([]models.Product, len(s.products))
		copy(out, s.products)
		return out
	}
	var out []models.Product
	for _, p := range s.products {
		if p.CategoryID == categoryID {
			out = append(out, p)
		}
	}
	return out
}

// GetProductByID returns the product with the given ID or an error if not found.
func (s *Store) GetProductByID(id int) (models.Product, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, p := range s.products {
		if p.ID == id {
			return p, nil
		}
	}
	return models.Product{}, fmt.Errorf("product %d not found", id)
}
