package store

import (
	"database/sql"
	"fmt"

	"github.com/merqe/backend/internal/models"
)

func (s *Store) GetProducts(categoryID int) ([]models.Product, error) {
	query := `SELECT id, name, category_id, price, old_price, badge, icon, COALESCE(image_url, '') FROM products`
	args := []any{}

	if categoryID != 0 {
		query += ` WHERE category_id = $1`
		args = append(args, categoryID)
	}
	query += ` ORDER BY id`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.Product
	for rows.Next() {
		p, err := scanProduct(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) GetProductByID(id int) (models.Product, error) {
	row := s.db.QueryRow(`
		SELECT id, name, category_id, price, old_price, badge, icon, COALESCE(image_url, '')
		FROM products WHERE id = $1`, id)

	p, err := scanProduct(row)
	if err == sql.ErrNoRows {
		return models.Product{}, fmt.Errorf("product %d not found", id)
	}
	return p, err
}

type scanner interface {
	Scan(dest ...any) error
}

func scanProduct(s scanner) (models.Product, error) {
	var p models.Product
	var oldPrice sql.NullFloat64
	var badge sql.NullString

	err := s.Scan(
		&p.ID, &p.Name, &p.CategoryID,
		&p.Price, &oldPrice, &badge, &p.Icon, &p.ImageURL,
	)
	if err != nil {
		return models.Product{}, err
	}
	if oldPrice.Valid {
		p.OldPrice = &oldPrice.Float64
	}
	if badge.Valid {
		p.Badge = badge.String
	}
	return p, nil
}