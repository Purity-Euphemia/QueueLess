const API_URL = "http://127.0.0.1:5000";

// DOM elements
const createQueueForm = document.getElementById("create-queue-form");
const queueNameInput = document.getElementById("queue-name");
const createButton = document.getElementById("create-button");
const queueSelect = document.getElementById("admin-queue-select");
const refreshButton = document.getElementById("refresh-button");
const callNextButton = document.getElementById("call-next-button");
const dashboard = document.getElementById("queue-dashboard");
const selectedQueueName = document.getElementById("selected-queue-name");
const queueSummary = document.getElementById("queue-summary");
const membersList = document.getElementById("members-list");
const adminMessage = document.getElementById("admin-message");
const toastContainer = document.getElementById("toast-container");

// ============================================
// Toast Notifications
// ============================================

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

// ============================================
// Show Message
// ============================================

function showMessage(message, isError = false) {
    adminMessage.textContent = message;
    adminMessage.className = isError
        ? "admin-message error"
        : "admin-message success";
}

// ============================================
// Load Queues
// ============================================

async function loadQueues() {
    try {
        const response = await fetch(`${API_URL}/queues`);
        const data = await response.json();

        queueSelect.innerHTML = `
            <option value="">Select a queue</option>
        `;

        data.queues.forEach(function (queue) {
            const option = document.createElement("option");
            option.value = queue.id;
            option.textContent = queue.name;
            queueSelect.appendChild(option);
        });

    } catch (error) {
        showToast("Could not connect to the backend.", "error");
    }
}

// ============================================
// Create Queue
// ============================================

createQueueForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = queueNameInput.value.trim();

    createButton.disabled = true;
    createButton.innerHTML = '<span class="spinner"></span> Creating...';

    try {
        const response = await fetch(`${API_URL}/queues`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || "Could not create queue.", "error");
            return;
        }

        queueNameInput.value = "";
        showToast("Queue created successfully!", "success");

        await loadQueues();
        queueSelect.value = data.queue.id;
        loadSelectedQueue();

    } catch (error) {
        showToast("Could not connect to the backend.", "error");
    } finally {
        createButton.disabled = false;
        createButton.innerHTML = "Create Queue";
    }
});

// ============================================
// Load Selected Queue
// ============================================

queueSelect.addEventListener("change", loadSelectedQueue);

async function loadSelectedQueue() {
    const queueId = queueSelect.value;

    if (!queueId) {
        dashboard.classList.add("hidden");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/queues/${queueId}`);
        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || "Could not load queue.", "error");
            return;
        }

        dashboard.classList.remove("hidden");
        selectedQueueName.textContent = data.queue.name;
        queueSummary.textContent = `${data.total_waiting} person(s) waiting`;
        displayMembers(data.members);

    } catch (error) {
        showToast("Could not connect to the backend.", "error");
    }
}

// ============================================
// Display Members
// ============================================

function displayMembers(members) {
    membersList.innerHTML = "";

    if (members.length === 0) {
        membersList.innerHTML = `
            <p class="empty-message">No one is waiting in this queue yet.</p>
        `;
        return;
    }

    members.forEach(function (member) {
        const card = document.createElement("div");
        card.className = "member-card";

        const statusClass = `badge-${member.status}`;

        card.innerHTML = `
            <div class="member-info">
                <div class="member-position">#${member.position}</div>
                <span class="member-name">${member.name}</span>
            </div>
            <span class="badge ${statusClass}">${member.status}</span>
        `;

        membersList.appendChild(card);
    });
}

// ============================================
// Refresh Button
// ============================================

refreshButton.addEventListener("click", loadSelectedQueue);

// ============================================
// Call Next Person
// ============================================

callNextButton.addEventListener("click", async function () {
    const queueId = queueSelect.value;

    if (!queueId) {
        showToast("Select a queue first.", "error");
        return;
    }

    callNextButton.disabled = true;
    callNextButton.innerHTML = '<span class="spinner"></span> Calling...';

    try {
        const response = await fetch(`${API_URL}/admin/queues/${queueId}/next`, {
            method: "POST"
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || "Nobody is waiting.", "error");
            return;
        }

        showToast(data.message, "success");
        loadSelectedQueue();

    } catch (error) {
        showToast("Could not connect to the backend.", "error");
    } finally {
        callNextButton.disabled = false;
        callNextButton.innerHTML = "Call Next Person";
    }
});

// ============================================
// Start
// ============================================

loadQueues();

// Auto-refresh every 5 seconds
setInterval(function () {
    if (queueSelect.value) {
        loadSelectedQueue();
    }
}, 5000);
