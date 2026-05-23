package store

import (
	"database/sql"
	"fmt"
	"log"
)

func Migrate(db *sql.DB) error {
	log.Println("running migrations…")

	steps := []struct {
		name string
		sql  string
	}{
		{"create categories", `
			CREATE TABLE IF NOT EXISTS categories (
				id   SERIAL       PRIMARY KEY,
				name VARCHAR(100) NOT NULL,
				icon VARCHAR(100) NOT NULL
			)`},
		{"create products", `
			CREATE TABLE IF NOT EXISTS products (
				id          SERIAL        PRIMARY KEY,
				name        VARCHAR(200)  NOT NULL,
				category_id INT           NOT NULL REFERENCES categories(id),
				price       NUMERIC(10,2) NOT NULL,
				old_price   NUMERIC(10,2),
				badge       VARCHAR(50),
				icon        VARCHAR(100)  NOT NULL,
				image_url   TEXT
			)`},
		{"create users", `
			CREATE TABLE IF NOT EXISTS users (
				id      SERIAL       PRIMARY KEY,
				name    VARCHAR(200) NOT NULL,
				email   VARCHAR(200) NOT NULL,
				address TEXT
			)`},
		{"create orders", `
			CREATE TABLE IF NOT EXISTS orders (
				id      SERIAL      PRIMARY KEY,
				user_id INT         NOT NULL REFERENCES users(id),
				date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				status  VARCHAR(20) NOT NULL DEFAULT 'pending'
				        CHECK (status IN ('pending','delivered'))
			)`},
		{"create order_items", `
			CREATE TABLE IF NOT EXISTS order_items (
				id         SERIAL        PRIMARY KEY,
				order_id   INT           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
				product_id INT           NOT NULL REFERENCES products(id),
				qty        INT           NOT NULL CHECK (qty > 0),
				price      NUMERIC(10,2) NOT NULL
			)`},
		{"seed categories", `
			INSERT INTO categories (id, name, icon) VALUES
				(1, 'Tops',      'shirt'),
				(2, 'Bottoms',   'scissors'),
				(3, 'Outerwear', 'wind'),
				(4, 'Footwear',  'footprints'),
				(5, 'Accessories', 'sparkles')
			ON CONFLICT (id) DO NOTHING`},
		{"seed products", `
			INSERT INTO products (id, name, category_id, price, old_price, badge, icon) VALUES
				-- Tops (5)
				(1,  'Mini Stripe Tee',        1,  18.00, NULL,   'New',  'shirt'),
				(2,  'Floral Puff Blouse',     1,  24.00, 32.00,   NULL,  'shirt'),
				(3,  'Cozy Knit Sweater',      1,  36.00, NULL,   'Hot',  'shirt'),
				(4,  'Denim Shirt',            1,  28.00, NULL,    NULL,  'shirt'),
				(5,  'Ruffle Crop Top',        1,  22.00, 28.00,  'Sale', 'shirt'),
				-- Bottoms (5)
				(6,  'Pleated Mini Skirt',     2,  26.00, NULL,   'New',  'scissors'),
				(7,  'Slim Chino Pants',       2,  32.00, 40.00,   NULL,  'scissors'),
				(8,  'Flare Denim Jeans',      2,  38.00, NULL,   'Hot',  'scissors'),
				(9,  'Linen Shorts',           2,  22.00, NULL,    NULL,  'scissors'),
				(10, 'Cargo Joggers',          2,  34.00, 42.00,  'Sale', 'scissors'),
				-- Outerwear (5)
				(11, 'Puffer Vest',            3,  48.00, NULL,   'New',  'wind'),
				(12, 'Wool Blend Coat',        3,  72.00, 90.00,   NULL,  'wind'),
				(13, 'Denim Jacket',           3,  54.00, NULL,   'Hot',  'wind'),
				(14, 'Raincoat',               3,  46.00, NULL,    NULL,  'wind'),
				(15, 'Fleece Hoodie',          3,  38.00, 48.00,  'Sale', 'wind'),
				-- Footwear (5)
				(16, 'Mini Sneakers',          4,  42.00, NULL,   'New',  'footprints'),
				(17, 'Mary Jane Flats',        4,  36.00, 45.00,   NULL,  'footprints'),
				(18, 'Chelsea Boots',          4,  58.00, NULL,   'Hot',  'footprints'),
				(19, 'Sandals',                4,  28.00, NULL,    NULL,  'footprints'),
				(20, 'Rain Boots',             4,  44.00, 52.00,  'Sale', 'footprints'),
				-- Accessories (4)
				(21, 'Bow Hair Clips Set',     5,  12.00, NULL,   'New',  'sparkles'),
				(22, 'Knit Beanie',            5,  16.00, 20.00,   NULL,  'sparkles'),
				(23, 'Mini Backpack',          5,  38.00, NULL,   'Hot',  'sparkles'),
				(24, 'Sunglasses',             5,  22.00, 28.00,  'Sale', 'sparkles')
			ON CONFLICT (id) DO NOTHING`},
		{"reset sequences", `
			SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
			SELECT setval('products_id_seq',   (SELECT MAX(id) FROM products))`},
	}

	for _, step := range steps {
		if _, err := db.Exec(step.sql); err != nil {
			return fmt.Errorf("migration %q: %w", step.name, err)
		}
		log.Printf("  ✓ %s", step.name)
	}

	log.Println("migrations complete")
	return nil
}
