requireAuth();

const user = getUser();
const historyList = document.getElementById("history-list");
const toastContainer = document.getElementById("toast-container");
const logoutLink = document.getElementById("logout-link");

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

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

function calculateDuration(joinedAt, leftAt, servedAt) {
  const start = new Date(joinedAt);
  const end = new Date(leftAt || servedAt);
  const durationMs = end - start;
  const durationMinutes = Math.round(durationMs / 60000);
  return `${durationMinutes} min`;
}

async function loadHistory() {
  // For now, load all queues and show participation history
  // In a full implementation, this would come from a /user/history endpoint
  
  const result = await getAllQueues();
  if (!result.success) {
    showToast("Could not load history.", "error");
    return;
  }

  const allTickets = [];

  // Load history for each queue
  for (const queue of result.queues) {
    const historyResult = await getQueueHistory(queue.id);
    if (historyResult.success) {
      allTickets.push(...historyResult.tickets.map(t => ({
        ...t,
        queue_name: queue.name,
        queue_service: queue.service
      })));
    }
  }

  // Filter for user's tickets and sort by date
  const userTickets = allTickets
    .filter(t => t.status === 'served' || t.status === 'left' || t.status === 'skipped')
    .sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at));

  if (userTickets.length === 0) {
    historyList.innerHTML = `
      <p class="empty-message">No queue history yet. Join a queue to get started!</p>
    `;
    return;
  }

  historyList.innerHTML = "";
  userTickets.forEach((ticket) => {
    const card = document.createElement("div");
    card.className = `history-card history-${ticket.status}`;

    const duration = ticket.status === 'served' 
      ? calculateDuration(ticket.joined_at, ticket.served_at, ticket.served_at)
      : 'N/A';

    card.innerHTML = `
      <div class="history-header">
        <h4>${ticket.queue_name}</h4>
        <span class="badge badge-${ticket.status}">${ticket.status}</span>
      </div>
      <div class="history-details">
        <p><strong>Ticket:</strong> ${ticket.ticket_number}</p>
        <p><strong>Joined:</strong> ${formatDate(ticket.joined_at)}</p>
        <p><strong>Duration:</strong> ${duration}</p>
      </div>
    `;
    historyList.appendChild(card);
  });
}

loadHistory();
