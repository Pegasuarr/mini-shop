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
  
  // Re-render Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Update summary cards
function updateSummary(orders) {
  if (!orders || orders.length === 0) {
    totalOrders.textContent = '0';
    totalRevenue.textContent = '$0.00';
    totalItems.textContent = '0';
    uniqueCustomers.textContent = '0';
    avgOrderValue.textContent = '$0.00';
    return;
  }

  const totalOrdersCount = orders.length;
  const totalRevenueSum = orders.reduce((sum, o) => sum + o.total, 0);
  const totalItemsCount = orders.reduce((sum, o) => 
    sum + o.items.reduce((s, item) => s + item.quantity, 0), 0
  );
  const uniqueCustomersCount = new Set(orders.map(o => o.email)).size;
  const avgOrder = totalOrdersCount > 0 ? totalRevenueSum / totalOrdersCount : 0;

  totalOrders.textContent = totalOrdersCount;
  totalRevenue.textContent = fmt(totalRevenueSum);
  totalItems.textContent = totalItemsCount;
  uniqueCustomers.textContent = uniqueCustomersCount;
  avgOrderValue.textContent = fmt(avgOrder);
}

// Apply filters
function applyFilters() {
  const date = singleDate.value;
  const start = startDate.value;
  const end = endDate.value;
  const search = searchInput.value.trim().toLowerCase();
  
  let filters = {};
  
  if (date) {
    filters.date = date;
  } else if (start && end) {
    filters.startDate = start;
    filters.endDate = end;
  }
  
  // If no date filters, use today
  if (!date && !start && !end) {
    filters.date = new Date().toISOString().split('T')[0];
  }
  
  // Show loading
  loadingSpinner.style.display = 'block';
  ordersTableBody.innerHTML = '';
  
  fetchReportData(filters).then(data => {
    loadingSpinner.style.display = 'none';
    if (data) {
      let filtered = data.orders;
      if (search) {
        filtered = data.orders.filter(order => {
          const searchable = `${order.id} ${order.customer} ${order.email} ${order.items.map(i => i.productName).join(' ')}`.toLowerCase();
          return searchable.includes(search);
        });
        renderReport({ ...data, orders: filtered });
      } else {
        renderReport(data);
      }
    }
  });
}

// Reset filters
function resetFilters() {
  searchInput.value = '';
  setDefaultDates();
  applyFilters();
}

// Quick date filters
function setQuickFilter(days) {
  const today = new Date();
  const endDateObj = new Date(today);
  
  if (days === 0) {
    // Today
    singleDate.value = today.toISOString().split('T')[0];
    startDate.value = '';
    endDate.value = '';
  } else {
    // Date range
    const startDateObj = new Date(today);
    startDateObj.setDate(startDateObj.getDate() - days);
    startDate.value = startDateObj.toISOString().split('T')[0];
    endDate.value = today.toISOString().split('T')[0];
    singleDate.value = '';
  }
  
  // Update active state
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.classList.remove('active');
    if (parseInt(btn.dataset.days) === days) {
      btn.classList.add('active');
    }
  });
  
  applyFilters();
}

// View order details
function viewOrderDetail(orderId) {
  if (!currentReport || !currentReport.orders) {
    showToast('No report data available', true);
    return;
  }
  
  const order = currentReport.orders.find(o => o.id === orderId);
  if (!order) {
    showToast('Order not found', true);
    return;
  }
  
  const modal = document.getElementById('orderModal');
  const modalBody = document.getElementById('orderModalBody');
  
  let itemsHtml = order.items.map(item => `
    <div class="modal-detail-row">
      <span>${item.productName} × ${item.quantity}</span>
      <span>${fmt(item.subtotal)}</span>
    </div>
  `).join('');
  
  modalBody.innerHTML = `
    <div class="modal-user-info">
      <div><strong>Order #${order.id}</strong></div>
      <div><strong>${order.customer}</strong></div>
      <div>${order.email}</div>
      <div style="margin-top:6px;">
        <span class="status-badge status-${order.status}">${order.status}</span>
        <span style="margin-left:12px;font-size:12px;">
          ${new Date(order.date).toLocaleString()}
        </span>
      </div>
    </div>
    <div style="padding:4px 0;">
      ${itemsHtml}
    </div>
    <div class="modal-detail-total">
      <span>Total</span>
      <span>${fmt(order.total)}</span>
    </div>
  `;
  
  modal.style.display = 'block';
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Close modal
function closeOrderModal() {
  document.getElementById('orderModal').style.display = 'none';
}

// Export to CSV
function exportReport() {
  if (!currentReport || !currentReport.orders || currentReport.orders.length === 0) {
    showToast('No data to export', true);
    return;
  }
  
  // Create CSV
  let csv = 'Order ID,Customer,Email,Products,Items,Total,Status,Date\n';
  currentReport.orders.forEach(order => {
    const products = order.items.map(item => `${item.productName} (${item.quantity})`).join('; ');
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    csv += `${order.id},"${order.customer}","${order.email}","${products}",${totalItems},${order.total.toFixed(2)},${order.status},${order.date}\n`;
  });
  
  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `daily-purchase-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('Report exported successfully!');
}

// Print report
function printReport() {
  window.print();
}

// Initialize
function init() {
  // Set default date and load
  const today = new Date().toISOString().split('T')[0];
  singleDate.value = today;
  applyFilters();
  
  // Event listeners
  searchBtn.addEventListener('click', applyFilters);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applyFilters();
  });
  
  applyFiltersBtn.addEventListener('click', applyFilters);
  resetFiltersBtn.addEventListener('click', resetFilters);
  refreshBtn.addEventListener('click', () => {
    applyFilters();
    showToast('Refreshed!');
  });
  
  exportBtn.addEventListener('click', exportReport);
  printBtn.addEventListener('click', printReport);
  
  // Quick filters
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const days = parseInt(btn.dataset.days);
      setQuickFilter(days);
    });
  });
  
  // Auto-apply on date change (with debounce)
  let timeoutId;
  [singleDate, startDate, endDate].forEach(input => {
    input.addEventListener('change', () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(applyFilters, 300);
    });
  });
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);

// Expose functions globally
window.viewOrderDetail = viewOrderDetail;
window.closeOrderModal = closeOrderModal;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.exportReport = exportReport;