const API = 'http://localhost:8080/api';
const BASE = 'http://localhost:8080';

// State
let cart = [];
let filter = 0;
let products = [];
let categories = [];
let searchQuery = '';

// Helpers
const fmt = n => "$" + parseFloat(n).toFixed(2);

function updateCartBadge() {
  const n = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById("cart-count").textContent = n;
}

function rerender() {
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function showToast(msg, isError = false) {
  const t = document.createElement("div");
  t.className = "toast";
  t.style.background = isError ? "#e74c3c" : "var(--accent)";
  t.innerHTML = `<i data-lucide="${isError ? 'alert-circle' : 'check-circle'}"></i> ${msg}`;
  document.body.appendChild(t);
  rerender();
  setTimeout(() => t.remove(), 3000);
}

function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll("nav button, .cart-btn").forEach(b => b.classList.remove("active"));
  const view = document.getElementById("view-" + name);
  if (view) view.classList.add("active");
  document.querySelectorAll(`[data-view="${name}"]`).forEach(b => b.classList.add("active"));
  if (name === "cart") renderCart();
  if (name === "orders") loadOrders();
  if (name === "report") loadReport();
  rerender();
}

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ==================== SHOP ====================
async function initShop() {
  document.getElementById("products-grid").innerHTML =
    `<div style="text-align:center;padding:60px;color:var(--muted)">Loading products…</div>`;

  try {
    [categories, products] = await Promise.all([
      apiFetch("/categories"),
      apiFetch("/products"),
    ]);
  } catch (e) {
    showToast("Cannot connect to backend", true);
  }
  renderShop();
}

function renderShop() {
  const bar = document.getElementById("categories-bar");
  bar.innerHTML = `
    <button class="cat-tag ${filter === 0 ? "active" : ""}" onclick="setFilter(0)">
      <i data-lucide="grid"></i> All
    </button>
    ${categories.map(c => `
      <button class="cat-tag ${filter === c.id ? "active" : ""}" onclick="setFilter(${c.id})">
        <i data-lucide="${c.icon || 'tag'}"></i> ${c.name}
      </button>
    `).join("")}`;

  let visible = filter ? products.filter(p => p.categoryId === filter) : products;
  const grid = document.getElementById("products-grid");

  if (searchQuery) {
    visible = visible.filter(p =>
      p.name.toLowerCase().includes(searchQuery) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(searchQuery))
    );
  }

  if (!visible.length) {
    let message = searchQuery
      ? `<div class="no-search-results">
          <i data-lucide="search"></i>
          <h3>No products found</h3>
          <p>Try adjusting your search terms for "${searchQuery}"</p>
          <button onclick="clearProductSearch()" style="margin-top:12px;padding:8px 20px;border:1px solid var(--border);border-radius:40px;background:var(--surface);cursor:pointer;">
            Clear Search
          </button>
        </div>`
      : `<div style="text-align:center;padding:60px;color:var(--muted)">No products found.</div>`;
    grid.innerHTML = message;
    rerender();
    return;
  }

  grid.innerHTML = visible.map(p => {
    const cat = categories.find(c => c.id === p.categoryId) || {};
    const inCart = cart.find(i => i.productId === p.id);

    // FIX 1: correct template literal with BASE prefix
    const imgHTML = p.imageUrl
      ? `<img src="${BASE}/${p.imageUrl}" alt="${p.name}"
             style="width:100%;height:100%;object-fit:cover;transition:transform .4s"
             onerror="this.style.display='none'">`
      : `<i data-lucide="${p.icon || 'gift'}"></i>`;

    return `
      <div class="product-card">
        <div class="product-img">
          ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
          ${imgHTML}
        </div>
        <div class="product-info">
          <div class="product-cat">
            <i data-lucide="${cat.icon || 'tag'}"></i> ${cat.name || ""}
          </div>
          <div class="product-name">${p.name}</div>
          <div class="product-price">
            ${fmt(p.price)}
            ${p.oldPrice ? `<span class="old">${fmt(p.oldPrice)}</span>` : ""}
          </div>
          <button class="add-btn" onclick="addToCart(${p.id})">
            ${inCart
              ? `<i data-lucide="check"></i> In Cart (${inCart.qty})`
              : `<i data-lucide="plus"></i> Add to Cart`}
          </button>
        </div>
      </div>`;
  }).join("");

  updateSearchResultsInfo(visible.length);
  rerender();
}

// ==================== PRODUCT SEARCH ====================
function searchProducts(query) {
  searchQuery = query.trim().toLowerCase();
  const searchInfo = document.getElementById('searchResultsInfo');
  const clearBtn = document.getElementById('clearSearchBtn');

  if (!searchQuery) {
    clearProductSearch();
    return;
  }

  if (clearBtn) clearBtn.style.display = 'flex';
  if (searchInfo) searchInfo.style.display = 'flex';
  filter = 0;
  renderShop();
}

function clearProductSearch() {
  searchQuery = '';
  const input = document.getElementById('productSearchInput');
  const searchInfo = document.getElementById('searchResultsInfo');
  const clearBtn = document.getElementById('clearSearchBtn');

  if (input) input.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  if (searchInfo) searchInfo.style.display = 'none';
  filter = 0;
  renderShop();
}

function updateSearchResultsInfo(count) {
  const resultCount = document.getElementById('searchResultCount');
  if (resultCount && searchQuery) {
    resultCount.textContent = `Found ${count} product${count !== 1 ? 's' : ''} matching "${searchQuery}"`;
  }
}

function setFilter(id) {
  filter = id;
  const input = document.getElementById('productSearchInput');
  if (input) input.value = '';
  searchQuery = '';
  const searchInfo = document.getElementById('searchResultsInfo');
  if (searchInfo) searchInfo.style.display = 'none';
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  renderShop();
}

function addToCart(productId) {
  const existing = cart.find(i => i.productId === productId);
  if (existing) existing.qty++;
  else cart.push({ productId, qty: 1 });
  updateCartBadge();
  renderShop();
  showToast("Added to cart");
}

// ==================== CART ====================
function renderCart() {
  const el = document.getElementById("cart-body");
  if (!cart.length) {
    el.innerHTML = `
      <div class="cart-empty">
        <i data-lucide="shopping-bag" style="width:56px;height:56px;stroke:var(--muted)"></i>
        <div style="margin-top:16px">Your cart is empty</div>
        <button class="hero-btn-primary" style="margin-top:20px" onclick="showView('shop')">
          Continue Shopping
        </button>
      </div>`;
    rerender();
    return;
  }

  let subtotal = 0;
  const rows = cart.map(item => {
    const p = products.find(p => p.id === item.productId) || {};
    const cat = categories.find(c => c.id === p.categoryId) || {};
    const lineTotal = (p.price || 0) * item.qty;
    subtotal += lineTotal;

    // FIX 2: cart images also use BASE prefix
    const imgHTML = p.imageUrl
      ? `<img src="${BASE}/${p.imageUrl}" alt="${p.name}"
             style="width:100%;height:100%;object-fit:cover;border-radius:20px"
             onerror="this.style.display='none'">`
      : `<i data-lucide="${p.icon || 'gift'}"></i>`;

    return `
      <div class="cart-item">
        <div class="cart-item-img">${imgHTML}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name || "Unknown"}</div>
          <div class="cart-item-cat">${cat.name || ""}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty(${p.id}, -1)">−</button>
          <span class="qty-num" style="min-width:24px;text-align:center">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${p.id}, 1)">+</button>
          <button class="remove-btn" onclick="removeFromCart(${p.id})">
            <i data-lucide="trash-2" style="width:18px;height:18px;stroke:currentColor"></i>
          </button>
        </div>
        <div class="cart-item-price">${fmt(lineTotal)}</div>
      </div>`;
  }).join("");

  const tax = subtotal * 0.08;
  const shipping = 7.99;
  const total = subtotal + tax + shipping;

  el.innerHTML = rows + `
    <div class="cart-summary">
      <div class="summary-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${fmt(shipping)}</span></div>
      <div class="summary-row"><span>Tax (8%)</span><span>${fmt(tax)}</span></div>
      <div class="summary-row total"><span>Total</span><span>${fmt(total)}</span></div>
      <button class="checkout-btn" onclick="openCheckout()">
        <i data-lucide="arrow-right"></i> Proceed to Checkout
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
  showToast("Item removed");
}

// ==================== CHECKOUT ====================
function openCheckout() {
  if (!cart.length) { showToast("Your cart is empty", true); return; }
  document.getElementById("checkout-modal").style.display = "block";
  rerender();
}

function closeModal() {
  document.getElementById("checkout-modal").style.display = "none";
  ["f-name","f-email","f-address"].forEach(id => document.getElementById(id).value = "");
}

async function placeOrder() {
  const name = document.getElementById("f-name").value.trim();
  const email = document.getElementById("f-email").value.trim();
  const address = document.getElementById("f-address").value.trim();

  if (!name || !email || !address) { showToast("Please fill all fields", true); return; }
  if (!email.includes("@")) { showToast("Invalid email", true); return; }

  const payload = {
    name, email, address,
    items: cart.map(i => ({ productId: i.productId, qty: i.qty })),
  };

  try {
    showToast("Placing order…");
    const order = await apiFetch("/orders", { method: "POST", body: JSON.stringify(payload) });
    cart = [];
    updateCartBadge();
    closeModal();
    renderShop();
    showToast(`Order Successful #${order.id} placed!`);
    setTimeout(() => showView("orders"), 800);
  } catch (e) {
    showToast("Error: " + e.message, true);
  }
}

// ==================== ORDERS ====================
async function loadOrders() {
  const el = document.getElementById("orders-body");
  el.innerHTML = `<div style="text-align:center;padding:60px;color:var(--muted)">Loading…</div>`;

  try {
    const orders = await apiFetch("/orders");
    renderOrders(orders);
  } catch (e) {
    el.innerHTML = `<div class="cart-empty"><div>Failed to load orders.</div></div>`;
  }
}

function renderOrders(orders) {
  const el = document.getElementById("orders-body");

  if (!orders || !orders.length) {
    el.innerHTML = `
      <div class="cart-empty">
        <i data-lucide="package" style="width:56px;height:56px;stroke:var(--muted)"></i>
        <div style="margin-top:16px">No orders yet</div>
        <button class="hero-btn-primary" style="margin-top:20px" onclick="showView('shop')">
          Start Shopping
        </button>
      </div>`;
    rerender();
    return;
  }

  el.innerHTML = orders.map(o => {
    const total = o.items.reduce((s, i) => s + (i.price * i.qty), 0);
    const date = o.date ? new Date(o.date).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    }) : "Just now";

    const itemRows = o.items.map(i => {
      const p = products.find(p => p.id === i.productId) || {};
      return `
        <div class="order-item-row">
          <span>
            <i data-lucide="${p.icon || 'gift'}" style="width:14px;height:14px;vertical-align:middle"></i>
            ${p.name || "Product #" + i.productId} × ${i.qty}
          </span>
          <span>${fmt(i.price * i.qty)}</span>
        </div>`;
    }).join("");

    return `
      <div class="order-card">
        <div class="order-header">
          <div>
            <strong>Order #${o.id}</strong><br>
            <small style="color:var(--muted)">${date} · ${o.user?.name || ""}</small>
          </div>
          <span class="order-status">${o.status}</span>
          <div style="font-weight:700;font-size:16px">${fmt(total)}</div>
        </div>
        <div class="order-items">${itemRows}</div>
      </div>`;
  }).join("");

  rerender();
}

// ==================== REPORT ====================
async function loadReport(date = null) {
  const tbody = document.getElementById("reportTableBody");
  if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:60px;color:var(--muted)">Loading report…</td></tr>`;

  try {
    let url = "/reports/daily";
    if (date) url += `?date=${date}`;
    const report = await apiFetch(url);
    renderReport(report);
  } catch (e) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--muted)">Failed to load report.</td></tr>`;
  }
}

function renderReport(report) {
  const tbody = document.getElementById("reportTableBody");
  const s = report?.summary || {};
  const orders = report?.orders || [];

  // Update stat cards
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('repTotalOrders',    s.totalOrders     ?? 0);
  set('repTotalRevenue',   fmt(s.totalRevenue  ?? 0));
  set('repTotalItems',     s.totalItems      ?? 0);
  set('repUniqueCustomers',s.uniqueCustomers ?? 0);
  set('repAvgOrder',       s.totalOrders > 0 ? fmt((s.totalRevenue||0) / s.totalOrders) : '$0.00');
  set('repResultsCount',   `Showing ${orders.length} order${orders.length !== 1 ? 's' : ''}`);

  const dateRange = document.getElementById('repDateRange');
  if (dateRange) {
    dateRange.textContent = report?.dateRange
      ? `${report.dateRange.start} — ${report.dateRange.end}`
      : 'All time';
  }

  if (!tbody) return;

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:60px;color:var(--muted)">No orders found for this period.</td></tr>`;
    rerender();
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const products = order.items.map(i => i.productName).join(', ');
    const totalItems = order.items.reduce((s, i) => s + i.qty, 0);
    const statusClass = `status-${order.status}`;
    const date = new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `
      <tr>
        <td><strong>#${order.id}</strong></td>
        <td>${order.customer}</td>
        <td style="color:var(--text-soft);font-size:12px">${order.email || ''}</td>
        <td style="max-width:200px;color:var(--text-soft);font-size:12px">${products}</td>
        <td style="text-align:center">${totalItems}</td>
        <td><strong>${fmt(order.total)}</strong></td>
        <td><span class="status-badge ${statusClass}">${order.status}</span></td>
        <td>${date}</td>
        <td>
          <button class="btn-view-detail" onclick="viewOrderDetail(${order.id})">
            <i data-lucide="eye"></i> View
          </button>
        </td>
      </tr>`;
  }).join('');

  rerender();
}


// ==================== ORDER DETAIL ====================
function viewOrderDetail(orderId) {
  showToast("Loading order details...");

  apiFetch(`/orders/${orderId}`).then(order => {
    const modal = document.getElementById("orderDetailModal");
    const body = document.getElementById("orderDetailBody");

    const itemsHtml = order.items.map(item => {
      const p = products.find(prod => prod.id === item.productId) || {};
      const imgHtml = p.image_url 
        ? `<img src="${p.image_url}" class="transcript-item-img" alt="${p.name || 'Product'}">`
        : `<div class="transcript-item-fallback"><i data-lucide="package"></i></div>`;
      return `
        <div class="transcript-item">
          ${imgHtml}
          <div class="transcript-item-details">
            <div class="transcript-item-name">${p.name || "Product #" + item.productId}</div>
            <div class="transcript-item-meta">${item.qty} × ${fmt(item.price)}</div>
          </div>
          <div class="transcript-item-total">${fmt(item.price * item.qty)}</div>
        </div>
      `;
    }).join("");

    const total = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    body.innerHTML = `
      <div class="transcript-card">
        <div class="transcript-header">
          <div class="transcript-logo">MINI<span>MERQE</span></div>
          <span class="transcript-badge ${order.status}">${order.status}</span>
        </div>
        <div class="transcript-grid">
          <div>
            <div class="transcript-section-title">Order Info</div>
            <div class="transcript-box">
              <div class="transcript-info-row"><strong>ID:</strong> #${order.id}</div>
              <div class="transcript-info-row"><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</div>
            </div>
          </div>
          <div>
            <div class="transcript-section-title">Customer</div>
            <div class="transcript-box">
              <div class="transcript-info-row"><strong>Name:</strong> ${order.user?.name || 'N/A'}</div>
              <div class="transcript-info-row"><strong>Email:</strong> ${order.user?.email || 'N/A'}</div>
              <div class="transcript-info-row"><strong>Address:</strong> ${order.user?.address || 'N/A'}</div>
            </div>
          </div>
        </div>
        <div class="transcript-section-title">Items Purchased</div>
        <div class="transcript-items">
          ${itemsHtml}
        </div>
        <div class="transcript-footer">
          <div class="transcript-total-row">
            <span>Total Paid</span>
            <span>${fmt(total)}</span>
          </div>
        </div>
      </div>
      <div class="transcript-actions">
        <button class="btn-transcript-print" onclick="window.print()">
          <i data-lucide="printer"></i> Print Receipt
        </button>
      </div>
    `;

    modal.style.display = "block";
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    rerender();
  }).catch(() => {
    showToast("Failed to load order details", true);
  });
}

function closeOrderDetail() {
  document.getElementById("orderDetailModal").style.display = "none";
}

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("nav button, .cart-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.view;
      if (v) showView(v);
    });
  });

  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("placeOrderBtn").addEventListener("click", placeOrder);
  // closeDetailModalBtn not in HTML — modal close is handled by inline onclick

  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target.classList.contains("modal-overlay")) {
        closeModal();
        closeOrderDetail();
      }
    });
  });

  // ==================== PRODUCT SEARCH ====================
  const productSearchInput = document.getElementById('productSearchInput');
  const productSearchBtn = document.getElementById('productSearchBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const clearResultsBtn = document.getElementById('clearSearchResultsBtn');

  if (productSearchBtn) {
    productSearchBtn.addEventListener('click', () => {
      const query = productSearchInput?.value || '';
      if (query.trim()) searchProducts(query);
    });
  }

  if (productSearchInput) {
    productSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = productSearchInput.value;
        if (query.trim()) searchProducts(query);
      }
    });

    productSearchInput.addEventListener('input', () => {
      if (productSearchInput.value.trim()) {
        if (clearSearchBtn) clearSearchBtn.style.display = 'flex';
      } else {
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        if (searchQuery) clearProductSearch();
      }
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (productSearchInput) productSearchInput.value = '';
      clearSearchBtn.style.display = 'none';
      clearProductSearch();
    });
  }

  if (clearResultsBtn) {
    clearResultsBtn.addEventListener('click', clearProductSearch);
  }

  // ==================== REPORT CONTROLS ====================
  // IDs match the HTML: reportApplyFilters, reportResetFilters, reportSearchBtn, reportSearchInput, reportSingleDate
  const reportFilterBtn = document.getElementById('reportApplyFilters');
  const reportResetBtn = document.getElementById('reportResetFilters');
  const reportSearchBtn = document.getElementById('reportSearchBtn');
  const reportSearch = document.getElementById('reportSearchInput');
  const reportDate = document.getElementById('reportSingleDate');

  if (reportFilterBtn) {
    reportFilterBtn.addEventListener('click', () => {
      const date = reportDate?.value;
      if (date) loadReport(date);
      else showToast("Please select a date", true);
    });
  }

  if (reportResetBtn) {
    reportResetBtn.addEventListener('click', () => {
      if (reportDate) reportDate.value = "";
      loadReport();
    });
  }

  if (reportSearchBtn && reportSearch) {
    reportSearchBtn.addEventListener('click', () => {
      const query = reportSearch.value.trim().toLowerCase();
      const rows = document.getElementById('reportTableBody')?.querySelectorAll('tr');
      rows?.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? "" : "none";
      });
    });

    reportSearch.addEventListener('keydown', (e) => {
      if (e.key === "Enter") reportSearchBtn.click();
    });
  }

  if (reportDate) {
    reportDate.value = new Date().toISOString().split('T')[0];
  }

  // Hero buttons
  document.getElementById('learnMoreBtn').addEventListener('click', () => {
    document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth" });
  });
  document.getElementById('contactBtn').addEventListener('click', () => {
    showToast("📧 hello@minimerqe.com");
  });

  initShop();
});

// ==================== EXPOSE GLOBALLY ====================
window.showView = showView;
window.setFilter = setFilter;
window.addToCart = addToCart;
window.changeQty = changeQty;
window.removeFromCart = removeFromCart;
window.openCheckout = openCheckout;
window.closeModal = closeModal;
window.placeOrder = placeOrder;
window.viewOrderDetail = viewOrderDetail;
window.closeOrderDetail = closeOrderDetail;
window.loadReport = loadReport;
window.searchProducts = searchProducts;
window.clearProductSearch = clearProductSearch;