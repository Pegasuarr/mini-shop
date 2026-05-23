package store

import (
	"database/sql"
	"fmt"

	"github.com/merqe/backend/internal/models"
)

func (s *Store) GetUserByID(id int) (models.User, error) {
	var u models.User
	var address sql.NullString

	err := s.db.QueryRow(`
		SELECT id, name, email, address FROM users WHERE id = $1`, id).
		Scan(&u.ID, &u.Name, &u.Email, &address)

	if err == sql.ErrNoRows {
		return models.User{}, fmt.Errorf("user %d not found", id)
	}
	if err != nil {
		return models.User{}, err
	}
	if address.Valid {
		u.Address = address.String
	}
	return u, nil
}

func (s *Store) CreateUser(name, email, address string) (models.User, error) {
	var u models.User
	err := s.db.QueryRow(`
		INSERT INTO users (name, email, address)
		VALUES ($1, $2, $3)
		RETURNING id, name, email, address`,
		name, email, address,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Address)
	return u, err
}
