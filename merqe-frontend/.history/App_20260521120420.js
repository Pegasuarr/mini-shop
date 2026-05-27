/* ═══════════════════════════════════════════════
   MINI MERQE — Complete E-commerce Logic
   ═══════════════════════════════════════════════ */

// ==================== DATABASE (Frontend only) ====================
const DB = {
  categories: [
    { id: 1, name: "Luxury Wear", icon: "crown" },
    { id: 2, name: "Baby Collection", icon: "baby" },
    { id: 3, name: "Kids Essentials", icon: "shirt" }
  ],
  products: [
    { id: 1, name: "Mini Trench Coat", categoryId: 1, price: 189, badge: "New", icon: "shirt" },
    { id: 2, name: "Cashmere Cardigan", categoryId: 1, price: 149, oldPrice: 210, icon: "heart" },
    { id: 3, name: "Velvet Blazer", categoryId: 1, price: 129, badge: "Hot", icon: "crown" },
    { id: 4, name: "Organic Jumpsuit", categoryId: 2, price: 59, badge: "Sale", icon: "baby" },
    { id: 5, name: "Silk Pajamas Set", categoryId: 2, price: 89, icon: "moon" },
    { id: 6, name: "Bamboo Romper", categoryId: 2, price: 49, oldPrice: 68, icon: "leaf" },
    { id: 7, name: "Denim Overalls", categoryId: 3, price: 79, badge: "New", icon: "shirt" },
    { id: 8, name: "Cotton Sweater", categoryId: 3, price: 65, icon: "wind" },
    { id: 9, name: "Puffer Jacket", categoryId: 3, price: 119, icon: "cloud-snow" }
  ],
  users: [{ id: 1, name: "Guest User", email: "guest@minimerqe.com" }],
  orders: [],
  nextOrderId: 1
};

// ==================== GLOBAL STATE ====================
let cart = [];        // { productId, qty }
let currentFilter = 0;  // 0 = all categories

// ==================== HELPER FUNCTIONS ====================
const getCategory = (id) => DB.categories.find(c => c.id === id);
const getProduct = (id) => DB.products.find(p => p.id === id);
const formatPrice = (n) => "$" + n.toFixed(2);

const getProductIcon = (productId) => {
  const p = getProduct(productId);
  return p?.icon || "gift";
};

const getCategoryIcon = (catId) => {
  const cat = getCategory(catId);
  return cat?.icon || "tag";
};

const cartTotal = () => {
  return cart.reduce((sum, item) => sum + getProduct(item.productId).price * item.qty, 0);
};

const updateCartBadge = () => {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = totalItems;
};

const renderIcons = () => {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
};

const showToast = (message, isError = false) => {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.background = isError ? "#e74c3c" : "var(--accent)";
  toast.innerHTML = `<i data-lucide="${isError ? "alert-circle" : "check-circle"}"></i> ${message}`;
  document.body.appendChild(toast);
  renderIcons();
  setTimeout(() => toast.remove(), 3000);
};

// ==================== VIEW NAVIGATION ====================
function showView(viewName) {
  // Hide all views
  document.querySelectorAll(".view").forEach(view => {
    view.classList.remove("active");
  });
  
  // Show selected view
  const activeView = document.getElementById(`view-${viewName}`);
  if (activeView) activeView.classList.add("active");
  
  // Update active nav button
  document.querySelectorAll("nav button, .cart-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  document.querySelectorAll(`nav button[data-view="${viewName}"], .cart-btn[data-view="${viewName}"]`).forEach(btn => {
    btn.classList.add("active");
  });
  
  // Render content based on view
  if (viewName === "cart") renderCart();
  if (viewName === "orders") renderOrders();
  
  renderIcons();
}

// ==================== SHOP RENDERING ====================
function renderShop() {
  const categoriesBar = document.getElementById("categories-bar");
  if (!categoriesBar) return;
  
  // Render category filters
  categoriesBar.innerHTML = `
    <button class="cat-tag ${currentFilter === 0 ? "active" : ""}" data-cat-id="0">
      <i data-lucide="grid"></i> All
    </button>
    ${DB.categories.map(cat => `
      <button class="cat-tag ${currentFilter === cat.id ? "active" : ""}" data-cat-id="${cat.id}">
        <i data-lucide="${cat.icon}"></i> ${cat.name}
      </button>
    `).join("")}
  `;
  
  // Add click handlers to category buttons
  document.querySelectorAll(".cat-tag").forEach(btn => {
    btn.addEventListener("click", () => {
      currentFilter = parseInt(btn.dataset.catId);
      renderShop();
    });
  });
  
  // Filter products
  const filteredProducts = currentFilter === 0 
    ? DB.products 
    : DB.products.filter(p => p.categoryId === currentFilter);
  
  // Render products grid
  const productsGrid = document.getElementById("products-grid");
  if (!productsGrid) return;
  
  productsGrid.innerHTML = filteredProducts.map(product => {
    const category = getCategory(product.categoryId);
    const cartItem = cart.find(item => item.productId === product.id);
    const inCartQty = cartItem ? cartItem.qty : 0;
    
    return `
      <div class="product-card">
        <div class="product-img">
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
          <i data-lucide="${getProductIcon(product.id)}"></i>
        </div>
        <div class="product-info">
          <div class="product-cat">
            <i data-lucide="${category.icon}"></i> ${category.name}
          </div>
          <div class="product-name">${product.name}</div>
          <div class="product-price">
            ${formatPrice(product.price)}
            ${product.oldPrice ? `<span class="old">${formatPrice(product.oldPrice)}</span>` : ""}
          </div>
          <button class="add-btn" data-product-id="${product.id}">
            ${inCartQty > 0 
              ? `<i data-lucide="check"></i> In Cart (${inCartQty})` 
              : `<i data-lucide="plus"></i> Add to Cart`}
          </button>
        </div>
      </div>
    `;
  }).join("");
  
  // Add event listeners to add-to-cart buttons
  document.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const productId = parseInt(btn.dataset.productId);
      addToCart(productId);
    });
  });
  
  renderIcons();
}

function addToCart(productId) {
  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ productId, qty: 1 });
  }
  updateCartBadge();
  renderShop();
  showToast("Added to cart ✨");
}

// ==================== CART RENDERING ====================
function renderCart() {
  const cartBody = document.getElementById("cart-body");
  if (!cartBody) return;
  
  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div class="cart-empty">
        <i data-lucide="shopping-bag"></i>
        <div style="margin-top: 16px;">Your cart is empty</div>
        <button class="hero-btn-primary" style="margin-top: 20px;" onclick="showView('shop')">Continue Shopping</button>
      </div>
    `;
    renderIcons();
    return;
  }
  
  // Render cart items
  let cartItemsHtml = "";
  cart.forEach((item, index) => {
    const product = getProduct(item.productId);
    const category = getCategory(product.categoryId);
    const itemTotal = product.price * item.qty;
    
    cartItemsHtml += `
      <div class="cart-item" data-cart-index="${index}">
        <div class="cart-item-img">
          <i data-lucide="${getProductIcon(product.id)}"></i>
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${product.name}</div>
          <div class="cart-item-cat">${category.name}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" data-action="decr" data-product-id="${product.id}">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" data-action="incr" data-product-id="${product.id}">+</button>
          <button class="remove-btn" data-product-id="${product.id}">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
        <div class="cart-item-price">${formatPrice(itemTotal)}</div>
      </div>
    `;
  });
  
  // Calculate totals
  const subtotal = cartTotal();
  const tax = subtotal * 0.08;
  const shipping = 7.99;
  const total = subtotal + tax + shipping;
  
  cartBody.innerHTML = `
    ${cartItemsHtml}
    <div class="cart-summary">
      <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${formatPrice(shipping)}</span></div>
      <div class="summary-row"><span>Tax (8%)</span><span>${formatPrice(tax)}</span></div>
      <div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
      <button class="checkout-btn" id="openCheckoutBtn">
        <i data-lucide="arrow-right"></i> Proceed to Checkout
      </button>
    </div>
  `;
  
  // Add event listeners for cart controls
  document.querySelectorAll(".qty-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const productId = parseInt(btn.dataset.productId);
      const action = btn.dataset.action;
      changeQuantity(productId, action === "incr" ? 1 : -1);
    });
  });
  
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener