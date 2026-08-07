requireAuth();

const user = getUser();
const joinForm = document.getElementById("join-form");
const queueSelect = document.getElementById("queue-select");
const joinBtn = document.getElementById("join-btn");
const userGreeting = document.getElementById("user-greeting");
const currentTicketSection = document.getElementById("current-ticket-section");
const currentTicketNumber = document.getElementById("current-ticket-number");
const currentQueueName = document.getElementById("current-queue-name");
const currentTicketStatus = document.getElementById("current-ticket-status");
const currentPosition = document.getElementById("current-position");
const currentWaitTime = document.getElementById("current-wait-time");
const nowServingNumber = document.getElementById("now-serving-number");
const leaveQueueBtn = document.getElementById("leave-queue-btn");
const suggestionsList = document.getElementById("suggestions-list");
const errorMessage = document.getElementById("error-message");
const toastContainer = document.getElementById("toast-container");
const logoutLink = document.getElementById("logout-link");

let currentTicket = JSON.parse(sessionStorage.getItem("current_ticket")) || null;
let refreshInterval = null;

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

userGreeting.textContent = `Welcome, ${user.name}! Ready to skip the line?`;

logoutLink.addEventListener("click", (e) => {
  e.preventDefault();
  logout();
});

// Load queues
async function loadQueues() {
  const result = await getAllQueues();
  if (result.success) {
    queueSelect.innerHTML = '<option value="">Select a queue</option>';
    result.queues.forEach((queue) => {
      const option = document.createElement("option");
      option.value = queue.id;
      const servingTxt = queue.now_serving ? ` [Serving: ${queue.now_serving}]` : " [Serving: None]";
      option.textContent = `${queue.name}${queue.service ? " - " + queue.service : ""}${servingTxt}`;
      queueSelect.appendChild(option);
    });
  } else {
    queueSelect.innerHTML = '<option value="">Error loading queues</option>';
    showToast("Could not load queues.", "error");
  }
}

// Load queue suggestions
async function loadSuggestions() {
  const result = await getQueueSuggestions();
  if (result.success) {
    suggestionsList.innerHTML = "";
    result.suggestions.forEach((queue) => {
      const card = document.createElement("div");
      card.className = "suggestion-card";
      card.innerHTML = `
        <h4>${queue.name}</h4>
        <p class="service">${queue.service || "General"}</p>
        <p class="now-serving-text">Now Serving: <strong>${queue.now_serving || "None"}</strong></p>
        <p class="waiting">Waiting: <strong>${queue.waiting}</strong></p>
        <p class="wait-time">Est: <strong>${queue.estimated_wait}</strong></p>
      `;
      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        queueSelect.value = queue.id;
      });
      suggestionsList.appendChild(card);
    });
  }
}

// Join queue
joinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMessage.classList.add("hidden");

  const queueId = parseInt(queueSelect.value);
  if (!queueId) {
    showToast("Please select a queue.", "error");
    return;
  }

  joinBtn.disabled = true;
  joinBtn.innerHTML = '<span class="spinner"></span> Joining...';

  const result = await joinQueue(queueId, user.name, user.id);

  if (result.success) {
    currentTicket = {
      id: result.ticket.member_id,
      queue_id: queueId,
      ticket_number: result.ticket.ticket_number,
      position: result.ticket.position,
      estimated_wait: result.ticket.estimated_wait_minutes,
      service: result.ticket.service || null
    };
    sessionStorage.setItem("current_ticket", JSON.stringify(currentTicket));
    
    showToast(`Welcome! Your ticket is ${result.ticket.ticket_number}`, "success");
    displayCurrentTicket();
    startRefreshing();
    joinForm.style.display = "none";
  } else {
    showToast(result.error || "Could not join queue.", "error");
    joinBtn.disabled = false;
    joinBtn.innerHTML = "Join Queue";
  }
});

// Display current ticket
async function displayCurrentTicket() {
  if (!currentTicket) {
    currentTicketSection.classList.add("hidden");
    joinForm.style.display = "block";
    return;
  }

  currentTicketSection.classList.remove("hidden");
  currentTicketNumber.textContent = currentTicket.ticket_number;
  currentPosition.textContent = currentTicket.position || "--";
  currentWaitTime.textContent = currentTicket.estimated_wait ? `${currentTicket.estimated_wait} min` : "--";

  // Get queue status for now serving info
  const statusResult = await getQueueStatus(currentTicket.queue_id);
  if (statusResult.success && statusResult.queue) {
    const serving = statusResult.queue.now_serving;
    nowServingNumber.textContent = serving || "None";
    if (serving === currentTicket.ticket_number) {
      nowServingNumber.classList.add("pulse-serving");
    } else {
      nowServingNumber.classList.remove("pulse-serving");
    }
  }

  // Get queue name
  const queueResult = await getQueueDetails(currentTicket.queue_id);
  if (queueResult.success) {
    const q = queueResult.queue.queue;
    currentQueueName.textContent = `${q.name}${q.service ? " - " + q.service : ""}`;
  }
}

// Refresh current ticket position
async function refreshPosition() {
  if (!currentTicket) return;

  const result = await getMyPosition(currentTicket.queue_id, currentTicket.id);
  if (result.success) {
    currentTicket.position = result.position.position;
    currentTicket.estimated_wait = result.position.estimated_wait_minutes;
    currentPosition.textContent = result.position.position !== undefined ? result.position.position : "--";
    currentWaitTime.textContent = result.position.estimated_wait_minutes !== undefined ? `${result.position.estimated_wait_minutes} min` : "--";

    const serving = result.position.now_serving;
    if (nowServingNumber) {
      nowServingNumber.textContent = serving || "None";
      if (serving === currentTicket.ticket_number) {
        nowServingNumber.classList.add("pulse-serving");
      } else {
        nowServingNumber.classList.remove("pulse-serving");
      }
    }

    if (result.position.status !== "waiting") {
      currentTicketStatus.textContent = `Status: ${result.position.status}`;
      if (result.position.status === "called") {
        showToast("🔔 Ticket " + currentTicket.ticket_number + " is NOW SERVING! Please proceed to counter.", "info");
      }
    }
  }
}

function startRefreshing() {
  if (refreshInterval) clearInterval(refreshInterval);
  refreshPosition();
  refreshInterval = setInterval(refreshPosition, 10000); // Refresh every 10 seconds
}

leaveQueueBtn.addEventListener("click", async () => {
  if (!currentTicket) return;

  const confirmed = confirm("Are you sure you want to leave the queue?");
  if (!confirmed) return;

  const result = await leaveQueue(currentTicket.queue_id, currentTicket.id);
  if (result.success) {
    sessionStorage.removeItem("current_ticket");
    currentTicket = null;
    clearInterval(refreshInterval);
    displayCurrentTicket();
    showToast("You have left the queue.", "success");
  } else {
    showToast("Could not leave queue.", "error");
  }
});

// Initial load
loadQueues();
loadSuggestions();
displayCurrentTicket();

if (currentTicket) {
  startRefreshing();
}
