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

// Root route handler
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Shotiva AI API is running',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            test: '/test',
            image: {
                test: '/api/image/test',
                enhance: '/api/image/enhance'
            }
        }
    });
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Server is working',
        timestamp: new Date().toISOString()
    });
});

// Register routes
app.use('/api/image', imageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: err.message,
        timestamp: new Date().toISOString()
    });
});

// Handle 404 errors
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.path);
    res.status(404).json({
        error: 'Not found',
        details: `Cannot ${req.method} ${req.path}`,
        timestamp: new Date().toISOString(),
        availableEndpoints: [
            '/',
            '/health',
            '/test',
            '/api/image/test',
            '/api/image/enhance'
        ]
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Uploads directory:', uploadsDir);
    console.log('Routes registered:');
    console.log('- GET /');
    console.log('- GET /health');
    console.log('- GET /test');
    console.log('- GET /api/image/test');
    console.log('- POST /api/image/enhance');
});

module.exports = app; 