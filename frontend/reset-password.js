requireNoAuth();

const stepRequestContainer = document.getElementById("step-request-container");
const stepConfirmContainer = document.getElementById("step-confirm-container");
const requestResetForm = document.getElementById("request-reset-form");
const confirmResetForm = document.getElementById("confirm-reset-form");

const requestEmailInput = document.getElementById("request-email");
const requestBtn = document.getElementById("request-btn");

const resetTokenInput = document.getElementById("reset-token");
const newPasswordInput = document.getElementById("new-password");
const confirmNewPasswordInput = document.getElementById("confirm-new-password");
const confirmBtn = document.getElementById("confirm-btn");

const errorMessage = document.getElementById("error-message");
const toastContainer = document.getElementById("toast-container");
const switchStepBtn = document.getElementById("switch-step-btn");

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

function showStep(step) {
  errorMessage.classList.add("hidden");
  if (step === 1) {
    stepRequestContainer.classList.remove("hidden");
    stepConfirmContainer.classList.add("hidden");
    switchStepBtn.textContent = "Already have a token? Set new password";
  } else {
    stepRequestContainer.classList.add("hidden");
    stepConfirmContainer.classList.remove("hidden");
    switchStepBtn.textContent = "Need a reset token? Request one here";
  }
}

// Check URL query param for reset token (e.g. reset-password.html?token=xyz)
const urlParams = new URLSearchParams(window.location.search);
const tokenParam = urlParams.get("token");

if (tokenParam) {
  showStep(2);
  resetTokenInput.value = tokenParam;
}

switchStepBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const isStep1Visible = !stepRequestContainer.classList.contains("hidden");
  showStep(isStep1Visible ? 2 : 1);
});

// Handle Step 1: Request Token
requestResetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.classList.add("hidden");

  const email = requestEmailInput.value.trim();
  if (!email) {
    showAuthError("Please enter your email address.", errorMessage);
    return;
  }

  requestBtn.disabled = true;
  requestBtn.innerHTML = '<span class="spinner"></span> Generating Token...';

  const result = await requestPasswordReset(email);

  requestBtn.disabled = false;
  requestBtn.innerHTML = "Get Reset Token";

  if (result.success) {
    showToast("Reset token generated successfully!", "success");
    resetTokenInput.value = result.reset_token;
    showStep(2);
    newPasswordInput.focus();
  } else {
    showAuthError(result.error || "Failed to generate reset token.", errorMessage);
  }
});

// Handle Step 2: Confirm Reset Password
confirmResetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.classList.add("hidden");

  const token = resetTokenInput.value.trim();
  const newPassword = newPasswordInput.value.trim();
  const confirmPassword = confirmNewPasswordInput.value.trim();

  if (!token || !newPassword || !confirmPassword) {
    showAuthError("Please fill in all fields.", errorMessage);
    return;
  }

  if (newPassword !== confirmPassword) {
    showAuthError("Passwords do not match.", errorMessage);
    return;
  }

  if (newPassword.length < 6) {
    showAuthError("Password must be at least 6 characters long.", errorMessage);
    return;
  }

  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<span class="spinner"></span> Updating Password...';

  const result = await resetPassword(token, newPassword);

  if (result.success) {
    showToast("Password updated successfully! Redirecting to login...", "success");
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1500);
  } else {
    showAuthError(result.error || "Failed to reset password. Token may be invalid or expired.", errorMessage);
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = "Update Password";
  }
});
