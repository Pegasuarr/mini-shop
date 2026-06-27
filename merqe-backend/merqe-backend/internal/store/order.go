package store

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/merqe/backend/internal/models"
)

func (s *Store) GetOrders() ([]models.Order, error) {
	rows, err := s.db.Query(`
		SELECT o.id, o.user_id, o.date, o.status,
		       u.id, u.name, u.email, u.address
		FROM orders o
		JOIN users u ON u.id = o.user_id
		ORDER BY o.date DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		o, err := scanOrder(rows)
		if err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i, o := range orders {
		items, err := s.getOrderItems(o.ID)
		if err != nil {
			return nil, err
		}
		orders[i].Items = items
	}
	return orders, nil
}

func (s *Store) GetOrderByID(id int) (models.Order, error) {
	var o models.Order

	err := s.db.QueryRow(`
		SELECT o.id, o.user_id, o.date, o.status,
		       u.id, u.name, u.email, u.address
		FROM orders o
		JOIN users u ON u.id = o.user_id
		WHERE o.id = $1`, id).
		Scan(&o.ID, &o.UserID, &o.Date, &o.Status,
			&o.User.ID, &o.User.Name, &o.User.Email, &o.User.Address)

	if err == sql.ErrNoRows {
		return models.Order{}, fmt.Errorf("order %d not found", id)
	}
	if err != nil {
		return models.Order{}, err
	}

	items, err := s.getOrderItems(id)
	if err != nil {
		return models.Order{}, err
	}
	o.Items = items
	return o, nil
}

func (s *Store) CreateOrder(userID int, user models.User, date time.Time, items []models.OrderItem) (models.Order, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return models.Order{}, err
	}
	defer tx.Rollback()

	var o models.Order
	err = tx.QueryRow(`
		INSERT INTO orders (user_id, date, status)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, date, status`,
		userID, date, models.StatusPending,
	).Scan(&o.ID, &o.UserID, &o.Date, &o.Status)
	if err != nil {
		return models.Order{}, err
	}

	for _, item := range items {
		_, err := tx.Exec(`
			INSERT INTO order_items (order_id, product_id, qty, price)
			VALUES ($1, $2, $3, $4)`,
			o.ID, item.ProductID, item.Qty, item.Price)
		if err != nil {
			return models.Order{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return models.Order{}, err
	}

	o.User = user
	o.Items = items
	return o, nil
}

func (s *Store) UpdateOrderStatus(id int, status models.OrderStatus) (models.Order, error) {
	_, err := s.db.Exec(`UPDATE orders SET status = $1 WHERE id = $2`, status, id)
	if err != nil {
		return models.Order{}, err
	}
	return s.GetOrderByID(id)
}

// scanOrder scans a row into an Order with User data
func scanOrder(row *sql.Rows) (models.Order, error) {
	var o models.Order
	err := row.Scan(
		&o.ID, &o.UserID, &o.Date, &o.Status,
		&o.User.ID, &o.User.Name, &o.User.Email, &o.User.Address,
	)
	return o, err
}

func (s *Store) getOrderItems(orderID int) ([]models.OrderItem, error) {
	rows, err := s.db.Query(`
		SELECT product_id, qty, price
		FROM order_items WHERE order_id = $1`, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.OrderItem
	for rows.Next() {
		var i models.OrderItem
		if err := rows.Scan(&i.ProductID, &i.Qty, &i.Price); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}