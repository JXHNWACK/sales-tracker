const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Define data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}
const dataFile = path.join(dataDir, 'data.json');

app.use(express.json());
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
        res.status(500).json({ error: "Failed to save data" });
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