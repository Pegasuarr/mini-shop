package models

type Product struct {
	ID         int      `json:"id"`
	Name       string   `json:"name"`
	CategoryID int      `json:"categoryId"`
	Price      float64  `json:"price"`
	OldPrice   *float64 `json:"oldPrice,omitempty"`
	Badge      string   `json:"badge,omitempty"`
	Icon       string   `json:"icon"`
	ImageURL   string   `json:"imageUrl,omitempty"`
}