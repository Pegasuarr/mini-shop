package models

type CreateOrderRequest struct {
	Name    string      `json:"name"`
	Email   string      `json:"email"`
	Address string      `json:"address"`
	Items   []OrderItem `json:"items"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}
