package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/merqe/backend/internal/models"
)

func (h *Handler) HandleOrders(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		orders, err := h.store.GetOrders()
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to fetch orders")
			return
		}
		writeJSON(w, http.StatusOK, orders)
	case http.MethodPost:
		h.createOrder(w, r)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

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
			Price:     p.Price,
		})
	}

	user, err := h.store.CreateUser(req.Name, req.Email, req.Address)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	order, err := h.store.CreateOrder(user.ID, user, time.Now().UTC(), items)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create order")
		return
	}

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