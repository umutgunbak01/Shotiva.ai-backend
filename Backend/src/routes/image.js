const express = require('express');
const router = express.Router();
const multer = require('multer');
const { fal } = require('@fal-ai/client');
const path = require('path');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
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
            size: req.file.size
        });

        // Process image with Fal AI product-shot endpoint
        console.log('Starting Fal AI processing...');
        const result = await fal.subscribe('fal-ai/bria/product-shot', {
            input: {
                image_url: req.file.path,
                ref_image_url: "https://storage.googleapis.com/falserverless/bria/white-background.png",
                optimize_description: true,
                num_results: 1,
                fast: true,
                placement_type: "manual_placement",
                shot_size: [1000, 1000],
                manual_placement_selection: "bottom_center"
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    console.log('Processing update:', update.logs.map((log) => log.message));
                }
            }
        });

        console.log('Fal AI processing completed:', {
            success: true,
            imageUrl: result.images[0].url
        });

        // Return the enhanced image URL
        res.json({
            success: true,
            enhancedImageUrl: result.images[0].url
        });

    } catch (error) {
        console.error('Error processing image:', {
            message: error.message,
            stack: error.stack,
            details: error
        });
        res.status(500).json({ 
            error: 'Failed to process image',
            details: error.message
        });
    }
});

module.exports = router; 