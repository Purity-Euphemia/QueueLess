// Backend address

const API_URL =
    "http://127.0.0.1:5000";


// Get HTML elements

const joinForm =
    document.getElementById(
        "join-form"
    );


const nameInput =
    document.getElementById(
        "name"
    );


const queueSelect =
    document.getElementById(
        "queue"
    );


const resultSection =
    document.getElementById(
        "result"
    );


const welcomeMessage =
    document.getElementById(
        "welcome-message"
    );


const position =
    document.getElementById(
        "position"
    );


const peopleAhead =
    document.getElementById(
        "people-ahead"
    );


const errorMessage =
    document.getElementById(
        "error-message"
    );


// Load queues when the page opens

async function loadQueues() {

    try {

        const response =
            await fetch(
                `${API_URL}/queues`
            );


        const data =
            await response.json();


        // Remove loading option

        queueSelect.innerHTML =
            `
            <option value="">
                Select a queue
            </option>
            `;


        // Add every queue

        data.queues.forEach(
            function (queue) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    queue.id;


                option.textContent =
                    queue.name;


                queueSelect.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        queueSelect.innerHTML =
            `
            <option>
                Could not load queues
            </option>
            `;


        showError(
            "The backend is not running."
        );

    }

}


// Join queue

joinForm.addEventListener(
    "submit",

    async function (event) {

        // Stop page refresh

        event.preventDefault();


        // Clear old errors

        errorMessage.textContent =
            "";


        // Get user information

        const name =
            nameInput.value.trim();


        const queueId =
            queueSelect.value;


        // Send information to backend

        try {

            const response =
                await fetch(

                    `${API_URL}/queues/${queueId}/join`,

                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                name: name

                            })

                    }

                );


            const data =
                await response.json();


            // Check for backend error

            if (!response.ok) {

                showError(
                    data.error
                );

                return;

            }


            // Display result

            showQueueResult(
                data,
                name
            );


        } catch (error) {

            showError(
                "Could not connect to the backend."
            );

        }

    }

);


// Show successful result

function showQueueResult(
    data,
    name
) {

    welcomeMessage.textContent =
        `Welcome, ${name}!`;


    position.textContent =
        data.position;


    peopleAhead.textContent =
        data.people_ahead;


    resultSection.classList.remove(
        "hidden"
    );


    // Move to result

    resultSection.scrollIntoView({

        behavior: "smooth"

    });

}


// Show error

function showError(
    message
) {

    errorMessage.textContent =
        message;

}


// Start application

loadQueues();