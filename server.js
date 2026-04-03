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

app.get('/api/data', (req, res) => {
    if (fs.existsSync(dataFile)) {
        res.json(JSON.parse(fs.readFileSync(dataFile, 'utf8')));
    } else {
        res.json({});
    }
});

app.post('/api/data', (req, res) => {
    fs.writeFileSync(dataFile, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));