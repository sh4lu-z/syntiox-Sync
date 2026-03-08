// dev/dev-script.js

const terminal = document.getElementById('console-output');

function log(msg, color = '#0f0') {
    terminal.innerHTML += `<div style="color:${color}">> ${msg}</div>`;
    terminal.scrollTop = terminal.scrollHeight;
}

function checkServerStatus() {
    log("Pinging " + CONFIG.BACKEND_URL + "...", "#fbbf24");
    fetch(CONFIG.BACKEND_URL)
        .then(res => {
            if(res.ok) log("Server is ONLINE (200 OK)", "#4ade80");
            else log("Server Error: " + res.status, "#f87171");
        })
        .catch(err => log("Connection Failed!", "#f87171"));
}

function clearLocalData() {
    localStorage.clear();
    sessionStorage.clear();
    log("Local Cache Cleared.", "#60a5fa");
}

function testDB() {
    log("Testing MongoDB Connection...", "#fbbf24");
    // Simulating a check
    setTimeout(() => {
        if(CONFIG.API_URL) log("API Endpoint Configured.", "#4ade80");
        else log("API Config Missing!", "#f87171");
    }, 1000);
}
