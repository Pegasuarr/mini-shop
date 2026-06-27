package models

import "time"

// DailyReportRequest represents the request for daily report
type DailyReportRequest struct {
	Date      string `json:"date" form:"date"`
	StartDate string `json:"startDate" form:"startDate"`
	EndDate   string `json:"endDate" form:"endDate"`
}

// DailyReportResponse represents the daily report response
type DailyReportResponse struct {
	Summary   ReportSummary   `json:"summary"`
	Orders    []ReportOrder   `json:"orders"`
	DateRange DateRange       `json:"dateRange"`
}

// ReportSummary contains summary statistics
type ReportSummary struct {
	TotalOrders     int     `json:"totalOrders"`
	TotalRevenue    float64 `json:"totalRevenue"`
	TotalItems      int     `json:"totalItems"`
	UniqueCustomers int     `json:"uniqueCustomers"`
}

// ReportOrder represents an order in the report
type ReportOrder struct {
	ID       int               `json:"id"`
	Customer string            `json:"customer"`
	Email    string            `json:"email"`
	Address  string            `json:"address,omitempty"`
	Items    []ReportOrderItem `json:"items"`
	Total    float64           `json:"total"`
	Status   string            `json:"status"`
	Date     time.Time         `json:"date"`
}

// ReportOrderItem represents an item in a report order
type ReportOrderItem struct {
	ProductName string  `json:"productName"`
	ProductID   int     `json:"productId"`
	Quantity    int     `json:"quantity"`
	Price       float64 `json:"price"`
	Subtotal    float64 `json:"subtotal"`
}

// DateRange represents the date range for the report
type DateRange struct {
	Start string `json:"start"`
	End   string `json:"end"`
}