package handler

import (
	"net/http"
	"time"

	"github.com/merqe/backend/internal/models"
)

// HandleDailyReport handles the daily purchase report endpoint
func (h *Handler) HandleDailyReport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	// Parse query parameters
	date := r.URL.Query().Get("date")
	startDate := r.URL.Query().Get("startDate")
	endDate := r.URL.Query().Get("endDate")

	// Get all orders
	orders, err := h.store.GetOrders()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch orders")
		return
	}

	// Get all products for product names
	products, err := h.store.GetProducts(0)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch products")
		return
	}

	// Create product map for quick lookup
	productMap := make(map[int]models.Product)
	for _, p := range products {
		productMap[p.ID] = p
	}

	// Filter orders by date
	filteredOrders := h.filterOrdersByDate(orders, date, startDate, endDate)

	// Build report response
	report := h.buildReport(filteredOrders, productMap, startDate, endDate, date)

	writeJSON(w, http.StatusOK, report)
}

// filterOrdersByDate filters orders based on date parameters
func (h *Handler) filterOrdersByDate(orders []models.Order, date, startDate, endDate string) []models.Order {
	var filtered []models.Order

	if date != "" {
		// Filter by single date
		targetDate, err := time.Parse("2006-01-02", date)
		if err != nil {
			return filtered
		}
		targetDateStr := targetDate.Format("2006-01-02")

		for _, order := range orders {
			orderDateStr := order.Date.Format("2006-01-02")
			if orderDateStr == targetDateStr {
				filtered = append(filtered, order)
			}
		}
	} else if startDate != "" && endDate != "" {
		// Filter by date range
		start, err := time.Parse("2006-01-02", startDate)
		if err != nil {
			return filtered
		}
		end, err := time.Parse("2006-01-02", endDate)
		if err != nil {
			return filtered
		}
		end = end.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

		for _, order := range orders {
			if order.Date.After(start) && order.Date.Before(end) {
				filtered = append(filtered, order)
			}
		}
	} else {
		// Default to today
		today := time.Now().Format("2006-01-02")
		for _, order := range orders {
			orderDateStr := order.Date.Format("2006-01-02")
			if orderDateStr == today {
				filtered = append(filtered, order)
			}
		}
	}

	return filtered
}

// buildReport creates a DailyReportResponse from filtered orders
func (h *Handler) buildReport(orders []models.Order, productMap map[int]models.Product, startDate, endDate, date string) models.DailyReportResponse {
	report := models.DailyReportResponse{
		Orders: []models.ReportOrder{},
	}

	// Build summary
	uniqueCustomers := make(map[string]bool)
	totalItems := 0
	totalRevenue := 0.0

	for _, order := range orders {
		uniqueCustomers[order.User.Email] = true
		orderTotal := h.calculateOrderTotal(order)
		totalRevenue += orderTotal

		// Count items
		for _, item := range order.Items {
			totalItems += item.Qty
		}

		// Build report order
		reportOrder := models.ReportOrder{
			ID:       order.ID,
			Customer: order.User.Name,
			Email:    order.User.Email,
			Address:  order.User.Address,
			Total:    orderTotal,
			Status:   string(order.Status),
			Date:     order.Date,
			Items:    []models.ReportOrderItem{},
		}

		// Add items
		for _, item := range order.Items {
			product, exists := productMap[item.ProductID]
			productName := "Unknown Product"
			if exists {
				productName = product.Name
			}

			reportOrder.Items = append(reportOrder.Items, models.ReportOrderItem{
				ProductName: productName,
				ProductID:   item.ProductID,
				Quantity:    item.Qty,
				Price:       item.Price,
				Subtotal:    item.Price * float64(item.Qty),
			})
		}

		report.Orders = append(report.Orders, reportOrder)
	}

	// Set summary
	report.Summary = models.ReportSummary{
		TotalOrders:     len(orders),
		TotalRevenue:    totalRevenue,
		TotalItems:      totalItems,
		UniqueCustomers: len(uniqueCustomers),
	}

	// Set date range
	if date != "" {
		report.DateRange = models.DateRange{
			Start: date,
			End:   date,
		}
	} else if startDate != "" && endDate != "" {
		report.DateRange = models.DateRange{
			Start: startDate,
			End:   endDate,
		}
	} else {
		today := time.Now().Format("2006-01-02")
		report.DateRange = models.DateRange{
			Start: today,
			End:   today,
		}
	}

	return report
}

// calculateOrderTotal calculates the total of an order
func (h *Handler) calculateOrderTotal(order models.Order) float64 {
	total := 0.0
	for _, item := range order.Items {
		total += item.Price * float64(item.Qty)
	}
	return total
}