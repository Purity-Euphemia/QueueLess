requireNoAuth();

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const errorMessage = document.getElementById("error-message");
const toastContainer = document.getElementById("toast-container");

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 4000);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  errorMessage.classList.add("hidden");

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showAuthError("Please fill in all fields.", errorMessage);
    return;
  }

  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="spinner"></span> Signing in...';

  const result = await login(email, password);

  if (result.success) {
    showToast("Login successful! Redirecting...", "success");
    setTimeout(() => {
      window.location.href = "/dashboard.html";
    }, 1500);
  } else {
    showAuthError(result.error || "Login failed. Please try again.", errorMessage);
    loginBtn.disabled = false;
    loginBtn.innerHTML = "Sign In";
  }
});
