document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");
    const mainContent = document.querySelector(".main-content");

    if (!token) {
        alert("You must be logged in to view this page.");
        window.location.href = "login.html";
        return;
    }

    if (userRole !== 'admin') {
        alert("You do not have permission to access the admin dashboard.");
        window.location.href = "index.html";
        return;
    }

    // If we've made it this far, the user is an admin. Load the data.
    showDashboard(); // Show dashboard by default

    // Navigation handling
    document.querySelectorAll(".sidebar .nav-links a").forEach(link => {
        link.addEventListener("click", (e) => {
            const href = link.getAttribute("href");
            if (href.startsWith("#")) {
                e.preventDefault();
                document.querySelector(".sidebar .nav-links li.active").classList.remove("active");
                link.parentElement.classList.add("active");

                // Hide all sections
                mainContent.querySelectorAll('section').forEach(sec => sec.style.display = 'none');
                // Hide stats grid and orders section initially
                mainContent.querySelector('.stats-grid').style.display = 'none';
                mainContent.querySelector('.orders-section').style.display = 'none';

                // Show the correct section based on the link clicked
                switch (href) {
                    case "#dashboard":
                        showDashboard();
                        break;
                    case "#orders":
                        showOrders();
                        break;
                    case "#users":
                        showUsers();
                        break;
                    case "#products":
                        showProducts();
                        break;
                    case "#businesses":
                        showBusinesses();
                        break;
                }
            }
        });
    });
});

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.href = "login.html";
}

async function apiFetch(endpoint) {
    const token = localStorage.getItem("token");
    const response = await fetch(`http://localhost:5000/api/admin/${endpoint}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}. Status: ${response.statusText}`);
    }
    return response.json();
}

async function showDashboard() {
    // Show both stats and the recent orders table for the dashboard view
    document.querySelector('.main-content .stats-grid').style.display = 'grid';
    document.querySelector('.main-content .orders-section').style.display = 'block';
    document.querySelector('.section-header h2').textContent = "Recent Orders";
    document.querySelector('.top-bar h1').textContent = "Dashboard Overview";

    try {
        const stats = await apiFetch("stats");

        // Populate stats cards
        document.getElementById("totalOrders").textContent = stats.totalOrders;
        document.getElementById("totalRevenue").textContent = `₹${stats.totalRevenue.toFixed(2)}`;
        document.getElementById("activeUsers").textContent = stats.totalUsers || 0;
        document.getElementById("pendingApprovals").textContent = stats.pendingApprovals || 0;

        // Also load recent orders for the dashboard
        document.querySelector('.orders-table thead tr').innerHTML = `<th>Order ID</th><th>Customer</th><th>Products</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th>`;
        const orders = await apiFetch("orders");
        renderOrders(orders, 10); // Show only 10 for the dashboard
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        alert("Failed to load dashboard data. Please check the console and try again.");
    }
}

async function showOrders() {
    document.querySelector('.main-content .orders-section').style.display = 'block';
    document.querySelector('.top-bar h1').textContent = "Manage Orders";
    document.querySelector('.section-header h2').textContent = "All Orders";
    document.querySelector('.orders-table thead tr').innerHTML = `
        <th>Order ID</th>
        <th>Customer</th>
        <th>Products</th>
        <th>Amount</th>
        <th>Status</th>
        <th>Date</th>
        <th>Actions</th>
    `;
    const orders = await apiFetch("orders");
    renderOrders(orders); // Show all orders
}

function renderOrders(orders, limit) {
    const tableBody = document.getElementById("ordersTableBody");
    tableBody.innerHTML = ""; // Clear existing rows

    if (!orders || orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No orders found.</td></tr>`;
        return;
    }

    const ordersToRender = limit ? orders.slice(0, limit) : orders;

    ordersToRender.forEach(order => {
        const row = document.createElement("tr");

        const productsHtml = order.products.map(p => {
            const productName = p.productId ? p.productId.name : (p.name || 'Unknown Product');
            return `${productName} (x${p.quantity})`;
        }).join('<br>');

        row.innerHTML = `
            <td>${order._id}</td>
            <td>${order.user ? order.user.username : 'N/A'}</td>
            <td>${productsHtml || 'No products listed'}</td>
            <td>₹${order.amount.toFixed(2)}</td>
            <td><span class="status ${order.status}">${order.status}</span></td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td><button class="action-btn">View</button></td>
        `;
        tableBody.appendChild(row);
    });
}

async function showUsers() {
    document.querySelector('.main-content .orders-section').style.display = 'block';
    const users = await apiFetch("users");
    const tableBody = document.getElementById("ordersTableBody");
    const sectionHeader = document.querySelector(".section-header h2");
    const tableHeaders = document.querySelector(".orders-table thead tr");

    document.querySelector('.top-bar h1').textContent = "Manage Users";
    sectionHeader.textContent = "All Users";
    tableHeaders.innerHTML = `
        <th>User ID</th>
        <th>Username</th>
        <th>Email</th>
        <th>Role</th>
        <th>Joined On</th>
    `;
    tableBody.innerHTML = "";

    users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${user._id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

async function showProducts() {
    document.querySelector('.main-content .orders-section').style.display = 'block';
    const products = await apiFetch("products"); // Assuming you have a /api/admin/products endpoint
    const tableBody = document.getElementById("ordersTableBody");
    const sectionHeader = document.querySelector(".section-header h2");
    const tableHeaders = document.querySelector(".orders-table thead tr");

    document.querySelector('.top-bar h1').textContent = "Manage Products";
    sectionHeader.textContent = "All Products";
    tableHeaders.innerHTML = `<th>Product ID</th><th>Name</th><th>Price</th><th>Category</th>`;
    tableBody.innerHTML = "";

    if (!products || products.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No products found in the database.</td></tr>`;
        return;
    }

    products.forEach(product => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${product._id}</td><td>${product.name}</td><td>₹${product.price}</td><td>${product.category || 'N/A'}</td>`;
        tableBody.appendChild(row);
    });
}

async function showBusinesses() {
    document.querySelector('.main-content .orders-section').style.display = 'block';
    const businesses = await apiFetch("sellers");
    const tableBody = document.getElementById("ordersTableBody");
    const sectionHeader = document.querySelector(".section-header h2");
    const tableHeaders = document.querySelector(".orders-table thead tr");

    document.querySelector('.top-bar h1').textContent = "Manage Businesses";
    sectionHeader.textContent = "All Sellers";
    tableHeaders.innerHTML = `
        <th>Business Name</th>
        <th>Owner</th>
        <th>Status</th>
        <th>Joined On</th>
        <th>Actions</th>
    `;
    tableBody.innerHTML = "";

    if (!businesses || businesses.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No businesses found.</td></tr>`;
        return;
    }

    businesses.forEach(seller => {
        const row = document.createElement("tr");
        const statusClass = seller.isVerified ? 'completed' : 'pending';
        const statusText = seller.isVerified ? 'Verified' : 'Pending';
        const actionButton = seller.isVerified ? 
            `<span style="color: #2e7d32;">Approved</span>` : 
            `<button class="action-btn approve-btn" data-id="${seller._id}">Approve</button>`;

        row.innerHTML = `
            <td>${seller.businessName}</td>
            <td>${seller.user ? seller.user.username : 'N/A'}</td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
            <td>${seller.createdAt ? new Date(seller.createdAt).toLocaleDateString() : 'N/A'}</td>
            <td id="action-${seller._id}">${actionButton}</td>
        `;
        tableBody.appendChild(row);
    });

    // Add event listener for approve buttons
    tableBody.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const sellerId = e.target.dataset.id;
            const response = await fetch(`http://localhost:5000/api/admin/sellers/${sellerId}/approve`, {
                method: 'PUT',
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            if (response.ok) {
                showBusinesses(); // Refresh the list
            } else {
                alert('Failed to approve business.');
            }
        });
    });
}

// Add this script tag to your admin.html before the closing </body> tag
/*
<script src="admin.js"></script>
*/