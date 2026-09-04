requireNoAuth();

const registerForm = document.getElementById("register-form");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
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
  const phone = phoneInput ? phoneInput.value.trim() : "";
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (!name || !email || !password || !confirmPassword || (phoneInput && !phone)) {
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

  const result = await register(name, email, password, phone);

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
    setupPasswordToggle("confirm-password");
});
