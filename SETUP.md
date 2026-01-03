# TargetIQ Setup Guide

Complete setup instructions for the TargetIQ Lead Generation System.

## Prerequisites

Before you begin, ensure you have:

- Node.js 16+ installed
- npm or yarn package manager
- Chrome browser (for extension testing)


## Step 1: API Setup

1. Start the backend API server (NestJS):
   - `cd api && pnpm install && pnpm start`
2. The API will run on `http://localhost:3000` by default.
3. The database schema is managed by the backend migrations.

## Step 2: Web Application Setup

### Install Dependencies

```bash
cd targetiq
npm install
```

### Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and set your API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Test the Application

1. Navigate to `/landing` (should redirect automatically)
2. Click "Sign Up" and create an account
3. Check your email for verification (if email confirmation is enabled)
4. Login to access the dashboard
5. Try creating a test lead

## Step 3: Chrome Extension Setup

### Configure Extension

1. Navigate to `chrome-extension/popup.js`
2. Update the following values:

```javascript
// Line ~85 - Update the app URL
chrome.tabs.create({ url: 'https://YOUR-APP-URL.com/auth/login' });

// Line ~115 - Update the API URL
const response = await fetch('http://localhost:3000/leads', {
   method: 'POST',
   headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${result.user.token}`,
   },
   // ...
});
```

### Create Extension Icons

Create the following icon files in `chrome-extension/icons/`:

- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

Use the TargetIQ branding colors:
- Orange: #FF6B00
- Navy: #1A2B3C

You can create simple icons using any image editor or use online tools like:
- [Canva](https://www.canva.com)
- [Figma](https://www.figma.com)
- [GIMP](https://www.gimp.org)

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `chrome-extension` directory
5. The TargetIQ extension should now appear in your extensions list

### Test the Extension

1. Login to your TargetIQ web app first
2. Navigate to any website (e.g., LinkedIn profile)
3. Click the TargetIQ extension icon
4. The extension should auto-fill available data
5. Complete the form and click "Capture Lead"
6. Verify the lead appears in your dashboard

## Step 4: Email Configuration (Optional)

To enable email notifications and authentication emails:

1. Configure your email provider in the backend if you want to enable email notifications.

## Step 5: Deployment

### Deploy Web Application

#### Option 1: Netlify (Recommended)

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Build settings are already configured in `netlify.toml`
6. Add environment variables in Netlify dashboard
7. Deploy!

#### Option 2: Vercel

```bash
npm install -g vercel
vercel
```

Follow the prompts and add your environment variables when asked.

### Publish Chrome Extension

To publish your extension to the Chrome Web Store:

1. Create a [Chrome Web Store Developer account](https://chrome.google.com/webstore/devconsole) ($5 one-time fee)
2. Zip the `chrome-extension` directory
3. Upload to the Chrome Web Store Developer Console
4. Fill in the listing details:
   - Name: TargetIQ Lead Capture
   - Description: Capture leads instantly from any website
   - Category: Productivity
   - Screenshots: Take screenshots of the extension in action
5. Submit for review

## Troubleshooting

### Common Issues

#### "API URL not found"
- Make sure `.env.local` exists and has the correct API URL
- Restart the development server after adding environment variables

#### Extension not capturing leads
- Verify you're logged in to the web app first
- Check Chrome console for errors (right-click extension → Inspect)
- Ensure API URL is correctly set in the extension config

#### Build errors
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Try `npm run build` to see detailed errors

### Database Reset

If you need to reset the database, use the backend migration scripts or your database management tool.

## Next Steps

1. **Customize Branding**: Update colors and logo to match your brand
2. **Add Features**: Extend the application with custom fields
3. **Configure Analytics**: Set up Google Analytics or similar
4. **API Integration**: Add integrations with CRM systems
5. **Team Features**: Add team management and collaboration features

## Support

For issues or questions:
- Check the [README.md](README.md) for general information
- Check Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Rotate API keys** regularly in production
3. **Enable email confirmation** for new signups
4. **Use HTTPS** in production
5. **Regular backups** of your database
6. **Monitor usage** to detect suspicious activity

---

Happy Lead Generating! 🎯
