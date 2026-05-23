package store

import "github.com/merqe/backend/internal/models"

func (s *Store) GetCategories() ([]models.Category, error) {
	rows, err := s.db.Query(`SELECT id, name, icon FROM categories ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.Category
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Icon); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}
