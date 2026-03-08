const { MongoClient } = require('mongodb');

async function connectToDatabase() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('test'); // ඔයාගේ DB නම හරියටම බලලා දාන්න
    return { client, db };
}

module.exports = async (req, res) => {
    // 1. CORS සහ Headers
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

        // 2. MongoDB එකෙන් Data ගන්නවා
        const session = await db.collection('sessions').findOne({
            sessionId: sessionId,
            phoneNumber: phoneNumber
        });

        if (!session) {
            return res.status(404).json({ success: false, message: "No matching session found" });
        }

        // ============================================================
        // 🔥 මෙන්න ඔයා ඉල්ලපු FIX එක (Data Merging) 🔥
        // ============================================================
        
        // මෙතනදී අපි 'creds' ඇතුලේ තියෙන ඒවයි, එළියේ තියෙන 'me', 'platform' වගේ ඒවයි 
        // ඔක්කොම එකතු කරලා තනි object එකක් හදනවා.
        
        const completeCreds = {
            // 1. මුලින්ම creds ඇතුලේ තියෙන Keys (noiseKey, signedPreKey...) එළියට ගන්නවා
            ...session.creds,
            
            // 2. දැන් ඔයා කිව්ව අඩුපාඩු ටික (Identity & Platform info) එකතු කරනවා
            me: session.me,
            signalIdentities: session.signalIdentities,
            platform: session.platform,
            routingInfo: session.routingInfo,
            lastAccountSyncTimestamp: session.lastAccountSyncTimestamp,
            myAppStateKeyId: session.myAppStateKeyId,
            
            // අවශ්‍ය නම් තව මේවාත් දාගන්න පුළුවන් (DB එකේ තියෙනවා නම්)
            account: session.account
        };

        // 3. දැන් යවන්නේ සම්පූර්ණ ෆයිල් එක
        return res.status(200).json(completeCreds);

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
