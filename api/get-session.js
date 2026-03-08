const { MongoClient } = require('mongodb');

async function connectToDatabase() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    // Screenshot එකේ විදිහට උඹේ database නම 'test'
    const db = client.db('test'); 
    return { client, db };
}

module.exports = async (req, res) => {
    // 1. CORS සහ Headers (JSON ෆයිල් එකක් විදිහට යවන්න හදන්නේ)
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

        // 2. Database එකෙන් අදාළ Session එක හොයනවා
        const session = await db.collection('sessions').findOne({
            sessionId: sessionId,
            phoneNumber: phoneNumber
        });

        if (!session) {
            return res.status(404).json({ success: false, message: "No matching session found" });
        }

        // ============================================================
        // 3. CREDS.JSON එක හදන මැජික් එක (Data Merging Logic)
        // ============================================================
        
        // Database එකේ 'creds' ඇතුලේ තියෙන ඒවා (noiseKey, advSecretKey, etc.)
        // සහ එළියේ තියෙන ඒවා (me, platform, signalIdentities) එකට එකතු කරනවා.
        
        const finalCredsJson = {
            ...session.creds,   // creds object එකේ තියෙන ඔක්කොම එළියට ගන්නවා
            
            // මේ ටික Database එකේ creds එකෙන් එළියේ තියෙන්නේ, ඒවත් මේකටම දානවා
            me: session.me,
            signalIdentities: session.signalIdentities,
            platform: session.platform,
            myAppStateKeyId: session.myAppStateKeyId,
            
            // සමහර වෙලාවට routingInfo එකේ තියෙන timestamp එක එළියට ගන්න ඕන වෙයි
            lastAccountSyncTimestamp: session.lastAccountSyncTimestamp || (session.routingInfo && session.routingInfo.lastAccountSyncTimestamp),
            
            // අවශ්‍ය නම් routingInfo එකත් දාන්න
            routingInfo: session.routingInfo
        };

        // 4. දැන් මේක කෙලින්ම යවන්නේ creds.json ෆයිල් එකේ structure එකටමයි
        return res.status(200).json(finalCredsJson);

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
