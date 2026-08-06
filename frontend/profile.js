requireAuth();

const user = getUser();
const profileForm = document.getElementById("profile-form");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const memberSinceInput = document.getElementById("member-since");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const logoutLink = document.getElementById("logout-link");
const logoutBtn = document.getElementById("logout-btn");
const changePasswordBtn = document.getElementById("change-password-btn");
const passwordModal = document.getElementById("password-modal");
const passwordForm = document.getElementById("password-form");
const closeModalBtn = document.getElementById("close-modal");
const successMessage = document.getElementById("success-message");
const errorMessage = document.getElementById("error-message");
const toastContainer = document.getElementById("toast-container");

let originalName = user.name;
let originalEmail = user.email;

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

function hideMessages() {
  successMessage.classList.add("hidden");
  errorMessage.classList.add("hidden");
}

// Load user profile
nameInput.value = user.name;
emailInput.value = user.email;
memberSinceInput.value = new Date(user.created_at || new Date()).toLocaleDateString();

// Save profile changes
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessages();

  const newName = nameInput.value.trim();
  const newEmail = emailInput.value.trim();

  if (!newName || !newEmail) {
    errorMessage.textContent = "Please fill in all fields.";
    errorMessage.classList.remove("hidden");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spinner"></span> Saving...';

  const result = await updateProfile(newName, newEmail);

  if (result.success) {
    originalName = newName;
    originalEmail = newEmail;
    successMessage.textContent = "Profile updated successfully!";
    successMessage.classList.remove("hidden");
    showToast("Profile updated!", "success");
  } else {
    errorMessage.textContent = result.error || "Failed to update profile.";
    errorMessage.classList.remove("hidden");
    showToast(result.error || "Failed to update profile.", "error");
  }

  saveBtn.disabled = false;
  saveBtn.innerHTML = "Save Changes";
});

cancelBtn.addEventListener("click", (e) => {
  e.preventDefault();
  hideMessages();
  nameInput.value = originalName;
  emailInput.value = originalEmail;
});

logoutBtn.addEventListener("click", () => {
  logout();
});

if (logoutLink) {
  logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
}

// Change password modal
changePasswordBtn.addEventListener("click", () => {
  passwordModal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => {
  passwordModal.classList.add("hidden");
  passwordForm.reset();
});

passwordModal.addEventListener("click", (e) => {
  if (e.target === passwordModal) {
    passwordModal.classList.add("hidden");
    passwordForm.reset();
  }
});

passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const oldPassword = document.getElementById("old-password").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-new-password").value;

  if (!oldPassword || !newPassword || !confirmPassword) {
    showToast("Please fill in all password fields.", "error");
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast("New passwords do not match.", "error");
    return;
  }

  if (newPassword.length < 6) {
    showToast("Password must be at least 6 characters.", "error");
    return;
  }

  // Call the password change endpoint
  const submitBtn = passwordForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Changing Password...';

  try {
    const { status, data } = await apiCall('/auth/password-change', 'POST', {
      old_password: oldPassword,
      new_password: newPassword
    });

    if (status === 200) {
      showToast("Password changed successfully!", "success");
      passwordModal.classList.add("hidden");
      passwordForm.reset();
    } else {
      showToast(data.error || "Failed to change password.", "error");
    }
  } catch (error) {
    showToast("Error changing password: " + error.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = "Change Password";
  }
});
