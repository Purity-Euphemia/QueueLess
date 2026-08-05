const API_URL = "http://127.0.0.1:5000";

// DOM elements
const joinForm = document.getElementById("join-form");
const nameInput = document.getElementById("name");
const queueSelect = document.getElementById("queue");
const joinButton = document.getElementById("join-button");
const resultSection = document.getElementById("result");
const welcomeMessage = document.getElementById("welcome-message");
const position = document.getElementById("position");
const peopleAhead = document.getElementById("people-ahead");
const errorMessage = document.getElementById("error-message");
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
        queueSelect.innerHTML = `
            <option value="">No queues available</option>
        `;
        showToast("Could not connect to the backend.", "error");
    }
}

// ============================================
// Join Queue
// ============================================

joinForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    errorMessage.classList.add("hidden");
    errorMessage.textContent = "";

    const name = nameInput.value.trim();
    const queueId = queueSelect.value;

    if (!queueId) {
        showToast("Please select a queue.", "error");
        return;
    }

    // Loading state
    joinButton.disabled = true;
    joinButton.innerHTML = '<span class="spinner"></span> Joining...';

    try {
        const response = await fetch(`${API_URL}/queues/${queueId}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || "Could not join queue.", "error");
            return;
        }

        showQueueResult(data, name);
        showToast(`Welcome, ${name}! You joined the queue.`, "success");

    } catch (error) {
        showToast("Could not connect to the backend.", "error");
    } finally {
        joinButton.disabled = false;
        joinButton.innerHTML = "Join Queue";
    }
});

// ============================================
// Show Result
// ============================================

function showQueueResult(data, name) {
    welcomeMessage.textContent = `Welcome, ${name}!`;
    position.textContent = data.position;
    peopleAhead.textContent = data.people_ahead;

    resultSection.classList.remove("hidden");
    resultSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ============================================
// Start
// ============================================

loadQueues();
