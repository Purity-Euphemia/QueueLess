requireAuth();

const user = getUser();
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

// New elements for visual discovery
const categoryCards = document.querySelectorAll(".category-card");
const businessesSection = document.getElementById("businesses-section");
const categoryTitle = document.getElementById("category-title");
const businessesList = document.getElementById("businesses-list");
const discoverySection = document.getElementById("discovery-section");
const proximityAlert = document.getElementById("proximity-alert");

// Modal elements
const serviceModal = document.getElementById("service-modal");
const modalBusinessName = document.getElementById("modal-business-name");
const modalBusinessDescription = document.getElementById("modal-business-description");
const servicesList = document.getElementById("services-list");
const closeModalBtn = document.getElementById("close-modal-btn");

// Ticket progress elements
const stepJoined = document.getElementById("progress-step-joined");
const stepWaiting = document.getElementById("progress-step-waiting");
const stepNear = document.getElementById("progress-step-near");
const stepCalled = document.getElementById("progress-step-called");

let currentTicket = JSON.parse(sessionStorage.getItem("current_ticket")) || null;
let refreshInterval = null;
let allQueues = [];

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

// Sound synthesizer using Web Audio API
let soundDebounce = 0;
function playNotificationSound() {
  const now = Date.now();
  if (now - soundDebounce < 30000) return; // 30s debounce
  soundDebounce = now;

  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // High soft synth notes (pleasant chime)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.3);
    
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.3);

    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.4);
      
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.4);
    }, 120);
  } catch (err) {
    console.warn("Could not play synthesized alert sound:", err);
  }
}

// Group queues by business name
function groupQueuesByBusiness(queues) {
  const businesses = {};
  queues.forEach((q) => {
    if (!businesses[q.name]) {
      businesses[q.name] = {
        name: q.name,
        category: q.category,
        description: q.description || `Active services at ${q.name}`,
        queues: []
      };
    }
    businesses[q.name].queues.push(q);
  });
  return Object.values(businesses);
}

// Load queues from database
async function fetchAndSetupDiscovery() {
  const result = await getAllQueues();
  if (result.success) {
    allQueues = result.queues;
  } else {
    showToast("Could not load queues.", "error");
  }
}

// Filter and render businesses
function selectCategory(category) {
  categoryCards.forEach(card => {
    if (card.dataset.category === category) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });

  const filteredQueues = allQueues.filter(q => q.category === category);
  const businesses = groupQueuesByBusiness(filteredQueues);

  // Update Section Header
  const categoryNames = {
    hospital: "🏥 Hospitals & Medical Centers",
    bank: "🏦 Financial & Banking Services",
    pharmacy: "💊 Pharmacies & Dispensaries",
    salon: "💇 Salons & Grooming Services",
    government: "🏛️ Government & Public Offices",
    restaurant: "🍽️ Restaurants & Dining Cafes"
  };
  
  categoryTitle.textContent = categoryNames[category] || "Businesses";
  businessesSection.classList.remove("hidden");
  
  renderBusinesses(businesses);
  businessesSection.scrollIntoView({ behavior: "smooth" });
}

// Render dynamic list of businesses
function renderBusinesses(businesses) {
  businessesList.innerHTML = "";
  if (businesses.length === 0) {
    businessesList.innerHTML = `<p class="empty-message">No active businesses registered in this category.</p>`;
    return;
  }

  businesses.forEach(biz => {
    const card = document.createElement("div");
    card.className = "business-card";

    // Calculate total waiting
    const totalWaiting = biz.queues.reduce((sum, q) => sum + (q.waiting || 0), 0);
    // Find min wait time
    const openQueues = biz.queues.filter(q => q.status === "open");
    let formattedMinWait = "No wait";
    if (openQueues.length > 0) {
      const waitTimes = openQueues.map(q => q.estimated_wait_seconds || 0);
      const minWaitSec = Math.min(...waitTimes);
      const minWaitMin = Math.round(minWaitSec / 60);
      formattedMinWait = minWaitMin > 0 ? `${minWaitMin} min` : "Less than 1 min";
    }

    card.innerHTML = `
      <div class="business-card-header">
        <h4>${biz.name}</h4>
        <span class="business-status open">Open</span>
      </div>
      <p class="business-desc">${biz.description}</p>
      <div class="business-stats">
        <span>👥 ${totalWaiting} waiting</span>
        <span>⏱️ Min Wait: ${formattedMinWait}</span>
      </div>
      <button class="btn-primary join-biz-btn">Browse Services</button>
    `;

    card.querySelector(".join-biz-btn").addEventListener("click", () => {
      openServiceModal(biz);
    });

    businessesList.appendChild(card);
  });
}

// Modal management
function openServiceModal(biz) {
  modalBusinessName.textContent = biz.name;
  modalBusinessDescription.textContent = biz.description;
  servicesList.innerHTML = "";

  biz.queues.forEach(q => {
    const item = document.createElement("div");
    item.className = "service-item-row";
    
    const isClosed = q.status !== "open";
    
    item.innerHTML = `
      <div class="service-item-info">
        <h5>${q.service || "General Counter"}</h5>
        <p class="service-item-stats">
          Waiting: <strong>${q.waiting || 0}</strong> &nbsp;|&nbsp; 
          Now Serving: <strong>${q.now_serving || "None"}</strong> &nbsp;|&nbsp; 
          Est. Wait: <strong>${q.estimated_wait || "No wait"}</strong>
        </p>
      </div>
      <button class="btn-primary join-service-btn" ${isClosed ? "disabled" : ""}>
        ${isClosed ? "Closed" : "Join Queue"}
      </button>
    `;

    if (!isClosed) {
      item.querySelector(".join-service-btn").addEventListener("click", (e) => {
        joinQueueById(q.id, e.target);
      });
    }

    servicesList.appendChild(item);
  });

  serviceModal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Disable scroll
}

function closeServiceModal() {
  serviceModal.classList.add("hidden");
  document.body.style.overflow = "auto";
}

closeModalBtn.addEventListener("click", closeServiceModal);
serviceModal.addEventListener("click", (e) => {
  if (e.target === serviceModal) closeServiceModal();
});

// Join queue action
async function joinQueueById(queueId, btn) {
  if (currentTicket) {
    showToast("You are already in an active queue. Please leave your current queue first.", "warning");
    closeServiceModal();
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Joining...';

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
    closeServiceModal();
    displayCurrentTicket();
    startRefreshing();
  } else {
    showToast(result.error || "Could not join queue.", "error");
    btn.disabled = false;
    btn.innerHTML = "Join Queue";
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
        // Open service modal for the matching business
        const matchingBiz = allQueues.filter(q => q.name === queue.name);
        if (matchingBiz.length > 0) {
          openServiceModal({
            name: queue.name,
            description: queue.description || `Active services at ${queue.name}`,
            queues: matchingBiz
          });
        }
      });
      suggestionsList.appendChild(card);
    });
  }
}

// Display current active ticket and setup progress bar
async function displayCurrentTicket() {
  if (!currentTicket) {
    currentTicketSection.classList.add("hidden");
    return;
  }

  currentTicketSection.classList.remove("hidden");

  currentTicketNumber.textContent = currentTicket.ticket_number;
  currentPosition.textContent = currentTicket.position !== undefined ? currentTicket.position : "--";
  currentWaitTime.textContent = currentTicket.estimated_wait ? `${currentTicket.estimated_wait} min` : "--";

  // Setup initial active steps on progress bar
  stepJoined.classList.add("active");
  stepWaiting.classList.add("active");
  stepNear.classList.remove("active");
  stepCalled.classList.remove("active");
  proximityAlert.classList.add("hidden");

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

  // Get queue details
  const queueResult = await getQueueDetails(currentTicket.queue_id);
  if (queueResult.success) {
    const q = queueResult.queue.queue;
    currentQueueName.textContent = `${q.name}${q.service ? " - " + q.service : ""}`;
  }
}

// Refresh current ticket status, position, and check proximity
async function refreshPosition() {
  if (!currentTicket) return;

  const result = await getMyPosition(currentTicket.queue_id, currentTicket.id);
  if (result.success) {
    currentTicket.position = result.position.position;
    currentTicket.estimated_wait = result.position.estimated_wait_minutes;
    
    const pos = result.position.position;
    currentPosition.textContent = pos !== undefined ? pos : "--";
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

    // Default tracker steps
    stepJoined.classList.add("active");
    stepWaiting.classList.add("active");
    stepNear.classList.remove("active");
    stepCalled.classList.remove("active");
    proximityAlert.classList.add("hidden");

    if (result.position.status === "called") {
      currentTicketStatus.textContent = "Status: Called (Counter)";
      stepNear.classList.add("active");
      stepCalled.classList.add("active");
      proximityAlert.classList.remove("hidden");
      proximityAlert.querySelector(".alert-text").textContent = "🔔 Your turn! Please proceed to the service counter immediately.";
      showToast("🔔 Ticket " + currentTicket.ticket_number + " is NOW SERVING! Please proceed to counter.", "info");
      playNotificationSound();
    } else if (result.position.status === "waiting") {
      currentTicketStatus.textContent = "Status: Waiting";
      if (pos !== undefined && pos <= 2) {
        stepNear.classList.add("active");
        proximityAlert.classList.remove("hidden");
        proximityAlert.querySelector(".alert-text").textContent = `🔔 Your turn is near! Only ${pos} people ahead of you. Start heading back!`;
        playNotificationSound();
      }
    } else {
      currentTicketStatus.textContent = `Status: ${result.position.status}`;
      if (result.position.status === "served") {
        showToast("You have been served. Thank you!", "success");
        sessionStorage.removeItem("current_ticket");
        currentTicket = null;
        clearInterval(refreshInterval);
        displayCurrentTicket();
      }
    }
  }
}

function startRefreshing() {
  if (refreshInterval) clearInterval(refreshInterval);
  refreshPosition();
  refreshInterval = setInterval(refreshPosition, 10000); // refresh every 10 seconds
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

// Setup click handlers for categories
categoryCards.forEach(card => {
  card.addEventListener("click", () => {
    selectCategory(card.dataset.category);
  });
});

// Initialize dashboard page
async function init() {
  await fetchAndSetupDiscovery();
  displayCurrentTicket();
  loadSuggestions();

  if (currentTicket) {
    startRefreshing();
  }
}

init();
