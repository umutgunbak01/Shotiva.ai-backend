const express = require('express');
const cors = require('cors');
const path = require('path');
const imageRoutes = require('./routes/image');

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
    res.status(404).json({
        error: 'Not found',
        details: `Cannot ${req.method} ${req.path}`
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 