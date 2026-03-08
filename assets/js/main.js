// assets/js/main.js

const socket = io(CONFIG.BACKEND_URL);

// --- Toast Notification System ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let icon = 'fa-info-circle';
    if(type === 'success') icon = 'fa-circle-check';
    if(type === 'error') icon = 'fa-circle-exclamation';

    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// --- Tab Switching ---
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

// --- QR Logic ---
function startQR() {
    const qrContainer = document.getElementById('qr-container');
    const btn = document.getElementById('qr-btn');
    
    showToast("Connecting to syntiox sync...", "info");
    qrContainer.innerHTML = '<span class="loader"></span><p style="color:#000; font-size:0.8rem; margin-top:10px;">Loading QR...</p>';
    btn.disabled = true;

    socket.emit('start-session', { usePairingCode: false });
}

socket.on('qr', (data) => {
    const qrContainer = document.getElementById('qr-container');
    qrContainer.innerHTML = ""; 
    new QRCode(qrContainer, { text: data.qr, width: 200, height: 200 });
    showToast("Scan this QR Code via WhatsApp", "success");
});

// --- Pairing Code Logic ---
function startPairing() {
    const phone = document.getElementById('phone').value;
    const resBox = document.getElementById('code-result');
    const btn = document.getElementById('pair-btn');

    if(!phone) {
        showToast("Please enter a phone number!", "error");
        return;
    }

    resBox.style.display = 'block';
    resBox.innerText = "CONNECTING...";
    resBox.style.color = "#fff";
    btn.disabled = true;

    showToast("Requesting Pairing Code...", "info");
    socket.emit('start-session', { usePairingCode: true, phoneNumber: phone });
}

socket.on('pairing-code', (data) => {
    const resBox = document.getElementById('code-result');
    resBox.innerText = data.code;
    resBox.style.color = "#4ade80";
    resBox.style.fontSize = "1.5rem";
    resBox.style.fontWeight = "bold";
    showToast("Code Received!", "success");
});

socket.on('session-success', (data) => {
    document.getElementById('qr-view').style.display = 'none';
    document.getElementById('pair-view').style.display = 'none';
    document.getElementById('success-msg').style.display = 'block';
    
    document.getElementById('qr-btn').disabled = false;
    document.getElementById('pair-btn').disabled = false;
    showToast("Session Connected!", "success");
    
    // session එක හරි ගියාම DB data අදින්න
    if(typeof fetchUserData === 'function') {
        fetchUserData(data.sessionId); 
    }
});

socket.on('error', (data) => {
    showToast(data.message || "Server Error", "error");
    document.getElementById('qr-btn').disabled = false;
    document.getElementById('pair-btn').disabled = false;
});

// --- 3D Tilt Effect ---
document.addEventListener('mousemove', (e) => {
    const card = document.getElementById('tilt-card');
    if(card) {
        const x = (window.innerWidth / 2 - e.pageX) / 30;
        const y = (window.innerHeight / 2 - e.pageY) / 30;
        card.style.transform = `rotateX(${y}deg) rotateY(${-x}deg)`;
    }
});
