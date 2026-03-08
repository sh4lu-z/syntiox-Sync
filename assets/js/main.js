// assets/js/main.js

const socket = io(CONFIG.BACKEND_URL);
let isTiltEnabled = true; // 3D Tilt එක පාලනය කරන Flag එක

// --- 1. ලයිබ්‍රරි එක Initialize කරන කොටස ---
let iti; 
document.addEventListener("DOMContentLoaded", () => {
    const phoneInput = document.querySelector("#phone");
    if (phoneInput) {
        iti = window.intlTelInput(phoneInput, {
            initialCountry: "lk",
            separateDialCode: true,
            dropdownContainer: document.body, 
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js",
        });
    }
});

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
    
    isTiltEnabled = true; // Tab මාරු කරද්දී ආයේ Tilt එක වැඩ කරන්න දෙනවා

    const pairBtn = document.getElementById('pair-btn');
    if (pairBtn) {
        pairBtn.innerHTML = 'GET PAIRING CODE <i class="fa-solid fa-arrow-right"></i>';
        pairBtn.style.background = ""; 
        pairBtn.onclick = validateAndPair; 
    }

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
    isTiltEnabled = true; // වැඩේ පටන් ගද්දි හෙලවෙන්න දෙනවා
    const qrContainer = document.getElementById('qr-container');
    const btn = document.getElementById('qr-btn');
    
    showToast("Connecting to syntiox sync...", "info");
    qrContainer.innerHTML = '<span class="loader"></span><p style="color:#000; font-size:0.8rem; margin-top:10px;">Loading QR...</p>';
    btn.disabled = true;

    socket.emit('start-session', { usePairingCode: false });
}

socket.on('qr', (data) => {
    isTiltEnabled = false; // 🔥 QR එක ආව ගමන් හෙලවෙන එක නවත්තනවා
    const card = document.getElementById('tilt-card');
    if(card) card.style.transform = "none"; // කාඩ් එක flat කරනවා

    const qrContainer = document.getElementById('qr-container');
    qrContainer.innerHTML = ""; 
    new QRCode(qrContainer, { text: data.qr, width: 200, height: 200 });
    showToast("Scan this QR Code via WhatsApp", "success");
});

// --- Pairing Logic ---
function validateAndPair() {
    if (!iti.isValidNumber()) {
        showToast("Invalid phone number for the selected country!", "error");
        return;
    }

    isTiltEnabled = true; // වැඩේ පටන් ගද්දි හෙලවෙන්න දෙනවා
    const fullNumber = iti.getNumber().replace('+', ''); 
    const resBox = document.getElementById('code-result');
    const btn = document.getElementById('pair-btn');

    resBox.style.display = 'block';
    resBox.innerText = "CONNECTING...";
    resBox.style.color = "#fff";
    btn.disabled = true;

    showToast("Requesting Pairing Code...", "info");
    socket.emit('start-session', { usePairingCode: true, phoneNumber: fullNumber });
}

socket.on('pairing-code', (data) => {
    isTiltEnabled = false; // 🔥 Code එක ආව ගමන් හෙලවෙන එක නවත්තනවා
    const card = document.getElementById('tilt-card');
    if(card) card.style.transform = "none"; // කාඩ් එක flat කරනවා

    const resBox = document.getElementById('code-result');
    const btn = document.getElementById('pair-btn');

    resBox.innerText = data.code;
    resBox.style.color = "#4ade80";
    resBox.style.fontSize = "1.5rem";
    resBox.style.fontWeight = "bold";

    btn.disabled = false; 
    btn.innerHTML = 'COPY CODE <i class="fa-solid fa-copy"></i>';
    btn.style.background = "linear-gradient(135deg, #25D366 0%, #128C7E 100%)"; 
    btn.onclick = () => copyCode(data.code);

    showToast("Code Received! Click to Copy.", "success");
});

// --- Copy Function ---
function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('pair-btn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = 'COPIED! <i class="fa-solid fa-check"></i>';
        showToast("Code copied to clipboard!", "success");
        setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
    });
}

socket.on('session-success', (data) => {
    isTiltEnabled = false; // සාර්ථක වුණාම හෙලවීම නවත්වනවා
    document.getElementById('qr-view').style.display = 'none';
    document.getElementById('pair-view').style.display = 'none';
    document.getElementById('success-msg').style.display = 'block';
    
    document.getElementById('qr-btn').disabled = false;
    document.getElementById('pair-btn').disabled = false;
    showToast("Session Connected!", "success");
    
    if(typeof fetchUserData === 'function') {
        fetchUserData(data.sessionId); 
    }
});

socket.on('error', (data) => {
    showToast(data.message || "Server Error", "error");
    document.getElementById('qr-btn').disabled = false;
    document.getElementById('pair-btn').disabled = false;
});

// --- 3D Tilt Effect (අලුත් කරපු කොටස) ---
document.addEventListener('mousemove', (e) => {
    const card = document.getElementById('tilt-card');
    // මෙතන 'isTiltEnabled' එක true නම් විතරක් හෙලවෙනවා
    if(card && isTiltEnabled) { 
        const x = (window.innerWidth / 2 - e.pageX) / 30;
        const y = (window.innerHeight / 2 - e.pageY) / 30;
        card.style.transform = `rotateX(${y}deg) rotateY(${-x}deg)`;
    }
});
