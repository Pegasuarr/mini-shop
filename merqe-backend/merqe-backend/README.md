# MERQE — Go Backend

REST API backend for the MERQE shop. Built with Go standard library only — zero external dependencies.

## Project Structure

```
merqe-backend/
├── cmd/server/
│   └── main.go              # Entry point, middleware, graceful shutdown
├── internal/
│   ├── models/
│   │   └── models.go        # Domain structs (Category, Product, User, Order)
│   ├── store/
│   │   └── store.go         # Thread-safe in-memory store, seeded with 25 products
│   └── handler/
│       └── handler.go       # HTTP handlers for all routes
├── static/                  # Place index.html, style.css, app.js here
├── go.mod
└── README.md
```

## Getting Started

```bash
# Run (default port 8080)
go run ./cmd/server

# Custom port
PORT=3000 go run ./cmd/server

# Build binary
go build -o merqe ./cmd/server
./merqe
```

## Serving the Frontend

Copy `index.html`, `style.css`, and `app.js` into the `static/` folder.
The server will serve them at `http://localhost:8080/`.

---

## API Reference

### Categories

| Method | Endpoint           | Description          |
|--------|--------------------|----------------------|
| GET    | /api/categories    | List all categories  |

**Response**
```json
[
  { "id": 1, "name": "Lighting", "icon": "lamp" },
  "..."
]
```

---

### Products

| Method | Endpoint                          | Description                      |
|--------|-----------------------------------|----------------------------------|
| GET    | /api/products                     | List all 25 products             |
| GET    | /api/products?categoryId=1        | Filter by category               |
| GET    | /api/products/:id                 | Get single product               |

**Response — single product**
```json
{
  "id": 1,
  "name": "Arc Floor Lamp",
  "categoryId": 1,
  "price": 149,
  "oldPrice": null,
  "badge": "New",
  "icon": "lamp"
}
```

---

### Users

| Method | Endpoint        | Description      |
|--------|-----------------|------------------|
| GET    | /api/users/:id  | Get user by ID   |

---

### Orders

| Method | Endpoint          | Description             |
|--------|-------------------|-------------------------|
| GET    | /api/orders       | List all orders         |
| POST   | /api/orders       | Place a new order       |
| GET    | /api/orders/:id   | Get single order        |
| PATCH  | /api/orders/:id   | Update order status     |

**POST /api/orders — Request body**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "address": "123 Main St, City",
  "items": [
    { "productId": 1, "qty": 2 },
    { "productId": 11, "qty": 1 }
  ]
}
```

**POST /api/orders — Response (201)**
```json
{
  "id": 1,
  "userId": 2,
  "user": { "id": 2, "name": "Jane Doe", "email": "jane@example.com", "address": "123 Main St" },
  "date": "2026-05-21T10:00:00Z",
  "status": "pending",
  "items": [
    { "productId": 1, "qty": 2, "price": 149 },
    { "productId": 11, "qty": 1, "price": 64 }
  ]
}
```

**PATCH /api/orders/:id — Request body**
```json
{ "status": "delivered" }
```

---

## Notes

- Prices are always locked server-side on order creation — client-supplied prices are ignored.
- Data is in-memory and resets on server restart. Swap `store.go` for a database driver to persist.
- CORS is open (`*`) for local development. Restrict the origin in production.
