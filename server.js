const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Use Railway's official Volume environment variable to guarantee the save path is correct
let dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'data');
let dataFile;

const setupDataDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, '.test-write'), 'ok');
    return path.join(dir, 'data.json');
};

try {
    dataFile = setupDataDir(dataDir);
} catch (err1) {
    console.error("Primary path not writable:", err1.message);
    try {
        dataFile = setupDataDir(path.join(__dirname, 'data'));
    } catch (err2) {
        console.error("Fallback path not writable:", err2.message);
        // Ultimate fallback: /tmp is guaranteed to be writable in Linux containers
        dataFile = setupDataDir('/tmp/data');
    }
}

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname)); // Serves index.html automatically

// Health check endpoint for Railway
app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/api/data', (req, res) => {
    // Force browsers not to cache this response
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Expires', '-1');
    res.setHeader('Pragma', 'no-cache');

    try {
        if (fs.existsSync(dataFile)) {
            const fileContent = fs.readFileSync(dataFile, 'utf8');
            // If the file is empty, return an empty object instead of crashing
            res.json(fileContent ? JSON.parse(fileContent) : {});
        } else {
            res.json({});
        }
    } catch (error) {
        console.error("Error reading data:", error);
        res.json({}); // Failsafe so the app continues to load
    }
});

app.post('/api/data', (req, res) => {
    try {
        fs.writeFileSync(dataFile, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error("Error saving data:", error);
        res.status(500).json({ error: error.message || "Failed to save data" });
    }
});

const server = app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

// Graceful shutdown to prevent Railway SIGTERM errors in the logs
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server gracefully');
    server.close(() => {
        process.exit(0);
    });
});