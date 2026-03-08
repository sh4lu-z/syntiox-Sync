// assets/js/data-loader.js

async function fetchUserData(sessionId) {
    const statsDiv = document.getElementById('user-stats');
    if(!statsDiv) return;

    statsDiv.style.display = 'block';
    statsDiv.innerHTML = '<i class="fa-solid fa-database"></i> Syncing with MongoDB...';

    try {
        // Backend එකේ API එකට call කරනවා
        const response = await fetch(`${CONFIG.API_URL}/get-user-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.APP_VERSION}`
            },
            body: JSON.stringify({ session: sessionId })
        });

        const data = await response.json();

        if (data.success) {
            statsDiv.innerHTML = `
                <div style="margin-top:10px; padding:10px; background:rgba(255,255,255,0.05); border-radius:10px;">
                    <div style="color:#4ade80"><i class="fa-solid fa-check"></i> Data Synced</div>
                    <div>User: ${data.user_name || 'Unknown'}</div>
                    <div>Status: Active</div>
                </div>
            `;
        } else {
            statsDiv.innerHTML = '<span style="color:#f87171">DB Sync Failed</span>';
        }

    } catch (error) {
        console.error("MongoDB Fetch Error:", error);
        statsDiv.innerHTML = '<span style="color:#f87171">Connection Error</span>';
    }
}
