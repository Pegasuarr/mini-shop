package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/merqe/backend/internal/models"
)

// HandleOrders serves:
//
//	GET  /api/orders  → list all orders
//	POST /api/orders  → create a new order
func (h *Handler) HandleOrders(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, h.store.GetOrders())
	case http.MethodPost:
		h.createOrder(w, r)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// HandleOrderByID serves:
//
//	GET   /api/orders/:id  → get single order
//	PATCH /api/orders/:id  → update order status
func (h *Handler) HandleOrderByID(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(lastSegment(r.URL.Path))
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid order id")
		return
	}
	switch r.Method {
	case http.MethodGet:
		h.getOrder(w, id)
	case http.MethodPatch:
		h.updateOrderStatus(w, r, id)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// createOrder validates the request body, locks prices server-side, and persists.
func (h *Handler) createOrder(w http.ResponseWriter, r *http.Request) {
	var req models.CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if strings.TrimSpace(req.Name) == "" ||
		strings.TrimSpace(req.Email) == "" ||
		strings.TrimSpace(req.Address) == "" {
		writeError(w, http.StatusBadRequest, "name, email and address are required")
		return
	}
	if len(req.Items) == 0 {
		writeError(w, http.StatusBadRequest, "order must contain at least one item")
		return
	}

	// Validate items and lock price from server-side store
	items := make([]models.OrderItem, 0, len(req.Items))
	for _, item := range req.Items {
		if item.Qty <= 0 {
			writeError(w, http.StatusBadRequest, "item qty must be > 0")
			return
		}
		p, err := h.store.GetProductByID(item.ProductID)
		if err != nil {
			writeError(w, http.StatusBadRequest, "product not found: "+strconv.Itoa(item.ProductID))
			return
		}
		items = append(items, models.OrderItem{
			ProductID: p.ID,
			Qty:       item.Qty,
			Price:     p.Price, // always use server-side price
		})
	}

	user := h.store.CreateUser(req.Name, req.Email, req.Address)
	order := h.store.CreateOrder(models.Order{
		UserID: user.ID,
		User:   user,
		Date:   time.Now().UTC(),
		Status: models.StatusPending,
		Items:  items,
	})
	writeJSON(w, http.StatusCreated, order)
}

func (h *Handler) getOrder(w http.ResponseWriter, id int) {
	o, err := h.store.GetOrderByID(id)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, o)
}

func (h *Handler) updateOrderStatus(w http.ResponseWriter, r *http.Request, id int) {
	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	status := models.OrderStatus(body.Status)
	if status != models.StatusPending && status != models.StatusDelivered {
		writeError(w, http.StatusBadRequest, "status must be 'pending' or 'delivered'")
		return
	}
	o, err := h.store.UpdateOrderStatus(id, status)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, o)
}
