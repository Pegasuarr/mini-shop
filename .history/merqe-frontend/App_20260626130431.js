const API = 'http://localhost:8080/api';

// State
let cart = [];
let filter = 0;
let products = [];
let categories = [];

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

// Views
function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll("nav button, .cart-btn").forEach(b => b.classList.remove("active"));
  const view = document.getElementById("view-" + name);
  if (view) view.classList.add("active");
  document.querySelectorAll(`[data-view="${name}"]`).forEach(b => b.classList.add("active"));
  if (name === "cart") renderCart();
  if (name === "orders") loadOrders();
  if (name === "report") loadReport();
}

// API fetch helper
async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// Shop
async function initShop() {
  document.getElementById("products-grid").innerHTML =
    `<div style="text-align:center;padding