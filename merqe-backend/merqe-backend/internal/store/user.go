package store

import (
	"fmt"

	"github.com/merqe/backend/internal/models"
)

// GetUserByID returns the user with the given ID or an error if not found.
func (s *Store) GetUserByID(id int) (models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, u := range s.users {
		if u.ID == id {
			return u, nil
		}
	}
	return models.User{}, fmt.Errorf("user %d not found", id)
}

// CreateUser adds a new user and returns it with its assigned ID.
func (s *Store) CreateUser(name, email, address string) models.User {
	s.mu.Lock()
	defer s.mu.Unlock()
	u := models.User{
		ID:      s.nextUserID,
		Name:    name,
		Email:   email,
		Address: address,
	}
	s.nextUserID++
	s.users = append(s.users, u)
	return u
}
