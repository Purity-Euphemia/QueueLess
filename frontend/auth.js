const API_BASE_URL = "http://127.0.0.1:5000";

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

function getToken() {
  return localStorage.getItem("auth_token");
}

function setToken(token) {
  localStorage.setItem("auth_token", token);
}

function removeToken() {
  localStorage.removeItem("auth_token");
}

function getUser() {
  const user = localStorage.getItem("current_user");
  return user ? JSON.parse(user) : null;
}

function setUser(user) {
  localStorage.setItem("current_user", JSON.stringify(user));
}

function removeUser() {
  localStorage.removeItem("current_user");
}

function isAuthenticated() {
  return getToken() !== null;
}

// ============================================
// API CALLS
// ============================================

async function apiCall(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json"
    }
  };

  const token = getToken();
  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok && response.status === 401) {
      removeToken();
      removeUser();
      window.location.href = "/login.html";
    }

    return { status: response.status, data };
  } catch (error) {
    console.error("API Error:", error);
    return { status: 0, data: { error: "Network error" } };
  }
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

async function register(name, email, password) {
  const { status, data } = await apiCall("/auth/register", "POST", {
    name,
    email,
    password
  });

  if (status === 201) {
    setToken(data.token);
    setUser(data.user);
    return { success: true, user: data.user };
  }

  return { success: false, error: data.error };
}

async function login(email, password) {
  const { status, data } = await apiCall("/auth/login", "POST", {
    email,
    password
  });

  if (status === 200) {
    setToken(data.token);
    setUser(data.user);
    return { success: true, user: data.user };
  }

  return { success: false, error: data.error };
}

function logout() {
  removeToken();
  removeUser();
  window.location.href = "/login.html";
}

async function requestPasswordReset(email) {
  const { status, data } = await apiCall("/auth/reset-password", "POST", {
    email
  });

  if (status === 200) {
    return { success: true, reset_token: data.reset_token };
  }

  return { success: false, error: data.error };
}

async function resetPassword(token, password) {
  const { status, data } = await apiCall("/auth/reset-password/confirm", "POST", {
    token,
    password
  });

  if (status === 200) {
    return { success: true };
  }

  return { success: false, error: data.error };
}

async function getProfile() {
  const { status, data } = await apiCall("/auth/profile", "GET");

  if (status === 200) {
    setUser(data.user);
    return { success: true, user: data.user };
  }

  return { success: false, error: data.error };
}

async function updateProfile(name, email) {
  const { status, data } = await apiCall("/auth/profile", "PUT", {
    name,
    email
  });

  if (status === 200) {
    setUser(data.user);
    return { success: true, user: data.user };
  }

  return { success: false, error: data.error };
}

async function changePassword(oldPassword, newPassword) {
  const { status, data } = await apiCall("/auth/password-change", "POST", {
    old_password: oldPassword,
    new_password: newPassword
  });

  if (status === 200) {
    return { success: true };
  }

  return { success: false, error: data.error };
}

// ============================================
// QUEUE FUNCTIONS
// ============================================

async function getAllQueues() {
  const { status, data } = await apiCall("/queues", "GET");

  if (status === 200) {
    return { success: true, queues: data.queues };
  }

  return { success: false, error: data.error };
}

async function getQueueSuggestions() {
  const { status, data } = await apiCall("/queues/suggestions", "GET");

  if (status === 200) {
    return { success: true, suggestions: data.suggestions };
  }

  return { success: false, error: data.error };
}

async function getQueueStatus(queueId) {
  const { status, data } = await apiCall(`/queues/${queueId}/status`, "GET");

  if (status === 200) {
    return { success: true, queue: data };
  }

  return { success: false, error: data.error };
}

async function getNowServing(queueId) {
  const { status, data } = await apiCall(`/queues/${queueId}/now-serving`, "GET");

  if (status === 200) {
    return { success: true, data };
  }

  return { success: false, error: data.error };
}

async function getQueueDetails(queueId) {
  const { status, data } = await apiCall(`/queues/${queueId}`, "GET");

  if (status === 200) {
    return { success: true, queue: data };
  }

  return { success: false, error: data.error };
}

async function joinQueue(queueId, name, userId = null) {
  const { status, data } = await apiCall(`/queues/${queueId}/join`, "POST", {
    name,
    user_id: userId
  });

  if (status === 201) {
    return { success: true, ticket: data };
  }

  return { success: false, error: data.error, status_code: data.status_code };
}

async function getMyPosition(queueId, ticketId) {
  const { status, data } = await apiCall(
    `/queues/${queueId}/members/${ticketId}`,
    "GET"
  );

  if (status === 200) {
    return { success: true, position: data };
  }

  return { success: false, error: data.error };
}

async function leaveQueue(queueId, ticketId) {
  const { status, data } = await apiCall(
    `/queues/${queueId}/members/${ticketId}`,
    "DELETE"
  );

  if (status === 200) {
    return { success: true };
  }

  return { success: false, error: data.error };
}

async function getQueueHistory(queueId) {
  const { status, data } = await apiCall(`/queues/${queueId}/history`, "GET");

  if (status === 200) {
    return { success: true, tickets: data.tickets };
  }

  return { success: false, error: data.error };
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

async function createQueue(name, service = null, branchName = null) {
  const { status, data } = await apiCall("/queues", "POST", {
    name,
    service,
    branch_name: branchName
  });

  if (status === 201) {
    return { success: true, queue: data.queue };
  }

  return { success: false, error: data.error };
}

async function callNextPerson(queueId) {
  const { status, data } = await apiCall(
    `/admin/queues/${queueId}/next`,
    "POST"
  );

  if (status === 200) {
    return { success: true, member: data.member };
  }

  return { success: false, error: data.error };
}

async function skipPerson(queueId) {
  const { status, data } = await apiCall(
    `/admin/queues/${queueId}/skip`,
    "POST"
  );

  if (status === 200) {
    return { success: true };
  }

  return { success: false, error: data.error };
}

async function servePerson(queueId) {
  const { status, data } = await apiCall(
    `/admin/queues/${queueId}/serve`,
    "POST"
  );

  if (status === 200) {
    return { success: true };
  }

  return { success: false, error: data.error };
}

async function updateQueueStatus(queueId, status) {
  const { statusCode, data } = await apiCall(
    `/admin/queues/${queueId}/status`,
    "PATCH",
    { status }
  );

  if (statusCode === 200) {
    return { success: true };
  }

  return { success: false, error: data.error };
}

// ============================================
// GUARD FUNCTIONS
// ============================================

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = "/login.html";
  }
}

function requireNoAuth() {
  if (isAuthenticated()) {
    window.location.href = "/dashboard.html";
  }
}

function showAuthError(message, element) {
  if (element) {
    element.textContent = message;
    element.classList.remove("hidden");
  } else {
    alert(message);
  }
}
