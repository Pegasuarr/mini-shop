const API = 'http://localhost:8080/api';

// State
let currentReport = null;
let filteredOrders = [];

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const singleDate = document.getElementById('singleDate');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportReportBtn');
const printBtn = document.getElementById('printBtn');
const ordersTableBody = document.getElementById('ordersTableBody');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultsCount = document.getElementById('resultsCount');
const dateRangeDisplay = document.getElementById('dateRangeDisplay');

// Summary elements
const totalOrders = document.getElementById('totalOrders');
const totalRevenue = document.getElementById('totalRevenue');
const totalItems = document.getElementById('totalItems');
const uniqueCustomers = document.getElementById('uniqueCustomers');
const avgOrderValue = document.getElementById('avgOrderValue');

// Set default dates
function setDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  singleDate.value = today;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  startDate.value = weekAgo.toISOString().split('T')[0];
  endDate.value = today;
}

setDefaultDates();

// Helper functions
const fmt = n => '$' + parseFloat(n).toFixed(2);

function showToast(msg, isError = false) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast${isError ? ' error' : ''}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Fetch report data
async function fetchReportData(filters = {}) {
  try {
    let url = `${API}/reports/daily?`;
    
    if (filters.date) {
      url += `date=${filters.date}`;
    } else if (filters.startDate && filters.endDate) {
      url += `startDate=${filters.startDate}&endDate=${filters.endDate}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch report data');
    
    const data = await response.json();
    currentReport = data;
    filteredOrders = data.orders || [];
    return data;
  } catch (error) {
    console.error('Error fetching report:', error);
    showToast('Failed to load report data. Please check if the server is running.', true);
    return null;
  }
}

// Render report
function renderReport(data) {
  if (!data || !data.orders) {
    ordersTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="no-results">
          <i data-lucide="inbox"></i>
          <div>No orders found for this period</div>
        </td>
      </tr>
    `;
    updateSummary([]);
    return;
  }

  // Update summary
  updateSummary(data.orders);
  
  // Update results info
  resultsCount.textContent = `Showing ${data.orders.length} orders`;
  dateRangeDisplay.textContent = `${data.dateRange.start} → ${data.dateRange.end}`;

  // Render table
  let tableHtml = '';
  
  if (data.orders.length === 0) {
    tableHtml = `
      <tr>
        <td colspan="9" class="no-results">
          <i data-lucide="search"></i>
          <div>No orders match your search criteria</div>
        </td>
      </tr>
    `;
  } else {
    data.orders.forEach(order => {
      const productNames = order.items.map(item => item.productName).join(', ');
      const statusClass = `status-${order.status}`;
      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
      
      tableHtml += `
        <tr>
          <td><strong>#${order.id}</strong></td>
          <td><strong>${order.customer}</strong></td>
          <td style="color:var(--text-soft)">${order.email}</td>
          <td style="max-width:200px;color:var(--text-soft);font-size:12px;">${productNames}</td>
          <td>${totalItems}</td>
          <td><strong>${fmt(order.total)}</strong></td>
          <td><span class="status-badge ${statusClass}">${order.status}</span></td>
          <td style="font-size:12px;color:var(--text-soft);">
            ${new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </td>
          <td>
            <button class="btn-view-detail" onclick="viewOrderDetail(${order.id})">
              <i data-lucide="eye"></i> View
            </button>
          </td>
        </tr>
      `;
    });
  }
  
  ordersTableBody.innerHTML = tableHtml;
  
  // Re-render Lucide