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

func (s *Store) DeleteUser(id int) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Delete order items for user's orders
	_, err = tx.Exec(`
		DELETE FROM order_items
		WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)`, id)
	if err != nil {
		return err
	}

	// 2. Delete user's orders
	_, err = tx.Exec(`DELETE FROM orders WHERE user_id = $1`, id)
	if err != nil {
		return err
	}

	// 3. Delete user
	_, err = tx.Exec(`DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	// 4. Trigger resequencing!
	return s.ResequenceUserIDs()
}

func (s *Store) ResequenceUserIDs() error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Create a temporary table mapping old IDs to new sequential IDs
	_, err = tx.Exec(`
		CREATE TEMP TABLE IF NOT EXISTS temp_user_mapping ON COMMIT DROP AS
		SELECT id AS old_id, ROW_NUMBER() OVER (ORDER BY id) AS new_id
		FROM users
	`)
	if err != nil {
		return err
	}

	// 2. Drop the foreign key constraint temporarily
	_, err = tx.Exec(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey`)
	if err != nil {
		return err
	}

	// 3. Update the users table
	_, err = tx.Exec(`
		UPDATE users u
		SET id = m.new_id
		FROM temp_user_mapping m
		WHERE u.id = m.old_id
	`)
	if err != nil {
		return err
	}

	// 4. Update the orders table
	_, err = tx.Exec(`
		UPDATE orders o
		SET user_id = m.new_id
		FROM temp_user_mapping m
		WHERE o.user_id = m.old_id
	`)
	if err != nil {
		return err
	}

	// 5. Re-add the foreign key constraint
	_, err = tx.Exec(`
		ALTER TABLE orders
		ADD CONSTRAINT orders_user_id_fkey
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	`)
	if err != nil {
		return err
	}

	// 6. Reset the users_id_seq sequence
	var maxID sql.NullInt64
	err = tx.QueryRow(`SELECT MAX(id) FROM users`).Scan(&maxID)
	if err != nil {
		return err
	}

	var seqVal int64 = 1
	var isCalled bool = false
	if maxID.Valid {
		seqVal = maxID.Int64
		isCalled = true
	}

	_, err = tx.Exec(fmt.Sprintf(`SELECT setval('users_id_seq', %d, %t)`, seqVal, isCalled))
	if err != nil {
		return err
	}

	return tx.Commit()
}
