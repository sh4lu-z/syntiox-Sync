const socket = io(CONFIG.BACKEND_URL);

function switchTab(t) {
    document.querySelectorAll('.t-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    if(t === 'qr') {
        document.querySelectorAll('.t-btn')[0].classList.add('active');
        document.getElementById('qr-view').classList.add('active');
    } else {
        document.querySelectorAll('.t-btn')[1].classList.add('active');
        document.getElementById('pair-view').classList.add('active');
    }
}

function startQR() {
    const box = document.getElementById('qr-container');
    box.innerHTML = "Loading...";
    socket.emit('start-session', { usePairingCode: false });
}

socket.on('qr', (data) => {
    document.getElementById('qr-container').innerHTML = "";
    new QRCode(document.getElementById('qr-container'), { text: data.qr, width: 200, height: 200 });
});

function startPairing() {
    const phone = document.getElementById('phone').value;
    if(!phone) return alert("Enter Phone Number");
    socket.emit('start-session', { usePairingCode: true, phoneNumber: phone });
}

socket.on('pairing-code', (data) => {
    document.getElementById('code-result').innerText = data.code;
});

// Session Connected වුනාම
socket.on('session-success', (data) => {
    alert("Connected! Session ID: " + data.sessionId);
    // මෙතනින් තමයි යූසර්ගේ session එක හැදුන බව දැනගන්නේ
});
