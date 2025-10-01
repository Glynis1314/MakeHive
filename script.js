// ======= AUTH BUTTON =======
const authBtn = document.getElementById("authBtn");
const token = localStorage.getItem("token");

function updateAuthButton() {
  if (token) {
    authBtn.textContent = "Logout";
    authBtn.onclick = () => {
      localStorage.removeItem("token");
      alert("Logged out successfully!");
      window.location.reload();
    };
  } else {
    authBtn.textContent = "Sign In";
    authBtn.onclick = () => {
      window.location.href = "signup.html";
    };
  }
}
updateAuthButton();

// ======= BECOME A SELLER BUTTON =======
const becomeSellerBtn = document.querySelector(".seller-btn");
becomeSellerBtn.addEventListener("click", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("⚠️ You must log in first to become a seller!");
    window.location.href = "signup.html";
  } else {
    window.location.href = "become-seller.html";
  }
});

// ======= SEARCH FUNCTIONALITY =======
const searchBtn = document.querySelector(".search-bar button");
const searchInput = document.querySelector(".search-bar input");

searchBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim();
  if (!query) {
    alert("Please type something to search.");
    return;
  }

  try {
    const businesses = await fetchFakeBusinesses(query);

    if (businesses.length > 0) {
      alert(
        `Found businesses for "${query}":\n\n` +
        businesses.map(b => `${b.name} - ${b.location}`).join("\n")
      );
    } else {
      alert(`No businesses found for "${query}".`);
    }
  } catch (error) {
    console.error(error);
    alert("Error fetching businesses. Try again later.");
  }
});

// Fake dataset for demo
async function fetchFakeBusinesses(query) {
  const fakeData = [
    { name: "Green Earth Store", location: "Mumbai" },
    { name: "EcoMart", location: "Pune" },
    { name: "Local Crafts", location: "Delhi" },
    { name: "Handmade Haven", location: "Bangalore" },
    { name: "Artisan Alley", location: "Chennai" },
  ];

  return fakeData.filter(b => b.name.toLowerCase().includes(query.toLowerCase()));
}

// ======= CATEGORY CLICK ALERTS =======
const categories = document.querySelectorAll(".categories .circle");
categories.forEach(category => {
  category.addEventListener("click", () => {
    const categoryName = category.querySelector("p").innerText;
    alert(`You clicked on: ${categoryName}`);
  });
});
