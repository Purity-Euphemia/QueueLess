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

// Password visibility toggle
function setupPasswordToggle(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Find the icon container (could be a sibling or inside a parent)
    let actionIcon = input.parentElement.nextElementSibling;
    if (!actionIcon || (!actionIcon.classList.contains('split-input-action') && !actionIcon.classList.contains('eye-icon'))) {
        // Fallback for login page structure
        actionIcon = input.parentElement.parentElement.querySelector('.eye-icon');
    }
    
    if (actionIcon) {
        actionIcon.style.cursor = 'pointer';
        actionIcon.addEventListener('click', () => {
            if (input.type === 'password') {
                input.type = 'text';
                actionIcon.style.color = '#009688';
            } else {
                input.type = 'password';
                actionIcon.style.color = '';
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setupPasswordToggle("password");
});
