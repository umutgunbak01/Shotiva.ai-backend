# Shotiva AI Backend

This is the backend service for Shotiva AI, handling image processing and AI integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
FAL_KEY=your_fal_ai_key_here
```

3. Start the development server:
```bash
npm run dev
```

## API Endpoints

### POST /api/white-background
Process an image to generate a white background.

**Request:**
- Content-Type: multipart/form-data
- Body:
  - image: Image file (JPEG, PNG, WebP)
  - prompt: Optional text prompt for background customization

**Response:**
```json
{
  "imageUrl": "https://..."
}
```

## Deployment

This service is deployed on Render. The deployment is automatically triggered when changes are pushed to the main branch.

## Environment Variables

- `PORT`: Server port (default: 3000)
- `FAL_KEY`: Fal AI API key 