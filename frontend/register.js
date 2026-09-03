requireNoAuth();

const registerForm = document.getElementById("register-form");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const registerBtn = document.getElementById("register-btn");
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

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  errorMessage.classList.add("hidden");

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (!name || !email || !password || !confirmPassword) {
    showAuthError("Please fill in all fields.", errorMessage);
    return;
  }

  if (password !== confirmPassword) {
    showAuthError("Passwords do not match.", errorMessage);
    return;
  }

  if (password.length < 6) {
    showAuthError("Password must be at least 6 characters.", errorMessage);
    return;
  }

  registerBtn.disabled = true;
  registerBtn.innerHTML = '<span class="spinner"></span> Creating account...';

  const result = await register(name, email, password);

  if (result.success) {
    showToast("Account created! Redirecting to dashboard...", "success");
    setTimeout(() => {
      window.location.href = "/dashboard.html";
    }, 1500);
  } else {
    showAuthError(result.error || "Registration failed. Please try again.", errorMessage);
    registerBtn.disabled = false;
    registerBtn.innerHTML = "Create Account";
  }
});
