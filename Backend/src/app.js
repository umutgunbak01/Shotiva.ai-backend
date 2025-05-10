const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const imageRoutes = require('./routes/image');

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', (req, res) => {
    console.log('Health check requested');
    res.json({ status: 'ok' });
});

// Test endpoint
app.get('/test', (req, res) => {
    console.log('Test endpoint requested');
    res.json({ message: 'Server is working' });
});

// Register routes
app.use('/api/image', imageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: err.message
    });
});

// Handle 404 errors
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.path);
    res.status(404).json({
        error: 'Not found',
        details: `Cannot ${req.method} ${req.path}`
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Uploads directory:', uploadsDir);
    console.log('Routes registered:');
    console.log('- GET /health');
    console.log('- GET /test');
    console.log('- GET /api/image/test');
    console.log('- POST /api/image/enhance');
});

module.exports = app; 