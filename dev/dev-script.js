async function fetchSessionData() {
    const phone = document.getElementById('dev-phone').value;
    const session = document.getElementById('dev-session').value;
    const output = document.getElementById('output');

    if(!phone || !session) {
        output.innerHTML = "<span style='color:#f87171'>Error: Phone and Session ID required!</span>";
        return;
    }

    output.innerHTML = "Fetching from MongoDB...";

    try {
        // මේ තියෙන්නේ API Call එක
        const res = await fetch(`${CONFIG.API_BASE}/api/get-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: session, phoneNumber: phone })
        });

        const data = await res.json();
        
        // ලස්සනට JSON එක පෙන්නනවා
        output.innerHTML = JSON.stringify(data, null, 4);

    } catch (err) {
        output.innerHTML = "<span style='color:#f87171'>API Error: " + err.message + "</span>";
    }
}
