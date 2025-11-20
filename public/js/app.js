// Configuration - UPDATE THIS WITH YOUR NETLIFY URL
const API_BASE_URL = window.location.hostname === 'localhost'
? 'http://localhost:8888/.netlify/functions'
: 'https://your-site-name.netlify.app/.netlify/functions';

let allProducts = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});

// Load all products
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to load products');

        allProducts = await response.json();
        displayProducts(allProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('product-list').innerHTML =
        '<p class="error">Failed to load products. Check console for details.</p>';
    }
}

// Display products
function displayProducts(products) {
    const container = document.getElementById('product-list');

    if (!products || products.length === 0) {
        container.innerHTML = '<p>No products found.</p>';
        return;
    }

    container.innerHTML = products.map(product => `
    <div class="product-card">
    <h3>${product.product_name}</h3>
    <p class="product-category">${product.category}</p>
    <p class="product-price">$${product.price}</p>
    <p class="product-stock">Stock: ${product.stock_quantity}</p>
    </div>
    `).join('');
}

// Search products
async function searchProducts() {
    const searchTerm = document.getElementById('search-input').value;

    if (!searchTerm) {
        displayProducts(allProducts);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(searchTerm)}`);
        const results = await response.json();
        displayProducts(results);
    } catch (error) {
        console.error('Search failed:', error);
    }
}

// Filter by category
function filterByCategory() {
    const category = document.getElementById('category-filter').value;

    if (!category) {
        displayProducts(allProducts);
        return;
    }

    const filtered = allProducts.filter(p => p.category === category);
    displayProducts(filtered);
}

// Filter by price
function filterByPrice() {
    const priceRange = document.getElementById('price-filter').value;

    if (!priceRange) {
        displayProducts(allProducts);
        return;
    }

    let filtered;
    if (priceRange === '0-50') {
        filtered = allProducts.filter(p => p.price < 50);
    } else if (priceRange === '50-100') {
        filtered = allProducts.filter(p => p.price >= 50 && p.price <= 100);
    } else if (priceRange === '100+') {
        filtered = allProducts.filter(p => p.price > 100);
    }

    displayProducts(filtered);
}

// Customer lookup
async function lookupCustomer() {
    const email = document.getElementById('customer-email').value;

    if (!email) {
        alert('Please enter an email address');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/customer?email=${encodeURIComponent(email)}`);
        const customer = await response.json();

        const resultDiv = document.getElementById('customer-result');
        if (customer) {
            resultDiv.innerHTML = `
            <div class="customer-info">
            <h3>${customer.first_name} ${customer.last_name}</h3>
            <p><strong>Email:</strong> ${customer.email}</p>
            <p><strong>Segment:</strong> ${customer.customer_segment}</p>
            <p><strong>Lifetime Value:</strong> $${customer.lifetime_value}</p>
            <p><strong>Status:</strong> ${customer.status}</p>
            <p><strong>Member Since:</strong> ${customer.registration_date}</p>
            </div>
            `;
        } else {
            resultDiv.innerHTML = '<p class="error">Customer not found</p>';
        }
    } catch (error) {
        console.error('Lookup failed:', error);
    }
}

// Analytics functions
async function getTopProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/analytics?query=top-products`);
        const data = await response.json();

        document.getElementById('analytics-result').innerHTML = `
        <h3>Top 10 Products by Revenue</h3>
        <table>
        <tr><th>Product</th><th>Category</th><th>Orders</th><th>Revenue</th></tr>
        ${data.map(p => `
            <tr>
            <td>${p.product_name}</td>
            <td>${p.category}</td>
            <td>${p.order_count}</td>
            <td>$${p.revenue}</td>
            </tr>
            `).join('')}
            </table>
            `;
    } catch (error) {
        console.error('Analytics failed:', error);
    }
}

async function getCustomerSegments() {
    try {
        const response = await fetch(`${API_BASE_URL}/analytics?query=segments`);
        const data = await response.json();

        document.getElementById('analytics-result').innerHTML = `
        <h3>Customer Segmentation Analysis</h3>
        <table>
        <tr><th>Segment</th><th>Customers</th><th>Avg Lifetime Value</th><th>Total Value</th></tr>
        ${data.map(s => `
            <tr>
            <td>${s.customer_segment}</td>
            <td>${s.customer_count}</td>
            <td>$${s.avg_ltv}</td>
            <td>$${s.total_ltv}</td>
            </tr>
            `).join('')}
            </table>
            `;
    } catch (error) {
        console.error('Analytics failed:', error);
    }
}

async function getRevenueByCategory() {
    try {
        const response = await fetch(`${API_BASE_URL}/analytics?query=revenue`);
        const data = await response.json();

        document.getElementById('analytics-result').innerHTML = `
        <h3>Revenue by Category</h3>
        <table>
        <tr><th>Category</th><th>Products Sold</th><th>Total Revenue</th></tr>
        ${data.map(c => `
            <tr>
            <td>${c.category}</td>
            <td>${c.units_sold}</td>
            <td>$${c.revenue}</td>
            </tr>
            `).join('')}
            </table>
            `;
    } catch (error) {
        console.error('Analytics failed:', error);
    }
}

async function getOrderStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/analytics?query=orders`);
        const data = await response.json();

        document.getElementById('analytics-result').innerHTML = `
        <h3>Order Status Distribution</h3>
        <table>
        <tr><th>Status</th><th>Count</th><th>Total Value</th></tr>
        ${data.map(o => `
            <tr>
            <td>${o.order_status}</td>
            <td>${o.order_count}</td>
            <td>$${o.total_value}</td>
            </tr>
            `).join('')}
            </table>
            `;
    } catch (error) {
        console.error('Analytics failed:', error);
    }
}
