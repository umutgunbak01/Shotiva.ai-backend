require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const { fal } = require('@fal-ai/client');
const path = require('path');

const app = require('./app');
const port = process.env.PORT || 3000;

// Configure Fal AI
fal.config({
    credentials: process.env.FAL_KEY
});

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 12 * 1024 * 1024 // 12MB limit
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/white-background', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // Process image with Sharp
        const processedImage = await sharp(req.file.buffer)
            .resize(1000, 1000, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .toBuffer();

        // Convert to base64
        const base64Image = `data:${req.file.mimetype};base64,${processedImage.toString('base64')}`;

        // Call Fal AI API
        const result = await fal.subscribe('fal-ai/bria/product-shot', {
            input: {
                image_url: base64Image,
                scene_description: req.body.prompt || 'on a clean white background, professional product photography',
                optimize_description: true,
                num_results: 1,
                fast: true,
                placement_type: 'manual_placement',
                shot_size: [1000, 1000],
                manual_placement_selection: 'center_vertical'
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === 'IN_PROGRESS') {
                    console.log('Processing:', update.logs.map(log => log.message).join('\n'));
                }
            }
        });

        // Return the generated image URL
        res.json({ imageUrl: result.data.images[0].url });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process image' });
    }
});

// Start server
// app.listen(port, () => {
//     console.log(`Server running on port ${port}`);
// }); 