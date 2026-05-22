/* ═══════════════════════════════════════════════
   MERQE — Application Logic
   ═══════════════════════════════════════════════ */

// ── PRODUCT ICONS (Lucide icon names) ────────────────────────────────
const PRODUCT_ICONS = {
  // Lighting
  1:  "lamp",
  2:  "sun-dim",
  3:  "lightbulb",
  4:  "lamp-ceiling",
  5:  "flashlight",
  // Furniture
  6:  "armchair",
  7:  "library",
  8:  "bed-double",
  9:  "layout-panel-left",
  10: "door-open",
  // Kitchen
  11: "coffee",
  12: "utensils",
  13: "cup-soda",
  14: "flame",
  15: "slice",
  // Stationery
  16: "notebook",
  17: "pen-line",
  18: "bookmark",
  19: "ruler",
  20: "scissors",
  // Textiles
  21: "layers",
  22: "shirt",
  23: "wind",
  24: "square",
  25: "grip"
};

const CAT_ICONS = {
  1: "lamp",
  2: "armchair",
  3: "utensils",
  4: "pencil",
  5: "shirt"
};

// ── DATABASE ─────────────────────────────────────────────────────────
const DB = {
  users: [{ id: 1, name: "Guest User", email: "guest@merqe.com" }],
  categories: [
    { id: 1, name: "Lighting" },
    { id: 2, name: "Furniture" },
    { id: 3, name: "Kitchen" },
    { id: 4, name: "Stationery" },
    { id: 5, name: "Textiles" }
  ],
  products: [
    // ── Lighting (5) ─────────────────────────────────────────────────
    { id: 1,  name: "Arc Floor Lamp",       categoryId: 1, price: 149, badge: "New" },
    { id: 2,  name: "Brass Pendant Light",  categoryId: 1, price: 89 },
    { id: 3,  name: "Edison Bulb Set",      categoryId: 1, price: 34,  oldPrice: 45 },
    { id: 4,  name: "Ceiling Spotlight",    categoryId: 1, price: 112, badge: "Sale" },
    { id: 5,  name: "Bedside Task Lamp",    categoryId: 1, price: 67 },
    // ── Furniture (5) ────────────────────────────────────────────────
    { id: 6,  name: "Teak Side Table",      categoryId: 2, price: 229, oldPrice: 280 },
    { id: 7,  name: "Oak Bookshelf",        categoryId: 2, price: 349, oldPrice: 420 },
    { id: 8,  name: "Linen Bed Frame",      categoryId: 2, price: 589, badge: "New" },
    { id: 9,  name: "Wall Shelf Unit",      categoryId: 2, price: 175 },
    { id: 10, name: "Entryway Cabinet",     categoryId: 2, price: 299, badge: "Hot" },
    // ── Kitchen (5) ──────────────────────────────────────────────────
    { id: 11, name: "Pour-Over Set",        categoryId: 3, price: 64,  badge: "Hot" },
    { id: 12, name: "Ceramic Mug",          categoryId: 3, price: 38 },
    { id: 13, name: "Chef's Knife",         categoryId: 3, price: 95,  oldPrice: 120 },
    { id: 14, name: "Cast Iron Pan",        categoryId: 3, price: 149 },
    { id: 15, name: "Marble Cutting Board", categoryId: 3, price: 72,  badge: "New" },
    // ── Stationery (5) ───────────────────────────────────────────────
    { id: 16, name: "Linen Notebook",       categoryId: 4, price: 28 },
    { id: 17, name: "Desk Pen Cup",         categoryId: 4, price: 22 },
    { id: 18, name: "Leather Bookmark Set", categoryId: 4, price: 18,  oldPrice: 26 },
    { id: 19, name: "Brass Ruler",          categoryId: 4, price: 32,  badge: "New" },
    { id: 20, name: "Washi Tape Set",       categoryId: 4, price: 14 },
    // ── Textiles (5) ─────────────────────────────────────────────────
    { id: 21, name: "Wool Throw",           categoryId: 5, price: 119, badge: "New" },
    { id: 22, name: "Linen Cushion",        categoryId: 5, price: 55 },
    { id: 23, name: "Cotton Duvet Cover",   categoryId: 5, price: 189, oldPrice: 230 },
    { id: 24, name: "Boucle Bath Mat",      categoryId: 5, price: 48 },
    { id: 25, name: "Merino Blanket",       categoryId: 5, price: 215, badge: "Hot" }
  ],
  orders: [],
  nextOrderId: 1
};

// ── STATE ─────────────────────────────────────────────────────────────
let cart   = [];  // [{ productId, qty }]
let filter = 0;   // 0 = all categories

// ── HELPERS ───────────────────────────────────────────────────────────
const getCat  = id => DB.categories.find(c => c.id === id);
const getProd = id => DB.products.find(p => p.id === id);
const fmt     = n  => "$" + n.toFixed(2);
const icon    = (name, size = 20, extra = "") =>
  `<i data-lucide="${name}" style="width:${size}px;height:${size}px;${extra}"></i>`;

function cartTotal() {
  return cart.reduce((s, i) => s + getProd(i.productId).price * i.qty, 0);
}

function updateCartBadge() {
  const n = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById("cart-count").textContent = n;
}

function rerender() { lucide.createIcons(); }

// ── VIEWS ─────────────────────────────────────────────────────────────
function showView(name, btn) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  document.getElementById("view-" + name).classList.add("active");
  if (btn) btn.classList.add("active");
  if (name === "cart")   renderCart();
  if (name === "orders") renderOrders();
}

// ── SHOP ──────────────────────────────────────────────────────────────
function renderShop() {
  // Categories bar
  const bar = document.getElementById("categories-bar");
  bar.innerHTML = `<button class="cat-tag ${filter === 0 ? "active" : ""}" onclick="setFilter(0)">
    ${icon("layout-grid", 12)} All
  </button>`;
  DB.categories.forEach(c => {
    bar.innerHTML += `<button class="cat-tag ${filter === c.id ? "active" : ""}" onclick="setFilter(${c.id})">
      ${icon(CAT_ICONS[c.id] || "tag", 12)} ${c.name}
    </button>`;
  });

  // Products grid
  const grid = document.getElementById("products-grid");
  const visible = filter ? DB.products.filter(p => p.categoryId === filter) : DB.products;
  const iconName = p => PRODUCT_ICONS[p.id] || "box";

  grid.innerHTML = visible.map(p => {
    const cat = getCat(p.categoryId);
    const inCart = cart.find(i => i.productId === p.id);
    return `
      <div class="product-card">
        <div class="product-img">
          ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
          ${icon(iconName(p), 56, "stroke:#555;stroke-width:1.1")}
        </div>
        <div class="product-info">
          <div class="product-cat">
            ${icon(CAT_ICONS[p.categoryId] || "tag", 10, "stroke:var(--accent)")}
            ${cat.name}
          </div>
          <div class="product-name">${p.name}</div>
          <div class="product-price">
            ${fmt(p.price)}
            ${p.oldPrice ? `<span class="old">${fmt(p.oldPrice)}</span>` : ""}
          </div>
          <button class="add-btn" onclick="addToCart(${p.id})">
            ${inCart
              ? `${icon("check", 13, "stroke:inherit")} In Cart (${inCart.qty}) — Add More`
              : `${icon("plus", 13, "stroke:inherit")} Add to Cart`}
          </button>
        </div>
      </div>`;
  }).join("");

  rerender();
}

function setFilter(id) { filter = id; renderShop(); }

function addToCart(productId) {
  const existing = cart.find(i => i.productId === productId);
  if (existing) existing.qty++;
  else cart.push({ productId, qty: 1 });
  updateCartBadge();
  renderShop();
  showToast("Added to cart");
}

// ── CART ──────────────────────────────────────────────────────────────
function renderCart() {
  const el = document.getElementById("cart-body");

  if (!cart.length) {
    el.innerHTML = `<div class="cart-empty">
      ${icon("shopping-cart", 56, "stroke:var(--border)")}
      <div style="margin-top:16px">Your cart is empty.</div>
    </div>`;
    rerender();
    return;
  }

  const rows = cart.map(i => {
    const p = getProd(i.productId);
    const cat = getCat(p.categoryId);
    return `
      <div class="cart-item">
        <div class="cart-item-img">
          ${icon(PRODUCT_ICONS[p.id] || "box", 32, "stroke:#555;stroke-width:1.2")}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-cat">${cat.name}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty(${p.id}, -1)">
            <i data-lucide="minus" style="width:13px;height:13px"></i>
          </button>
          <span class="qty-num">${i.qty}</span>
          <button class="qty-btn" onclick="changeQty(${p.id}, 1)">
            <i data-lucide="plus" style="width:13px;height:13px"></i>
          </button>
          <button class="remove-btn" onclick="removeFromCart(${p.id})">
            <i data-lucide="trash-2" style="width:16px;height:16px"></i>
          </button>
        </div>
        <div class="cart-item-price">${fmt(p.price * i.qty)}</div>
      </div>`;
  }).join("");

  const tax = cartTotal() * 0.08;
  const shipping = 9.99;
  el.innerHTML = rows + `
    <div class="cart-summary">
      <div class="summary-row"><span>Subtotal</span><span>${fmt(cartTotal())}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${fmt(shipping)}</span></div>
      <div class="summary-row"><span>Tax (8%)</span><span>${fmt(tax)}</span></div>
      <div class="summary-row total"><span>Total</span><span>${fmt(cartTotal() + tax + shipping)}</span></div>
      <button class="checkout-btn" onclick="openCheckout()">
        <i data-lucide="arrow-right" style="width:16px;height:16px;stroke:#000"></i>
        Proceed to Checkout
      </button>
    </div>`;
  rerender();
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.productId === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.productId !== productId);
  updateCartBadge();
  renderCart();
  renderShop();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.productId !== productId);
  updateCartBadge();
  renderCart();
  renderShop();
}

// ── CHECKOUT ──────────────────────────────────────────────────────────
function openCheckout() {
  if (!cart.length) return;
  document.getElementById("checkout-modal").style.display = "block";
  rerender();
}

function closeModal() {
  document.getElementById("checkout-modal").style.display = "none";
}

function placeOrder() {
  const name    = document.getElementById("f-name").value.trim();
  const email   = document.getElementById("f-email").value.trim();
  const address = document.getElementById("f-address").value.trim();
  if (!name || !email || !address) { showToast("Please fill all fields"); return; }

  const order = {
    id: DB.nextOrderId++,
    userId: 1,
    user: { name, email, address },
    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    status: "pending",
    items: cart.map(i => ({
      productId: i.productId,
      qty: i.qty,
      price: getProd(i.productId).price
    }))
  };
  DB.orders.unshift(order);

  cart = [];
  updateCartBadge();
  renderShop();
  closeModal();
  ["f-name", "f-email", "f-address"].forEach(id => document.getElementById(id).value = "");

  showToast(`Order #${order.id} placed!`);
  setTimeout(() => showView("orders", document.querySelectorAll("nav button")[2]), 600);
}

// ── ORDERS ────────────────────────────────────────────────────────────
function renderOrders() {
  const el = document.getElementById("orders-body");

  if (!DB.orders.length) {
    el.innerHTML = `<div class="cart-empty">
      ${icon("package", 56, "stroke:var(--border)")}
      <div style="margin-top:16px">No orders yet.</div>
    </div>`;
    rerender();
    return;
  }

  el.innerHTML = DB.orders.map(o => {
    const total = o.items.reduce((s, i) => s + i.price * i.qty, 0);
    const itemRows = o.items.map(i => {
      const p = getProd(i.productId);
      return `<div class="order-item-row">
        <span class="item-name">
          ${icon(PRODUCT_ICONS[p.id] || "box", 14, "stroke:#555;stroke-width:1.2")}
          ${p.name} × ${i.qty}
        </span>
        <span>${fmt(i.price * i.qty)}</span>
      </div>`;
    }).join("");

    const statusIcon = o.status === "delivered" ? "check-circle" : "clock";
    return `
      <div class="order-card">
        <div class="order-header">
          <div class="order-id">
            <strong>Order #${o.id}</strong><br>${o.date} · ${o.user.name}
          </div>
          <span class="order-status status-${o.status}">
            ${icon(statusIcon, 10)}
            ${o.status}
          </span>
          <div class="order-total">${fmt(total)}</div>
        </div>
        <div class="order-items">${itemRows}</div>
      </div>`;
  }).join("");
  rerender();
}

// ── TOAST ─────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<i data-lucide="check-circle" style="width:15px;height:15px;stroke:#000"></i> ${msg}`;
  document.body.appendChild(t);
  lucide.createIcons({ nodes: [t] });
  setTimeout(() => t.remove(), 3100);
}

// ── INIT ──────────────────────────────────────────────────────────────
renderShop();
rerender();