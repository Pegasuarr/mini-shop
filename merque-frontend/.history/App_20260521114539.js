/* ═══════════════════════════════════════════════
   MERQE — Application Logic (Full E‑commerce)
   ═══════════════════════════════════════════════ */

// Icon mapping for products (using Lucide names)
const PRODUCT_ICONS = {
  1: "lamp", 2: "sun-dim", 3: "lightbulb", 4: "lamp-ceiling", 5: "flashlight",
  6: "armchair", 7: "library", 8: "bed-double", 9: "layout-panel-left", 10: "door-open",
  11: "coffee", 12: "utensils", 13: "cup-soda", 14: "flame", 15: "slice",
  16: "notebook", 17: "pen-line", 18: "bookmark", 19: "ruler", 20: "scissors",
  21: "layers", 22: "shirt", 23: "wind", 24: "square", 25: "grip"
};

const CAT_ICONS = { 1: "lamp", 2: "armchair", 3: "utensils", 4: "pencil", 5: "shirt" };

// ── DATABASE ─────────────────────────────────────────────────────────
const DB = {
  categories: [
    { id: 1, name: "Lighting" }, { id: 2, name: "Furniture" },
    { id: 3, name: "Kitchen" }, { id: 4, name: "Stationery" }, { id: 5, name: "Textiles" }
  ],
  products: [
    { id: 1, name: "Arc Floor Lamp", categoryId: 1, price: 149, badge: "New" },
    { id: 2, name: "Brass Pendant Light", categoryId: 1, price: 89 },
    { id: 3, name: "Edison Bulb Set", categoryId: 1, price: 34, oldPrice: 45 },
    { id: 4, name: "Ceiling Spotlight", categoryId: 1, price: 112, badge: "Sale" },
    { id: 5, name: "Bedside Task Lamp", categoryId: 1, price: 67 },
    { id: 6, name: "Teak Side Table", categoryId: 2, price: 229, oldPrice: 280 },
    { id: 7, name: "Oak Bookshelf", categoryId: 2, price: 349, oldPrice: 420 },
    { id: 8, name: "Linen Bed Frame", categoryId: 2, price: 589, badge: "New" },
    { id: 9, name: "Wall Shelf Unit", categoryId: 2, price: 175 },
    { id: 10, name: "Entryway Cabinet", categoryId: 2, price: 299, badge: "Hot" },
    { id: 11, name: "Pour-Over Set", categoryId: 3, price: 64, badge: "Hot" },
    { id: 12, name: "Ceramic Mug", categoryId: 3, price: 38 },
    { id: 13, name: "Chef's Knife", categoryId: 3, price: 95, oldPrice: 120 },
    { id: 14, name: "Cast Iron Pan", categoryId: 3, price: 149 },
    { id: 15, name: "Marble Cutting Board", categoryId: 3, price: 72, badge: "New" },
    { id: 16, name: "Linen Notebook", categoryId: 4, price: 28 },
    { id: 17, name: "Desk Pen Cup", categoryId: 4, price: 22 },
    { id: 18, name: "Leather Bookmark Set", categoryId: 4, price: 18, oldPrice: 26 },
    { id: 19, name: "Brass Ruler", categoryId: 4, price: 32, badge: "New" },
    { id: 20, name: "Washi Tape Set", categoryId: 4, price: 14 },
    { id: 21, name: "Wool Throw", categoryId: 5, price: 119, badge: "New" },
    { id: 22, name: "Linen Cushion", categoryId: 5, price: 55 },
    { id: 23, name: "Cotton Duvet Cover", categoryId: 5, price: 189, oldPrice: 230 },
    { id: 24, name: "Boucle Bath Mat", categoryId: 5, price: 48 },
    { id: 25, name: "Merino Blanket", categoryId: 5, price: 215, badge: "Hot" }
  ],
  orders: [],
  nextOrderId: 1
};

let cart = [];        // { productId, qty }
let filter = 0;       // 0 = all categories

// helpers
const getCat = id => DB.categories.find(c => c.id === id);
const getProd = id => DB.products.find(p => p.id === id);
const fmt = n => "$" + n.toFixed(2);
const icon = (name, size = 20, extra = "") => `<i data-lucide="${name}" style="width:${size}px;height:${size}px;${extra}"></i>`;

function cartTotal() {
  return cart.reduce((sum, i) => sum + getProd(i.productId).price * i.qty, 0);
}

function updateCartBadge() {
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById("cart-count").textContent = totalQty;
}

function rerenderIcons() { lucide.createIcons(); }

// ── VIEW SWITCHING ─────────────────────────────────────────────────
function showView(name, btn) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  document.getElementById("view-" + name).classList.add("active");
  if (btn) btn.classList.add("active");
  if (name === "cart") renderCart();
 