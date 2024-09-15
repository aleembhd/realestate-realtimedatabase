// Add Firebase configuration at the top of the file
const firebaseConfig = {
    apiKey: "AIzaSyADbdw5KtrmjQT_5EBJ6kNzExx8kkTEkuc",
    authDomain: "realestate-694f3.firebaseapp.com",
    databaseURL: "https://realestate-694f3-default-rtdb.firebaseio.com",
    projectId: "realestate-694f3",
    storageBucket: "realestate-694f3.appspot.com",
    messagingSenderId: "966861149434",
    appId: "1:966861149434:web:8a57876a91c80bcf216543",
    measurementId: "G-J68SDN99DV"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let callData = {
    details: []
};

// Update dashboard with data from Firebase
function updateDashboard() {
    database.ref('calls').orderByChild('timestamp').once('value').then((snapshot) => {
        const data = snapshot.val();
        if (data) {
            callData.details = Object.values(data);
            // Sort calls by timestamp in descending order
            callData.details.sort((a, b) => b.timestamp - a.timestamp);
            updateDashboardUI(callData);
            updateSummaryNumbers();
        }
    });
}

function updateDashboardUI(data) {
    document.getElementById('totalCallsSummary').textContent = data.details.length.toLocaleString();
    document.getElementById('interestedCallsSummary').textContent = data.details.filter(call => call.status === 'Interested').length.toLocaleString();
    document.getElementById('notInterestedCallsSummary').textContent = data.details.filter(call => call.status === 'Not Interested').length.toLocaleString();
    document.getElementById('unansweredCallsSummary').textContent = data.details.filter(call => call.status === 'Unanswered').length.toLocaleString();
    document.getElementById('callBackCallsSummary').textContent = data.details.filter(call => call.status === 'Callback').length.toLocaleString();

    const callDetailsBody = document.getElementById('callDetailsBody');
    callDetailsBody.innerHTML = '';
    
    // Sort calls by dateTime in descending order
    data.details.sort((a, b) => {
        const dateTimeA = new Date(a.dateTime.split(' ')[0].split('/').reverse().join('-') + 'T' + a.dateTime.split(' ')[1]);
        const dateTimeB = new Date(b.dateTime.split(' ')[0].split('/').reverse().join('-') + 'T' + b.dateTime.split(' ')[1]);
        return dateTimeB - dateTimeA;
    });

    data.details.forEach(call => {
        const row = document.createElement('tr');
        const [date, time] = call.dateTime.split(' ');
        const statusClass = getStatusClass(call.status);
        row.innerHTML = `
            <td>${call.number}</td>
            <td><span class="status-badge ${statusClass}">${call.status}</span></td>
            <td>${call.duration || 'N/A'}</td>
            <td>${date}</td>
            <td>${formatTime(time)}</td>
        `;
        callDetailsBody.appendChild(row);
    });
}

function getStatusClass(status) {
    switch (status) {
        case 'Interested':
            return 'status-interested';
        case 'Not Interested':
            return 'status-not-interested';
        case 'Unanswered':
            return 'status-unanswered';
        case 'Callback':
            return 'status-callback';
        default:
            return '';
    }
}

// Function to add a new call to the dashboard
function addCallToDashboard(call) {
    // Ensure the dateTime is in the correct format
    if (!call.dateTime) {
        const now = new Date();
        call.dateTime = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    }
    
    // Add a timestamp for sorting
    call.timestamp = firebase.database.ServerValue.TIMESTAMP;
    
    // Check and clear previous week's data if necessary
    checkAndClearPreviousWeekData();
    
    // Add the new call to Firebase
    const newCallRef = database.ref('calls').push();
    newCallRef.set(call)
        .then(() => {
            console.log('New call added successfully');
            updateDashboard();
        })
        .catch((error) => {
            console.error('Error adding new call:', error);
        });
}

// Function to update summary numbers
function updateSummaryNumbers() {
    const calls = callData.details || [];
    
    document.getElementById('totalCallsSummary').textContent = calls.length;
    document.getElementById('notInterestedCallsSummary').textContent = calls.filter(call => call.status === 'Not Interested').length;
    document.getElementById('unansweredCallsSummary').textContent = calls.filter(call => call.status === 'Unanswered').length;
    document.getElementById('callBackCallsSummary').textContent = calls.filter(call => call.status === 'Callback').length;
    document.getElementById('interestedCallsSummary').textContent = calls.filter(call => call.status === 'Interested').length;
}

// Load existing calls from Firebase
function loadExistingCalls() {
    updateDashboard();
}

// Clear all data from Firebase
function clearAllData() {
    database.ref('calls').remove()
        .then(() => {
            console.log('All data has been cleared from Firebase');
            updateDashboard();
        })
        .catch((error) => {
            console.error('Error clearing data:', error);
        });
}

// Listen for messages from the dialpad
window.addEventListener('message', function(event) {
    console.log('Received message:', event.data);
    if (event.data.type === 'newCall') {
        console.log('Received new call:', event.data.call);
        updateDashboard(); // This will fetch the latest data from Firebase
    }
});

// Function to open dialpad
function openDialpad() {
    window.open('dialpad.html', 'dialpad', 'width=300,height=400');
}

// Function to open Today's dashboard
function openTodayDashboard() {
    const todayCallsWindow = window.open('today_calls.html', 'TodayCalls', 'width=1000,height=600');
    
    todayCallsWindow.addEventListener('load', function() {
        const calls = callData.details || [];
        console.log('Sending today calls data:', calls);
        todayCallsWindow.postMessage({ type: 'todayCallsData', calls: calls }, '*');
    });
}

// Function to open Weekly Report
function openWeeklyReport() {
    window.open('weekly_report.html', 'WeeklyReport', 'width=1000,height=600');
}

// Function to open Calls Tab
function openCallsTab(status) {
    const filteredCalls = callData.details.filter(call => call.status === status);
    
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
        <html>
            <head>
                <title>${status} Calls</title>
                <link rel="stylesheet" href="style.css">
            </head>
            <body>
                <div class="container">
                    <h1>${status} Calls</h1>
                    <table class="call-details-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Contact</th>
                                <th>Notes</th>
                                <th>Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredCalls.map(call => `
                                <tr>
                                    <td>${call.dateTime}</td>
                                    <td>${call.number}</td>
                                    <td>${call.notes}</td>
                                    <td>${call.duration}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </body>
        </html>
    `);
    newWindow.document.close();
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadExistingCalls();

    // Event listeners for buttons
    document.getElementById('todayBtn').addEventListener('click', openTodayDashboard);
    document.getElementById('weekReportBtn').addEventListener('click', openWeeklyReport);
    document.getElementById('settingsBtn').addEventListener('click', function() {
        alert('Settings clicked');
    });

    // Add this code for the dialpad trigger
    const dialpadTrigger = document.getElementById('dialpadTrigger');
    if (dialpadTrigger) {
        dialpadTrigger.addEventListener('click', openDialpad);
    } else {
        console.error("Dialpad trigger button not found");
    }

    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', showClearDataConfirmation);
    } else {
        console.error("Clear Data button not found");
    }

    // Add event listeners for summary cards
    const notInterestedCard = document.querySelector('.summary-card.notinterestedcard');
    if (notInterestedCard) {
        notInterestedCard.addEventListener('click', () => openCallsTab('Not Interested'));
    }

    const unansweredCard = document.querySelector('.summary-card.unanswredcalls');
    if (unansweredCard) {
        unansweredCard.addEventListener('click', () => openCallsTab('Unanswered'));
    }

    const callBackCard = document.querySelector('.summary-card.callbackcard');
    if (callBackCard) {
        callBackCard.addEventListener('click', () => openCallsTab('Callback'));
    }

    const interestedCard = document.querySelector('.summary-card.interestedcard');
    if (interestedCard) {
        interestedCard.addEventListener('click', () => openCallsTab('Interested'));
    }
});

// Function to show clear data confirmation
function showClearDataConfirmation() {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
        clearAllData();
    }
}

// ... (keep any other existing functions like openTodayDashboard, openWeeklyReport, openCallsTab, etc.)

// Listen for messages from the dialpad window
window.addEventListener('message', function(event) {
    if (event.data.type === 'newCall') {
        const call = event.data.call;
        // Update your dashboard with the new call data
        updateDashboardWithCall(call);
    }
});

function updateDashboardWithCall(call) {
    // Here, make sure you're using the correct duration from the call object
    // For example:
    const callRow = document.createElement('tr');
    callRow.innerHTML = `
        <td>${call.dateTime}</td>
        <td>${call.number}</td>
        <td>${call.status}</td>
        <td>${call.duration}</td>
        <td>${call.notes}</td>
    `;
    document.querySelector('#callsTable tbody').appendChild(callRow);
}
document.addEventListener('DOMContentLoaded', function() {
    const todayBtn = document.getElementById('todayBtn');
    let todayCallsWindow = null;

    todayBtn.addEventListener('click', function() {
        const calls = callData.details || [];
        if (todayCallsWindow && !todayCallsWindow.closed) {
            todayCallsWindow.focus();
            todayCallsWindow.postMessage({ type: 'fetchTodayCalls', calls: calls }, '*');
        } else {
            todayCallsWindow = window.open('today_calls.html', 'TodayCalls', 'width=1000,height=600');
            todayCallsWindow.addEventListener('load', function() {
                todayCallsWindow.postMessage({ type: 'fetchTodayCalls', calls: calls }, '*');
            });
        }
    });
});

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = (hour % 12 || 12).toString();
    return `${formattedHour}:${minutes.slice(0, 2)}${ampm}`;
}

// Add this function to your script.js file
function printCallDetails() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Call Details Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                h1 {
                    text-align: center;
                }
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
                @page {
                    size: A4 landscape;
                    margin: 1cm;
                }
            </style>
        </head>
        <body>
            <h1>Call Details Report</h1>
            <table>
                <thead>
                    <tr>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Date</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${Array.from(document.querySelectorAll('#callDetailsBody tr')).map(row => row.outerHTML).join('')}
                </tbody>
            </table>
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    };
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Modify your existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    loadExistingCalls();

    // Event listeners for buttons
    document.getElementById('todayBtn').addEventListener('click', openTodayDashboard);
    document.getElementById('weekReportBtn').addEventListener('click', openWeeklyReport);
    document.getElementById('settingsBtn').addEventListener('click', function() {
        alert('Settings clicked');
    });

    // Add this code for the dialpad trigger
    const dialpadTrigger = document.getElementById('dialpadTrigger');
    if (dialpadTrigger) {
        dialpadTrigger.addEventListener('click', openDialpad);
    } else {
        console.error("Dialpad trigger button not found");
    }

    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', showClearDataConfirmation);
    } else {
        console.error("Clear Data button not found");
    }

    // Add event listeners for summary cards
    const notInterestedCard = document.querySelector('.summary-card.notinterestedcard');
    if (notInterestedCard) {
        notInterestedCard.addEventListener('click', () => openCallsTab('Not Interested'));
    }

    const unansweredCard = document.querySelector('.summary-card.unanswredcalls');
    if (unansweredCard) {
        unansweredCard.addEventListener('click', () => openCallsTab('Unanswered'));
    }

    const callBackCard = document.querySelector('.summary-card.callbackcard');
    if (callBackCard) {
        callBackCard.addEventListener('click', () => openCallsTab('Callback'));
    }

    const interestedCard = document.querySelector('.summary-card.interestedcard');
    if (interestedCard) {
        interestedCard.addEventListener('click', () => openCallsTab('Interested'));
    }

    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printCallDetails);
    } else {
        console.error("Print button not found");
    }
});

// Function to show clear data confirmation
function showClearDataConfirmation() {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
        clearAllData();
    }
}

// ... (keep any other existing functions like openTodayDashboard, openWeeklyReport, openCallsTab, etc.)

// Listen for messages from the dialpad window
window.addEventListener('message', function(event) {
    if (event.data.type === 'newCall') {
        const call = event.data.call;
        // Update your dashboard with the new call data
        updateDashboardWithCall(call);
    }
});

function updateDashboardWithCall(call) {
    // Here, make sure you're using the correct duration from the call object
    // For example:
    const callRow = document.createElement('tr');
    callRow.innerHTML = `
        <td>${call.dateTime}</td>
        <td>${call.number}</td>
        <td>${call.status}</td>
        <td>${call.duration}</td>
        <td>${call.notes}</td>
    `;
    document.querySelector('#callsTable tbody').appendChild(callRow);
}
document.addEventListener('DOMContentLoaded', function() {
    const todayBtn = document.getElementById('todayBtn');
    let todayCallsWindow = null;

    todayBtn.addEventListener('click', function() {
        const calls = callData.details || [];
        if (todayCallsWindow && !todayCallsWindow.closed) {
            todayCallsWindow.focus();
            todayCallsWindow.postMessage({ type: 'fetchTodayCalls', calls: calls }, '*');
        } else {
            todayCallsWindow = window.open('today_calls.html', 'TodayCalls', 'width=1000,height=600');
            todayCallsWindow.addEventListener('load', function() {
                todayCallsWindow.postMessage({ type: 'fetchTodayCalls', calls: calls }, '*');
            });
        }
    });
});

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = (hour % 12 || 12).toString();
    return `${formattedHour}:${minutes.slice(0, 2)}${ampm}`;
}

// Add this function to your script.js file
function checkAndClearPreviousWeekData() {
    const lastCheckedDate = localStorage.getItem('lastWeeklyReportCheck');
    const now = new Date();
    const today = now.toDateString();

    if (lastCheckedDate !== today) {
        if (now.getDay() === 0) { // If it's Sunday (start of the week)
            clearPreviousWeekData();
        }
        localStorage.setItem('lastWeeklyReportCheck', today);
    }
}

// Add the clearPreviousWeekData function
function clearPreviousWeekData() {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    database.ref('calls').once('value').then((snapshot) => {
        const allCalls = snapshot.val() || {};
        const updatedCalls = {};

        Object.entries(allCalls).forEach(([key, call]) => {
            const callDate = new Date(call.dateTime.split(' ')[0].split('/').reverse().join('-'));
            if (callDate >= startOfWeek) {
                updatedCalls[key] = call;
            }
        });

        database.ref('calls').set(updatedCalls);
    });
}