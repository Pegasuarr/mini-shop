package store

import (
	"fmt"

	"github.com/merqe/backend/internal/models"
)

// GetOrders returns all orders, newest first.
func (s *Store) GetOrders() []models.Order {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.Order, len(s.orders))
	copy(out, s.orders)
	return out
}

// GetOrderByID returns the order with the given ID or an error if not found.
func (s *Store) GetOrderByID(id int) (models.Order, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, o := range s.orders {
		if o.ID == id {
			return o, nil
		}
	}
	return models.Order{}, fmt.Errorf("order %d not found", id)
}

// CreateOrder assigns an ID to the order, prepends it to the list, and returns it.
func (s *Store) CreateOrder(o models.Order) models.Order {
	s.mu.Lock()
	defer s.mu.Unlock()
	o.ID = s.nextOrderID
	s.nextOrderID++
	s.orders = append([]models.Order{o}, s.orders...)
	return o
}

// UpdateOrderStatus changes the status of the given order and returns it.
func (s *Store) UpdateOrderStatus(id int, status models.OrderStatus) (models.Order, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, o := range s.orders {
		if o.ID == id {
			s.orders[i].Status = status
			return s.orders[i], nil
		}
	}
	return models.Order{}, fmt.Errorf("order %d not found", id)
}
