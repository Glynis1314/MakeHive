// darkmode.js

const darkModeToggle = document.getElementById("darkModeToggle");

function applyDarkMode(enable) {
  document.body.classList.toggle("dark-mode", enable);
  document.querySelector("header")?.classList.toggle("dark-mode", enable);
  document.querySelector("footer")?.classList.toggle("dark-mode", enable);
  document.querySelector(".hero")?.classList.toggle("dark-mode", enable);
  document.querySelector(".categories")?.classList.toggle("dark-mode", enable);
  document.querySelector(".recommendations")?.classList.toggle("dark-mode", enable);
  document.querySelector(".signin-section")?.classList.toggle("dark-mode", enable);
  document.querySelectorAll(".product").forEach(p => p.classList.toggle("dark-mode", enable));
  document.querySelectorAll(".circle").forEach(c => c.classList.toggle("dark-mode", enable));
  document.querySelectorAll("nav a").forEach(a => a.classList.toggle("dark-mode", enable));
  document.querySelectorAll(".search-bar input").forEach(i => i.classList.toggle("dark-mode", enable));
  document.querySelectorAll(".search-bar button").forEach(b => b.classList.toggle("dark-mode", enable));
}

if (darkModeToggle) {
  darkModeToggle.addEventListener("click", () => {
    const isDark = !document.body.classList.contains("dark-mode");
    applyDarkMode(isDark);
    localStorage.setItem("darkMode", isDark);
  });
}

// Apply dark mode on page load if previously enabled
if (localStorage.getItem("darkMode") === "true") {
  applyDarkMode(true);
}
