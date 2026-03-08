// assets/js/main.js

const socket = io(CONFIG.BACKEND_URL);

// --- 1. ලයිබ්‍රරි එක Initialize කරන කොටස (ෆයිල් එක මුලටම දාන්න) ---
let iti; 
// assets/js/main.js

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

// --- 2. මෙන්න මෙතන තමයි වැදගත්ම වෙනස (Paring Logic) ---
function validateAndPair() {
    const resBox = document.getElementById('code-result');
    const btn = document.getElementById('pair-btn');

    // නම්බර් එකේ දිග සහ රට නිවැරදිද කියලා බලනවා
    if (!iti.isValidNumber()) {
        showToast("Invalid phone number for the selected country!", "error");
        return;
    }

    // රටේ කෝඩ් එකත් එක්ක සම්පූර්ණ නම්බර් එක ගන්නවා (උදා: 94761234567)
    const fullNumber = iti.getNumber().replace('+', ''); 

    resBox.style.display = 'block';
    resBox.innerText = "CONNECTING...";
    resBox.style.color = "#fff";
    btn.disabled = true;

    showToast("Requesting Pairing Code...", "info");
    
    // සර්වර් එකට Clean කරපු නම්බර් එක යවනවා
    socket.emit('start-session', { usePairingCode: true, phoneNumber: fullNumber });
}

// --- 1. Pairing Code එක ලැබුණම බටන් එක මාරු කරන හැටි ---
socket.on('pairing-code', (data) => {
    const resBox = document.getElementById('code-result');
    const btn = document.getElementById('pair-btn');

    // කෝඩ් එක පෙන්නනවා
    resBox.innerText = data.code;
    resBox.style.color = "#4ade80";
    resBox.style.fontSize = "1.5rem";
    resBox.style.fontWeight = "bold";

    // 🔥 බටන් එක "COPY" බටන් එකක් කරනවා
    btn.disabled = false; // ආයේ බටන් එක වැඩ කරන්න දෙනවා
    btn.innerHTML = 'COPY CODE <i class="fa-solid fa-copy"></i>';
    btn.style.background = "linear-gradient(135deg, #25D366 0%, #128C7E 100%)"; // WhatsApp පාට (Optional)
    
    // බටන් එක එබුවම කරන වැඩේ (Function) මාරු කරනවා
    btn.onclick = () => copyCode(data.code);

    showToast("Code Received! Click to Copy.", "success");
});

// --- 2. කෝඩ් එක කොපි කරන Function එක ---
function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('pair-btn');
        const originalHTML = btn.innerHTML;

        // Feedback එකක් දෙනවා "Copied" කියලා
        btn.innerHTML = 'COPIED! <i class="fa-solid fa-check"></i>';
        showToast("Code copied to clipboard!", "success");

        // තත්පර 2කින් ආයේ තිබ්බ විදිහටම හදනවා
        setTimeout(() => {
            btn.innerHTML = originalHTML;
        }, 2000);
    });
}

socket.on('session-success', (data) => {
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

// --- 3D Tilt Effect ---
document.addEventListener('mousemove', (e) => {
    const card = document.getElementById('tilt-card');
    if(card) {
        const x = (window.innerWidth / 2 - e.pageX) / 30;
        const y = (window.innerHeight / 2 - e.pageY) / 30;
        card.style.transform = `rotateX(${y}deg) rotateY(${-x}deg)`;
    }
});
