package models

import "time"

type OrderStatus string

const (
	StatusPending   OrderStatus = "pending"
	StatusDelivered OrderStatus = "delivered"
)

type OrderItem struct {
	ProductID int     `json:"productId"`
	Qty       int     `json:"qty"`
	Price     float64 `json:"price"`
}

type Order struct {
	ID     int         `json:"id"`
	UserID int         `json:"userId"`
	User   User        `json:"user"`
	Date   time.Time   `json:"date"`
	Status OrderStatus `json:"status"`
	Items  []OrderItem `json:"items"`
}
