package store

import "github.com/merqe/backend/internal/models"

func ptr(f float64) *float64 { return &f }

// seed populates the store with reference data (categories, products, default user).
func (s *Store) seed() {
	s.seedCategories()
	s.seedProducts()
	s.seedUsers()
}

func (s *Store) seedCategories() {
	s.categories = []models.Category{
		{ID: 1, Name: "Lighting", Icon: "lamp"},
		{ID: 2, Name: "Furniture", Icon: "armchair"},
		{ID: 3, Name: "Kitchen", Icon: "utensils"},
		{ID: 4, Name: "Stationery", Icon: "pencil"},
		{ID: 5, Name: "Textiles", Icon: "shirt"},
	}
}

func (s *Store) seedProducts() {
	s.products = []models.Product{
		// ── Lighting ─────────────────────────────────────────────────
		{ID: 1, Name: "Arc Floor Lamp", CategoryID: 1, Price: 149, Badge: "New", Icon: "lamp"},
		{ID: 2, Name: "Brass Pendant Light", CategoryID: 1, Price: 89, Icon: "sun-dim"},
		{ID: 3, Name: "Edison Bulb Set", CategoryID: 1, Price: 34, OldPrice: ptr(45), Icon: "lightbulb"},
		{ID: 4, Name: "Ceiling Spotlight", CategoryID: 1, Price: 112, Badge: "Sale", Icon: "lamp-ceiling"},
		{ID: 5, Name: "Bedside Task Lamp", CategoryID: 1, Price: 67, Icon: "flashlight"},
		// ── Furniture ────────────────────────────────────────────────
		{ID: 6, Name: "Teak Side Table", CategoryID: 2, Price: 229, OldPrice: ptr(280), Icon: "armchair"},
		{ID: 7, Name: "Oak Bookshelf", CategoryID: 2, Price: 349, OldPrice: ptr(420), Icon: "library"},
		{ID: 8, Name: "Linen Bed Frame", CategoryID: 2, Price: 589, Badge: "New", Icon: "bed-double"},
		{ID: 9, Name: "Wall Shelf Unit", CategoryID: 2, Price: 175, Icon: "layout-panel-left"},
		{ID: 10, Name: "Entryway Cabinet", CategoryID: 2, Price: 299, Badge: "Hot", Icon: "door-open"},
		// ── Kitchen ──────────────────────────────────────────────────
		{ID: 11, Name: "Pour-Over Set", CategoryID: 3, Price: 64, Badge: "Hot", Icon: "coffee"},
		{ID: 12, Name: "Ceramic Mug", CategoryID: 3, Price: 38, Icon: "utensils"},
		{ID: 13, Name: "Chef's Knife", CategoryID: 3, Price: 95, OldPrice: ptr(120), Icon: "cup-soda"},
		{ID: 14, Name: "Cast Iron Pan", CategoryID: 3, Price: 149, Icon: "flame"},
		{ID: 15, Name: "Marble Cutting Board", CategoryID: 3, Price: 72, Badge: "New", Icon: "slice"},
		// ── Stationery ───────────────────────────────────────────────
		{ID: 16, Name: "Linen Notebook", CategoryID: 4, Price: 28, Icon: "notebook"},
		{ID: 17, Name: "Desk Pen Cup", CategoryID: 4, Price: 22, Icon: "pen-line"},
		{ID: 18, Name: "Leather Bookmark Set", CategoryID: 4, Price: 18, OldPrice: ptr(26), Icon: "bookmark"},
		{ID: 19, Name: "Brass Ruler", CategoryID: 4, Price: 32, Badge: "New", Icon: "ruler"},
		{ID: 20, Name: "Washi Tape Set", CategoryID: 4, Price: 14, Icon: "scissors"},
		// ── Textiles ─────────────────────────────────────────────────
		{ID: 21, Name: "Wool Throw", CategoryID: 5, Price: 119, Badge: "New", Icon: "layers"},
		{ID: 22, Name: "Linen Cushion", CategoryID: 5, Price: 55, Icon: "shirt"},
		{ID: 23, Name: "Cotton Duvet Cover", CategoryID: 5, Price: 189, OldPrice: ptr(230), Icon: "wind"},
		{ID: 24, Name: "Boucle Bath Mat", CategoryID: 5, Price: 48, Icon: "square"},
		{ID: 25, Name: "Merino Blanket", CategoryID: 5, Price: 215, Badge: "Hot", Icon: "grip"},
	}
}

func (s *Store) seedUsers() {
	s.users = []models.User{
		{ID: 1, Name: "Guest User", Email: "guest@merqe.com"},
	}
}
