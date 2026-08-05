const API_URL =
    "http://127.0.0.1:5000";


const createQueueForm =
    document.getElementById(
        "create-queue-form"
    );


const queueNameInput =
    document.getElementById(
        "queue-name"
    );


const queueSelect =
    document.getElementById(
        "admin-queue-select"
    );


const refreshButton =
    document.getElementById(
        "refresh-button"
    );


const callNextButton =
    document.getElementById(
        "call-next-button"
    );


const dashboard =
    document.getElementById(
        "queue-dashboard"
    );


const selectedQueueName =
    document.getElementById(
        "selected-queue-name"
    );


const queueSummary =
    document.getElementById(
        "queue-summary"
    );


const membersList =
    document.getElementById(
        "members-list"
    );


const adminMessage =
    document.getElementById(
        "admin-message"
    );


// Load all queues

async function loadQueues() {

    try {

        const response =
            await fetch(
                `${API_URL}/queues`
            );


        const data =
            await response.json();


        queueSelect.innerHTML =
            `
            <option value="">
                Select a queue
            </option>
            `;


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

        showMessage(
            "Could not connect to the backend.",
            true
        );

    }

}


// Create a queue

createQueueForm.addEventListener(
    "submit",

    async function (event) {

        event.preventDefault();


        const name =
            queueNameInput.value.trim();


        try {

            const response =
                await fetch(

                    `${API_URL}/queues`,

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


            if (!response.ok) {

                showMessage(
                    data.error ||
                    "Could not create queue.",
                    true
                );

                return;

            }


            queueNameInput.value =
                "";


            showMessage(
                "Queue created successfully."
            );


            await loadQueues();


            queueSelect.value =
                data.queue.id;


            loadSelectedQueue();

        } catch (error) {

            showMessage(
                "Could not connect to the backend.",
                true
            );

        }

    }

);


// Load selected queue

queueSelect.addEventListener(
    "change",
    loadSelectedQueue
);


async function loadSelectedQueue() {

    const queueId =
        queueSelect.value;


    if (!queueId) {

        dashboard.classList.add(
            "hidden"
        );

        return;

    }


    try {

        const response =
            await fetch(

                `${API_URL}/queues/${queueId}`

            );


        const data =
            await response.json();


        if (!response.ok) {

            showMessage(
                data.error ||
                "Could not load queue.",
                true
            );

            return;

        }


        dashboard.classList.remove(
            "hidden"
        );


        selectedQueueName.textContent =
            data.queue.name;


        queueSummary.textContent =
            `${data.total_waiting} person(s) waiting`;


        displayMembers(
            data.members
        );

    } catch (error) {

        showMessage(
            "Could not connect to the backend.",
            true
        );

    }

}


// Display queue members

function displayMembers(
    members
) {

    membersList.innerHTML =
        "";


    if (members.length === 0) {

        membersList.innerHTML =
            `
            <p class="empty-message">
                Nobody is waiting in this queue.
            </p>
            `;

        return;

    }


    members.forEach(
        function (member) {

            const memberCard =
                document.createElement(
                    "div"
                );


            memberCard.className =
                "member-card";


            memberCard.innerHTML =
                `
                <div>

                    <strong>
                        #${member.position}
                    </strong>

                    <span>
                        ${member.name}
                    </span>

                </div>

                <span class="member-status">

                    ${member.status}

                </span>
                `;


            membersList.appendChild(
                memberCard
            );

        }
    );

}


// Refresh button

refreshButton.addEventListener(
    "click",
    loadSelectedQueue
);


// Call next person

callNextButton.addEventListener(
    "click",

    async function () {

        const queueId =
            queueSelect.value;


        if (!queueId) {

            showMessage(
                "Select a queue first.",
                true
            );

            return;

        }


        try {

            const response =
                await fetch(

                    `${API_URL}/admin/queues/${queueId}/next`,

                    {

                        method: "POST"

                    }

                );


            const data =
                await response.json();


            if (!response.ok) {

                showMessage(
                    data.error ||
                    "Nobody is waiting.",
                    true
                );

                return;

            }


            showMessage(
                data.message
            );


            loadSelectedQueue();

        } catch (error) {

            showMessage(
                "Could not connect to the backend.",
                true
            );

        }

    }

);


// Display message

function showMessage(
    message,
    isError = false
) {

    adminMessage.textContent =
        message;


    if (isError) {

        adminMessage.classList.add(
            "error-text"
        );

    } else {

        adminMessage.classList.remove(
            "error-text"
        );

    }

}


// Start dashboard

loadQueues();


// Refresh queue every 5 seconds

setInterval(
    function () {

        if (queueSelect.value) {

            loadSelectedQueue();

        }

    },

    5000
);