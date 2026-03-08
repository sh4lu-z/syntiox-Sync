const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }
    // Vercel Environment Variable එකෙන් URL එක ගන්නවා
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('test'); // Screenshot එකේ විදිහට DB Name එක 'test'
    cachedClient = client;
    cachedDb = db;
    return { client, db };
}

module.exports = async (req, res) => {
    // CORS Headers (ඕනම තැනක ඉඳන් Access කරන්න පුළුවන් වෙන්න)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    try {
        const { sessionId, phoneNumber } = req.body;

        if (!sessionId || !phoneNumber) {
            return res.status(400).json({ error: 'Missing sessionId or phoneNumber' });
        }

        const { db } = await connectToDatabase();

        // MongoDB එකේ 'sessions' table එකෙන් data හොයනවා
        const session = await db.collection('sessions').findOne({
            sessionId: sessionId,
            phoneNumber: phoneNumber
        });

        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found!" });
        }

        // සම්පූර්ණ JSON එකම රිටන් කරනවා
        return res.status(200).json(session);

    } catch (error) {
        console.error("DB Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
