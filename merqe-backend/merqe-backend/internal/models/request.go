package models

// CreateOrderRequest is the payload for POST /api/orders.
type CreateOrderRequest struct {
	Name    string      `json:"name"`
	Email   string      `json:"email"`
	Address string      `json:"address"`
	Items   []OrderItem `json:"items"`
}

// ErrorResponse is the standard error envelope.
type ErrorResponse struct {
	Error string `json:"error"`
}
