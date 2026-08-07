// Home page logic - handles auth-aware navigation and content display

document.addEventListener('DOMContentLoaded', async () => {
    const token = getToken();
    const user = getUser();
    
    // Update navigation based on auth state
    if (token && user) {
        // User is logged in
        document.getElementById('nav-login').classList.add('hidden');
        document.getElementById('nav-register').classList.add('hidden');
        document.getElementById('nav-logout').classList.remove('hidden');
        document.getElementById('nav-dashboard').classList.remove('hidden');
        document.getElementById('nav-history').classList.remove('hidden');
        document.getElementById('nav-profile').classList.remove('hidden');
        
        // Show admin link if user is admin
        if (user.role === 'admin') {
            document.getElementById('nav-admin').classList.remove('hidden');
        }
        
        // Show welcome section, hide hero
        document.getElementById('hero-section').classList.add('hidden');
        document.getElementById('welcome-section').classList.remove('hidden');
        
        // Load user data
        await loadUserData(user);
    } else {
        // User is not logged in
        document.getElementById('nav-logout').classList.add('hidden');
        document.getElementById('nav-dashboard').classList.add('hidden');
        document.getElementById('nav-history').classList.add('hidden');
        document.getElementById('nav-profile').classList.add('hidden');
        document.getElementById('nav-admin').classList.add('hidden');
        document.getElementById('nav-login').classList.remove('hidden');
        document.getElementById('nav-register').classList.remove('hidden');
        
        // Show hero section
        document.getElementById('hero-section').classList.remove('hidden');
        document.getElementById('welcome-section').classList.add('hidden');
    }
    
    // Setup logout button
    document.getElementById('nav-logout').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
        window.location.href = 'login.html';
    });

    // Load live now serving board
    await loadNowServingGrid();
    setInterval(loadNowServingGrid, 10000);
});

async function loadNowServingGrid() {
    const grid = document.getElementById('now-serving-grid');
    if (!grid) return;

    try {
        const result = await getAllQueues();
        if (result.success && result.queues && result.queues.length > 0) {
            grid.innerHTML = '';
            result.queues.forEach(queue => {
                const card = document.createElement('div');
                card.className = 'now-serving-card';
                card.innerHTML = `
                    <div class="now-serving-header">
                        <span class="queue-name">${queue.name}</span>
                        <span class="badge badge-${queue.status}">${queue.status}</span>
                    </div>
                    <p class="service-type">${queue.service || 'General Service'}</p>
                    <div class="serving-number-box">
                        <span class="serving-label">CURRENTLY SERVING</span>
                        <span class="serving-value">${queue.now_serving || 'None'}</span>
                    </div>
                `;
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = '<p class="empty-message">No active queues available right now.</p>';
        }
    } catch (error) {
        console.error('Error loading now serving grid:', error);
        grid.innerHTML = '<p class="empty-message">Could not load live status.</p>';
    }
}

/**
 * Load user stats and display in welcome section
 */
async function loadUserData(user) {
    try {
        // Update user name
        document.getElementById('user-name').textContent = user.name.split(' ')[0];
        
        // Check for active ticket
        const queues = await getAllQueues();
        let activeTicket = null;
        let completedTickets = 0;
        
        if (queues && queues.length > 0) {
            for (const queue of queues) {
                try {
                    // Get queue status to find our ticket
                    const statusResponse = await apiCall(`/queues/${queue.id}/status`, 'GET');
                    if (statusResponse && statusResponse.members) {
                        // Look for our waiting ticket
                        const ourTicket = statusResponse.members.find(m => m.user_id === user.id && m.status === 'waiting');
                        if (ourTicket) {
                            activeTicket = {
                                queue: queue.name,
                                position: ourTicket.position,
                                ticketNumber: ourTicket.ticket_number
                            };
                            break;
                        }
                    }
                    
                    // Get history to count completed tickets
                    const historyResponse = await apiCall(`/queues/${queue.id}/history`, 'GET');
                    if (historyResponse && historyResponse.tickets) {
                        const ourCompletedTickets = historyResponse.tickets.filter(t => 
                            t.user_id === user.id && (t.status === 'served' || t.status === 'left')
                        ).length;
                        completedTickets += ourCompletedTickets;
                    }
                } catch (error) {
                    // Continue if queue lookup fails
                    console.error(`Error checking queue ${queue.id}:`, error);
                }
            }
        }
        
        if (activeTicket) {
            document.getElementById('active-ticket-status').textContent = 
                `#${activeTicket.ticketNumber} (Position ${activeTicket.position})`;
        } else {
            document.getElementById('active-ticket-status').textContent = 'None';
        }
        
        document.getElementById('total-visits').textContent = completedTickets;
        
    } catch (error) {
        console.error('Error loading user data:', error);
        // Continue without loading full data
        document.getElementById('total-visits').textContent = '0';
        document.getElementById('active-ticket-status').textContent = 'None';
    }
}

