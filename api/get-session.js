const { MongoClient } = require('mongodb');

module.exports = async (req, res) => {
    // 1. CORS Headers 
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

        // හැම වෙලේම අලුත් කනෙක්ෂන් එකක් (cachedClient නෑ)
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const db = client.db('test'); // ඔයාගේ DB නම

        // 2. මුලින්ම බලනවා මේ නම්බර් එකයි Session ID එකයි මැච් වෙනවද කියලා
        const sessionMeta = await db.collection('sessions').findOne({
            sessionId: sessionId,
            phoneNumber: phoneNumber
        });

        if (!sessionMeta) {
            await client.close();
            return res.status(404).json({ success: false, message: "No matching session found in records" });
        }

        // 3. ⚠️ මෙන්න මේකෙන් තමයි ඔක්කොම ඩේටා ටික ගන්නේ
        // මේ regex එකෙන් කියන්නේ '_id' එක ඔයාගේ sessionId එකෙන් පටන් ගන්න හැම එකක්ම අරන් එන්න කියලයි
        const allAuthDocs = await db.collection('auths').find({
            _id: { $regex: `^${sessionId}` }
        }).toArray();

        if (!allAuthDocs || allAuthDocs.length === 0) {
            await client.close();
            return res.status(404).json({ success: false, message: "Credentials not found in Auth database" });
        }

        // 4. ඇදලා ගත්ත ඩේටා තොගය ලස්සන Object එකකට පැක් කරනවා
        // උදා: { "sz-MD_...-creds": {...}, "sz-MD_...-pre-key-1": {...} }
        const fullSessionData = {};
        allAuthDocs.forEach(doc => {
            fullSessionData[doc._id] = doc.creds;
        });

        // අන්තිමට Database Connection එක වහනවා
        await client.close();

        // 5. ඔක්කොම ඩේටා ටික යවනවා
        return res.status(200).json({
            success: true,
            sessionId: sessionId,
            data: fullSessionData
        });

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
