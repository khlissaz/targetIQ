# TargetIQ Chrome Extension

Lead capture extension for the TargetIQ Lead Generation System.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `chrome-extension` directory

## Configuration

Before using the extension, you need to configure the API endpoint:

1. Open `popup.js`
2. Update the following values:
   - Replace `https://your-app-url.com` with your actual app URL
   - Replace `https://your-api-url.com` with your actual API URL

## Usage

1. Login to your TargetIQ account through the extension
2. Navigate to any webpage
3. Click the TargetIQ extension icon
4. The extension will auto-fill available data from the page
5. Complete the form and click "Capture Lead"

## Features

- Auto-fill lead data from web pages
- Bilingual support (English/Arabic)
- Context menu integration
- Secure authentication
- Real-time lead capture

## Icons

You'll need to create icon files in the `icons` directory:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

Use the TargetIQ branding colors:
- Orange: #FF6B00
- Navy: #1A2B3C
