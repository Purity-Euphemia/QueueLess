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
        
    } else {
        // User is not logged in
        document.getElementById('nav-logout').classList.add('hidden');
        document.getElementById('nav-login').classList.remove('hidden');
        document.getElementById('nav-register').classList.remove('hidden');
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

// Testimonials Carousel Logic
const testimonials = [
    { quote: "\"QueueLess has completely changed the way I handle waiting. I can join the queue and do other things while I wait. Super convenient!\"", author: "— Chioma E." },
    { quote: "\"As a business owner, this app saved me so much time. My customers are happier and walk-aways have dropped by 80%.\"", author: "— David K." },
    { quote: "\"I love being able to see exactly when it's my turn. The wait-time prediction is incredibly accurate!\"", author: "— Sarah T." },
    { quote: "\"No more standing in the cold! I just scan the QR code and wait in my car until they notify me.\"", author: "— Michael R." }
];

let currentTestimonialIndex = 0;

function updateTestimonial() {
    const quoteEl = document.getElementById('testim-quote');
    const authorEl = document.getElementById('testim-author');
    const dotsContainer = document.getElementById('testim-dots');
    
    if (!quoteEl || !authorEl || !dotsContainer) return;

    quoteEl.textContent = testimonials[currentTestimonialIndex].quote;
    authorEl.textContent = testimonials[currentTestimonialIndex].author;
    
    // Update dots
    const dots = dotsContainer.querySelectorAll('svg circle');
    dots.forEach((dot, index) => {
        if (index === currentTestimonialIndex) {
            dot.setAttribute('fill', 'currentColor');
        } else {
            dot.setAttribute('fill', 'var(--border)');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const prevBtn = document.getElementById('testim-prev');
    const nextBtn = document.getElementById('testim-next');
    let autoPlayInterval;
    
    function startAutoPlay() {
        stopAutoPlay();
        autoPlayInterval = setInterval(() => {
            currentTestimonialIndex = (currentTestimonialIndex + 1) % testimonials.length;
            updateTestimonial();
        }, 5000); // 5 seconds
    }
    
    function stopAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentTestimonialIndex = (currentTestimonialIndex - 1 + testimonials.length) % testimonials.length;
            updateTestimonial();
            startAutoPlay(); // Reset timer on manual click
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentTestimonialIndex = (currentTestimonialIndex + 1) % testimonials.length;
            updateTestimonial();
            startAutoPlay(); // Reset timer on manual click
        });
    }
    
    // Start automatically
    startAutoPlay();
});
