// Create and insert the navigation bar
function createNavigation() {
    const nav = document.createElement('nav');
    nav.innerHTML = `
        <div class="container">
            <a href="index.html" class="logo">MakeHive</a>
            <div class="nav-links">
                <a href="index.html">Home</a>
                <a href="product.html">Products</a>
                <a href="cart.html">Cart</a>
                <a href="seller.html">Sell</a>
                <a href="profile.html">Profile</a>
            </div>
        </div>
    `;
    document.body.insertBefore(nav, document.body.firstChild);
}

// Create and append the footer
function createFooter() {
    const footer = document.createElement('footer');
    footer.innerHTML = `
        <div class="footer-content">
            <div class="footer-section">
                <h3>Quick Links</h3>
                <a href="index.html">Home</a>
                <a href="product.html">Products</a>
                <a href="about.html">About Us</a>
                <a href="seller.html">Become a Seller</a>
            </div>
            <div class="footer-section">
                <h3>Customer Service</h3>
                <a href="#">Contact Us</a>
                <a href="#">Shipping Policy</a>
                <a href="#">Return Policy</a>
                <a href="#">FAQs</a>
            </div>
            <div class="footer-section">
                <h3>Connect With Us</h3>
                <a href="#">Facebook</a>
                <a href="#">Instagram</a>
                <a href="#">Twitter</a>
                <a href="#">Pinterest</a>
            </div>
        </div>
    `;
    document.body.appendChild(footer);
}

// Initialize components when the page loads
document.addEventListener('DOMContentLoaded', () => {
    createNavigation();
    createFooter();
});