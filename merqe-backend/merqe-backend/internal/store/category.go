package store

import "github.com/merqe/backend/internal/models"

// GetCategories returns all categories.
func (s *Store) GetCategories() []models.Category {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.Category, len(s.categories))
	copy(out, s.categories)
	return out
}
