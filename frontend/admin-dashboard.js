requireAuth();

const user = getUser();

if (user.role !== "admin") {
  alert("Admin access required");
  window.location.href = "/dashboard.html";
}

const createQueueForm = document.getElementById("create-queue-form");
const queueNameInput = document.getElementById("queue-name");
const queueServiceInput = document.getElementById("queue-service");
const queueBranchInput = document.getElementById("queue-branch");
const createBtn = document.getElementById("create-btn");
const createMessage = document.getElementById("create-message");

const adminQueueSelect = document.getElementById("admin-queue-select");
const refreshBtn = document.getElementById("refresh-btn");
const callNextBtn = document.getElementById("call-next-btn");
const skipBtn = document.getElementById("skip-btn");
const serveBtn = document.getElementById("serve-btn");
const updateStatusBtn = document.getElementById("update-status-btn");
const queueStatusSelect = document.getElementById("queue-status-select");

const queueDashboard = document.getElementById("queue-dashboard");
const selectedQueueName = document.getElementById("selected-queue-name");
const statWaiting = document.getElementById("stat-waiting");
const statCurrent = document.getElementById("stat-current");
const statAvgWait = document.getElementById("stat-avg-wait");
const membersList = document.getElementById("members-list");
const adminMessage = document.getElementById("admin-message");
const toastContainer = document.getElementById("toast-container");
const logoutLink = document.getElementById("logout-link");

let autoRefreshInterval = null;

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

logoutLink.addEventListener("click", (e) => {
  e.preventDefault();
  logout();
});

// Create Queue
createQueueForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = queueNameInput.value.trim();
  const service = queueServiceInput.value.trim() || null;
  const branch = queueBranchInput.value.trim() || null;

  if (!name) {
    showToast("Queue name is required.", "error");
    return;
  }

  createBtn.disabled = true;
  createBtn.innerHTML = '<span class="spinner"></span> Creating...';

  const result = await createQueue(name, service, branch);

  if (result.success) {
    createMessage.textContent = `Queue "${name}" created successfully!`;
    createMessage.classList.remove("hidden");
    queueNameInput.value = "";
    queueServiceInput.value = "";
    queueBranchInput.value = "";
    showToast("Queue created!", "success");
    await loadQueues();
  } else {
    showToast(result.error || "Failed to create queue.", "error");
  }

  createBtn.disabled = false;
  createBtn.innerHTML = "Create Queue";
});

// Load Queues
async function loadQueues() {
  const result = await getAllQueues();

  if (result.success) {
    adminQueueSelect.innerHTML = '<option value="">Select a queue</option>';
    result.queues.forEach((queue) => {
      const option = document.createElement("option");
      option.value = queue.id;
      option.textContent = `${queue.name}${queue.service ? " - " + queue.service : ""} [${queue.status}]`;
      adminQueueSelect.appendChild(option);
    });
  } else {
    showToast("Could not load queues.", "error");
  }
}

// Load Selected Queue
adminQueueSelect.addEventListener("change", loadSelectedQueue);

async function loadSelectedQueue() {
  const queueId = parseInt(adminQueueSelect.value);

  if (!queueId) {
    queueDashboard.classList.add("hidden");
    clearInterval(autoRefreshInterval);
    return;
  }

  const result = await getQueueDetails(queueId);

  if (result.success) {
    queueDashboard.classList.remove("hidden");
    selectedQueueName.textContent = result.queue.queue.name;
    
    statWaiting.textContent = result.queue.total_waiting;
    statCurrent.textContent = result.queue.current_ticket 
      ? result.queue.current_ticket.ticket_number
      : "None";

    queueStatusSelect.value = result.queue.queue.status;

    displayMembers(result.queue.members);

    // Start auto-refresh
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(loadSelectedQueue, 5000);
  } else {
    showToast(result.error || "Could not load queue.", "error");
  }
}

function displayMembers(members) {
  membersList.innerHTML = "";

  if (members.length === 0) {
    membersList.innerHTML = '<p class="empty-message">No one is waiting.</p>';
    return;
  }

  members.forEach((member) => {
    const card = document.createElement("div");
    card.className = "member-card";
    card.innerHTML = `
      <div class="member-info">
        <div class="member-position">#${member.position}</div>
        <div>
          <span class="member-name">${member.name}</span>
          <p class="member-ticket">${member.ticket_number}</p>
        </div>
      </div>
      <span class="badge badge-${member.status}">${member.status}</span>
    `;
    membersList.appendChild(card);
  });
}

// Refresh
refreshBtn.addEventListener("click", loadSelectedQueue);

// Call Next
callNextBtn.addEventListener("click", async () => {
  const queueId = parseInt(adminQueueSelect.value);
  if (!queueId) {
    showToast("Select a queue first.", "error");
    return;
  }

  callNextBtn.disabled = true;
  callNextBtn.innerHTML = '<span class="spinner"></span> Calling...';

  const result = await callNextPerson(queueId);

  if (result.success) {
    showToast(`${result.member.name} (${result.member.ticket_number}) is next!`, "success");
    loadSelectedQueue();
  } else {
    showToast(result.error || "Could not call next person.", "error");
  }

  callNextBtn.disabled = false;
  callNextBtn.innerHTML = "Call Next";
});

// Skip
skipBtn.addEventListener("click", async () => {
  const queueId = parseInt(adminQueueSelect.value);
  if (!queueId) {
    showToast("Select a queue first.", "error");
    return;
  }

  skipBtn.disabled = true;
  skipBtn.innerHTML = '<span class="spinner"></span> Skipping...';

  const result = await skipPerson(queueId);

  if (result.success) {
    showToast("Customer skipped.", "success");
    loadSelectedQueue();
  } else {
    showToast(result.error || "Could not skip.", "error");
  }

  skipBtn.disabled = false;
  skipBtn.innerHTML = "Skip";
});

// Serve
serveBtn.addEventListener("click", async () => {
  const queueId = parseInt(adminQueueSelect.value);
  if (!queueId) {
    showToast("Select a queue first.", "error");
    return;
  }

  serveBtn.disabled = true;
  serveBtn.innerHTML = '<span class="spinner"></span> Marking...';

  const result = await servePerson(queueId);

  if (result.success) {
    showToast("Customer marked as served.", "success");
    loadSelectedQueue();
  } else {
    showToast(result.error || "Could not mark as served.", "error");
  }

  serveBtn.disabled = false;
  serveBtn.innerHTML = "Mark Served";
});

// Update Status
updateStatusBtn.addEventListener("click", async () => {
  const queueId = parseInt(adminQueueSelect.value);
  const status = queueStatusSelect.value;

  if (!queueId) {
    showToast("Select a queue first.", "error");
    return;
  }

  updateStatusBtn.disabled = true;
  updateStatusBtn.innerHTML = '<span class="spinner"></span> Updating...';

  const result = await updateQueueStatus(queueId, status);

  if (result.success) {
    showToast(`Queue is now ${status}.`, "success");
    loadSelectedQueue();
  } else {
    showToast(result.error || "Could not update status.", "error");
  }

  updateStatusBtn.disabled = false;
  updateStatusBtn.innerHTML = "Update Status";
});

// Initial load
loadQueues();
