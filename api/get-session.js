const { MongoClient } = require('mongodb');

async function connectToDatabase() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('test'); // DB නම 'test'
    return { client, db };
}

module.exports = async (req, res) => {
    // 1. CORS Headers (ඕනම තැනක ඉඳන් ගන්න පුළුවන් වෙන්න)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Use POST method' });
    }

    try {
        const { sessionId, phoneNumber } = req.body;

        if (!sessionId || !phoneNumber) {
            return res.status(400).json({ error: 'Missing sessionId or phoneNumber' });
        }

        const { db } = await connectToDatabase();

        // 2. MongoDB එකෙන් අදාළ Session එක ගන්නවා
        const session = await db.collection('sessions').findOne({
            sessionId: sessionId,
            phoneNumber: phoneNumber
        });

        if (!session) {
            return res.status(404).json({ success: false, message: "No matching session found" });
        }

        // ============================================================
        // 🔥 CORRECT LOGIC  🔥
        // ============================================================
        
        // Database Screenshot එකේ හැටියට 'me', 'platform', 'account'
        // ඔක්කොම තියෙන්නේ 'creds' ඇතුලේ. ඒ නිසා 'creds' විතරක් යැව්වම ඇති.
        // එතකොට හරියටම 1creds.json එක වගේම ෆයිල් එකක් ලැබෙනවා.
        
        return res.status(200).json(session.creds);

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
