/* ═══════════════════════════════════════════════
   MERQE — Frontend with Backend Integration (FIXED)
   ═══════════════════════════════════════════════ */

// API Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Global state
let cart = [];
let currentFilter = 0;
let products = [];
let categories = [];

// ==================== FETCH FROM BACKEND ====================
async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (response.ok) {
            categories = await response.json();
            console.log('Categories loaded:', categories);
            return categories;
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        showToast('Cannot connect to server. Make sure backend is running', true);
    }
    return [];
}

async function fetchProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (response.ok) {
            products = await response.json();
            console.log('Products loaded:', products.length);
            return products;
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }
    return [];
}

async function placeOrderBackend(orderData) {
    try {
        console.log('Sending order to backend:', orderData);
        
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Order placed successfully:', result);
        return result;
    } catch (error) {
        console.error('Error placing order:', error);
        showToast(error.message, true);
        return null;
    }
}

async function fetchOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/orders`);
        if (response.ok) {
            const orders = await response.json();
            console.log('Orders loaded:', orders.length);
            return orders;
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
    return [];
}

// ==================== HELPER FUNCTIONS ====================
const formatPrice = (n) => "$" + parseFloat(n).toFixed(2);

function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById("cart-count");
    if (badge) badge.textContent = totalItems;
}

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
    document.querySelectorAll(".view").forEach(view => {
        view.classList.remove("active");
    });
    
    const activeView = document.getElementById(`view-${viewName}`);
    if (activeView) activeView.classList.add("active");
    
    document.querySelectorAll("nav button, .cart-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    document.querySelectorAll(`nav button[data-view="${viewName}"], .cart-btn[data-view="${viewName}"]`).forEach(btn => {
        btn.classList.add("active");
    });
    
    if (viewName === "cart") renderCart();
    if (viewName === "orders") renderOrdersFromBackend();
    
    renderIcons();
}

// ==================== SHOP RENDERING ====================
function renderShop() {
    const categoriesBar = document.getElementById("categories-bar");
    if (!categoriesBar) return;
    
    categoriesBar.innerHTML = `
        <button class="cat-tag ${currentFilter === 0 ? "active" : ""}" data-cat-id="0">
            <i data-lucide="grid"></i> All
        </button>
        ${categories.map(cat => `
            <button class="cat-tag ${currentFilter === cat.id ? "active" : ""}" data-cat-id="${cat.id}">
                <i data-lucide="${cat.icon || 'tag'}"></i> ${cat.name}
            </button>
        `).join("")}
    `;
    
    document.querySelectorAll(".cat-tag").forEach(btn => {
        btn.addEventListener("click", () => {
            currentFilter = parseInt(btn.dataset.catId);
            renderShop();
        });
    });
    
    const filteredProducts = currentFilter === 0 
        ? products 
        : products.filter(p => p.categoryId === currentFilter);
    
    const productsGrid = document.getElementById("products-grid");
    if (!productsGrid) return;
    
    productsGrid.innerHTML = filteredProducts.map(product => {
        const category = categories.find(c => c.id === product.categoryId);
        const cartItem = cart.find(item => item.productId === product.id);
        const inCartQty = cartItem ? cartItem.qty : 0;
        
        return `
            <div class="product-card">
                <div class="product-img">
                    ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
                    <i data-lucide="${product.icon || 'gift'}"></i>
                </div>
                <div class="product-info">
                    <div class="product-cat">
                        <i data-lucide="${category?.icon || 'tag'}"></i> ${category?.name || ''}
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
    
    let cartItemsHtml = "";
    let subtotal = 0;
    
    cart.forEach((item, index) => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return;
        const category = categories.find(c => c.id === product.categoryId);
        const itemTotal = product.price * item.qty;
        subtotal += itemTotal;
        
        cartItemsHtml += `
            <div class="cart-item" data-cart-index="${index}">
                <div class="cart-item-img">
                    <i data-lucide="${product.icon || 'gift'}"></i>
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${product.name}</div>
                    <div class="cart-item-cat">${category?.name || ''}</div>
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
    
    document.querySelectorAll(".qty-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const productId = parseInt(btn.dataset.productId);
            const action = btn.dataset.action;
            changeQuantity(productId, action === "incr" ? 1 : -1);
        });
    });
    
    document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const productId = parseInt(btn.dataset.productId);
            removeFromCart(productId);
        });
    });
    
    const checkoutBtn = document.getElementById("openCheckoutBtn");
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", openCheckout);
    }
    
    renderIcons();
}

function changeQuantity(productId, delta) {
    const itemIndex = cart.findIndex(item => item.productId === productId);
    if (itemIndex === -1) return;
    
    cart[itemIndex].qty += delta;
    if (cart[itemIndex].qty <= 0) {
        cart.splice(itemIndex, 1);
    }
    
    updateCartBadge();
    renderCart();
    renderShop();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    updateCartBadge();
    renderCart();
    renderShop();
    showToast("Item removed");
}

// ==================== CHECKOUT MODAL ====================
function openCheckout() {
    if (cart.length === 0) {
        showToast("Your cart is empty", true);
        return;
    }
    const modal = document.getElementById("checkout-modal");
    if (modal) modal.style.display = "block";
    renderIcons();
}

function closeModal() {
    const modal = document.getElementById("checkout-modal");
    if (modal) modal.style.display = "none";
    document.getElementById("f-name").value = "";
    document.getElementById("f-email").value = "";
    document.getElementById("f-address").value = "";
}

async function placeOrder() {
    const name = document.getElementById("f-name").value.trim();
    const email = document.getElementById("f-email").value.trim();
    const address = document.getElementById("f-address").value.trim();
    
    if (!name || !email || !address) {
        showToast("Please fill all fields", true);
        return;
    }
    
    if (!email.includes("@") || !email.includes(".")) {
        showToast("Please enter a valid email", true);
        return;
    }
    
    if (cart.length === 0) {
        showToast("Your cart is empty", true);
        closeModal();
        return;
    }
    
    // ✅ FIXED: Flattened structure matching models.CreateOrderRequest struct tags perfectly.
    const orderData = {
        name: name,
        email: email,
        address: address,
        items: cart.map(item => ({
            productId: item.productId,
            qty: item.qty, // Changed from quantity -> qty
            price: 0       // Server-side price override handles this anyway
        }))
    };
    
    showToast("Placing order...");
    const result = await placeOrderBackend(orderData);
    
    if (result) {
        cart = [];
        updateCartBadge();
        closeModal();
        renderShop();
        showToast(`🎉 Order #${result.id || 'placed'} successfully!`);
        await renderOrdersFromBackend();
        setTimeout(() => showView("orders"), 1000);
    }
}

// ==================== ORDERS FROM BACKEND ====================
async function renderOrdersFromBackend() {
    const ordersBody = document.getElementById("orders-body");
    if (!ordersBody) return;
    
    const orders = await fetchOrders();
    
    if (orders.length === 0) {
        ordersBody.innerHTML = `
            <div class="cart-empty">
                <i data-lucide="package"></i>
                <div style="margin-top: 16px;">No orders yet</div>
                <button class="hero-btn-primary" style="margin-top: 20px;" onclick="showView('shop')">Start Shopping</button>
            </div>
        `;
        renderIcons();
        return;
    }
    
    ordersBody.innerHTML = orders.map(order => {
        const itemsHtml = order.items && order.items.length > 0 ? order.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return `
                <div class="order-item-row">
                    <span>
                        <i data-lucide="${product?.icon || 'gift'}"></i>
                        ${item.productName || product?.name || `Product #${item.productId}`} × ${item.qty || item.quantity || 1}
                    </span>
                    <span>${formatPrice((item.price || 0) * (item.qty || item.quantity || 1))}</span>
                </div>
            `;
        }).join("") : '<div>No items</div>';
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <strong>Order #${order.id}</strong><br>
                        <small>${order.date ? new Date(order.date).toLocaleDateString() : 'Just now'}</small>
                    </div>
                    <div class="order-status">${order.status || 'pending'}</div>
                    <div class="order-total">${formatPrice(order.total || 0)}</div>
                </div>
                <div class="order-items">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }).join("");
    
    renderIcons();
}

// ==================== INITIALIZATION ====================
async function init() {
    const productsGrid = document.getElementById("products-grid");
    if (productsGrid) {
        productsGrid.innerHTML = '<div style="text-align:center; padding:40px;">Loading products...</div>';
    }
    
    await fetchCategories();
    await fetchProducts();
    
    document.querySelectorAll("nav button, .cart-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const viewName = btn.dataset.view;
            if (viewName) showView(viewName);
        });
    });
    
    const closeModalBtn = document.getElementById("closeModalBtn");
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    
    const placeOrderBtn = document.getElementById("placeOrderBtn");
    if (placeOrderBtn) placeOrderBtn.addEventListener("click", placeOrder);
    
    const modalOverlay = document.querySelector(".modal-overlay");
    if (modalOverlay) {
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }
    
    const learnMoreBtn = document.getElementById("learnMoreBtn");
    if (learnMoreBtn) {
        learnMoreBtn.addEventListener("click", () => {
            showToast("展开时尚AI匹配!");
        });
    }
    
    const contactBtn = document.getElementById("contactBtn");
    if (contactBtn) {
        contactBtn.addEventListener("click", () => {
            showToast("📧 hello@minimerqe.com | 📞 (888) 432-1234");
        });
    }
    
    renderShop();
    updateCartBadge();
    renderIcons();
    
    if (products.length === 0 && categories.length === 0) {
        showToast("⚠️ Cannot connect to backend.", true);
    }
}

init();

window.showView = showView;
window.addToCart = addToCart;
window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;
window.openCheckout = openCheckout;
window.closeModal = closeModal;
window.placeOrder = placeOrder;