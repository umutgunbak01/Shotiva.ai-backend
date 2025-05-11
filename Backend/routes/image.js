const express = require('express');
const router = express.Router();
const multer = require('multer');
const { fal } = require('@fal-ai/client');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Initialize Fal AI client
fal.config({
    credentials: process.env.FAL_KEY
});

// Route for image enhancement
router.post('/enhance', upload.single('image'), async (req, res) => {
    console.log('Received image enhancement request');
    
    try {
        if (!req.file) {
            console.error('No image file provided in request');
            return res.status(400).json({ error: 'No image file provided' });
        }

        console.log('File received:', {
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        // Verify file exists
        if (!fs.existsSync(req.file.path)) {
            console.error('File not found after upload:', req.file.path);
            return res.status(500).json({ error: 'File upload failed' });
        }

        // Compress image using sharp
        const compressedImageBuffer = await sharp(req.file.path)
            .resize(1000, 1000, { // Resize to max dimensions
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
            .toBuffer();

        console.log('Image compressed:', {
            originalSize: req.file.size,
            compressedSize: compressedImageBuffer.length
        });

        // Convert compressed image to base64
        const base64Image = `data:image/jpeg;base64,${compressedImageBuffer.toString('base64')}`;
        console.log('Image converted to base64, length:', base64Image.length);

        // Process image with Fal AI product-shot endpoint
        console.log('Starting Fal AI processing...');
        const result = await fal.subscribe('fal-ai/bria/product-shot', {
            input: {
                image_url: base64Image,
                scene_description: req.body.prompt || 'on a clean white background, professional product photography',
                optimize_description: true,
                num_results: 1,
                fast: true,
                placement_type: "manual_placement",
                shot_size: [1000, 1000],
                manual_placement_selection: "bottom_center",
                sync_mode: true
            }
        });

        // Log Fal AI response without the full base64 data
        const logResult = { ...result };
        if (logResult.images && Array.isArray(logResult.images)) {
            logResult.images = logResult.images.map(img => ({
                ...img,
                url: img.url ? `[URL length: ${img.url.length}]` : null
            }));
        }
        console.log('Fal AI response:', JSON.stringify(logResult, null, 2));

        // Clean up: Delete the uploaded file
        fs.unlinkSync(req.file.path);

        // Check if result has the expected structure
        if (!result || !result.images || !Array.isArray(result.images) || result.images.length === 0) {
            console.error('Unexpected Fal AI response structure:', result);
            return res.status(500).json({
                error: 'Unexpected response from Fal AI',
                details: 'The response did not contain the expected image data'
            });
        }

        // Return the enhanced image URL
        res.json({
            success: true,
            enhancedImageUrl: result.images[0].url
        });

    } catch (error) {
        console.error('Error processing image:', {
            message: error.message,
            stack: error.stack,
            details: error,
            status: error.status,
            body: error.body
        });

        // Clean up the uploaded file if it exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ 
            error: 'Failed to process image',
            details: error.message,
            status: error.status,
            body: error.body
        });
    }
});

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Image routes are working' });
});

module.exports = router; 