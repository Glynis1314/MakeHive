// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

const form = document.getElementById("resetForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword !== confirmPassword) {
    message.style.color = "red";
    message.innerText = "Passwords do not match!";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await res.json();
    if (res.ok) {
      message.style.color = "green";
      message.innerText = data.msg;
      form.reset();
    } else {
      message.style.color = "red";
      message.innerText = data.msg || "Something went wrong";
    }
  } catch (err) {
    message.style.color = "red";
    message.innerText = "Server error";
    console.log(err);
  }
});