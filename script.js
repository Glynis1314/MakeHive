// Search functionality
const searchBtn = document.querySelector(".search-bar button");
const searchInput = document.querySelector(".search-bar input");

searchBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim();
  if (query) {
    try {
      // Use local fake dataset instead of external API
      const businesses = await fetchFakeBusinesses(query);

      if (businesses.length > 0) {
        alert(`Found businesses for "${query}":\n\n` + 
          businesses.map(b => `${b.name} - ${b.location}`).join("\n"));
      } else {
        alert(`No businesses found for "${query}".`);
      }
    } catch (error) {
      console.error(error);
      alert("Error fetching businesses. Try again later.");
    }
  } else {
    alert("Please type something to search.");
  }
});

// Local fake dataset for frontend demo
async function fetchFakeBusinesses(query) {
  const fakeData = [
    { name: "Green Earth Store", location: "Mumbai" },
    { name: "EcoMart", location: "Pune" },
    { name: "Local Crafts", location: "Delhi" },
    { name: "Handmade Haven", location: "Bangalore" },
    { name: "Artisan Alley", location: "Chennai" },
  ];

  // Filter dataset based on search query
  return fakeData.filter(b => b.name.toLowerCase().includes(query.toLowerCase()));
}

// Category click functionality
const categories = document.querySelectorAll(".categories .circle");
categories.forEach(category => {
  category.addEventListener("click", () => {
    const categoryName = category.querySelector("p").innerText;
    alert(`You clicked on: ${categoryName}`);
  });
});

// Sign in button
const signInBtn = document.querySelector(".signin-btn");
signInBtn.addEventListener("click", () => {
  alert("Sign In functionality will go here (popup/login form).");
});
