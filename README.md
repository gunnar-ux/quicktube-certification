# Quick Tube Certification Web App

A professional certification system for doctors completing Quick Tube Chest Tube System training.

## Features

- 📹 **Video Training**: Two instructional videos that must be completed before certification
- 📝 **Certification Form**: Comprehensive form collecting physician details
- 📄 **PDF Certificate**: Professionally designed certificate generated as PDF
- 📧 **Email Delivery**: Automatic email delivery to physician and Quick Tube Medical
- 🎨 **Professional Design**: Dark theme with Quick Tube orange branding
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Email Settings

Create a `.env` file in the root directory:

```env
# For Gmail (development/testing)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# From email address
FROM_EMAIL=noreply@quicktubemedical.com

# Server port
PORT=3000
```

**Gmail Setup:**
1. Enable 2-factor authentication on your Gmail account
2. Generate an "App Password" in your Google Account settings
3. Use the app password (not your regular password) in EMAIL_PASS

### 3. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### 4. Open the App

Visit `http://localhost:3000` in your browser.

## Project Structure

```
quicktube-cert/
├── index.html          # Main application page
├── server.js           # Node.js Express server
├── package.json        # Dependencies and scripts
├── styles/
│   └── main.css        # Application styles
├── scripts/
│   └── main.js         # Frontend JavaScript
├── images/
│   ├── logo.png        # Quick Tube logo
│   ├── Video1.mov      # Training video 1
│   └── Video2.mov      # Training video 2
└── assets/
    └── QuicktubeCertificationTemplate.docx
```

## User Flow

1. **Landing**: Doctor arrives at the page and sees two training videos
2. **Training**: Doctor watches both videos (form is hidden until completion)
3. **Certification**: Form appears after both videos are completed
4. **Submission**: Doctor fills out form and submits
5. **Processing**: Server generates PDF certificate and sends email
6. **Delivery**: Certificate is sent to:
   - The doctor's email address
   - BCC: maugustine@quicktubemedical.com

## Email Configuration Options

### Gmail (Recommended for Development)
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FROM_EMAIL=noreply@quicktubemedical.com
```

### Custom SMTP (Recommended for Production)
```env
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
FROM_EMAIL=noreply@quicktubemedical.com
```

### Production Email Services
For production, consider using:
- **SendGrid** - Easy setup, reliable delivery
- **Mailgun** - Good API, detailed analytics
- **AWS SES** - Cost-effective, scalable
- **Resend** - Developer-friendly, modern interface

## Certificate Features

- **Professional Design**: Clean, corporate layout with Quick Tube branding
- **Dynamic Content**: Physician name, license, institution, dates
- **Unique ID**: Each certificate has a unique identifier
- **PDF Security**: Generated as flattened PDF to prevent editing
- **Email Integration**: Automatically attached to congratulatory email

## Deployment

### Netlify (Frontend + Serverless Functions)
1. Deploy frontend files to Netlify
2. Convert server.js to Netlify Functions
3. Configure environment variables in Netlify dashboard

### Vercel (Full-Stack)
1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy with one click

### Traditional Hosting
1. Upload files to your server
2. Install Node.js dependencies
3. Configure environment variables
4. Start with `npm start`
5. Use PM2 or similar for process management

## Security Features

- ✅ **No Data Storage**: Form data is processed in-memory only
- ✅ **HTTPS Ready**: Designed for SSL/TLS encryption
- ✅ **Input Validation**: Both frontend and backend validation
- ✅ **Email Security**: Uses secure SMTP with TLS
- ✅ **PDF Security**: Flattened PDFs prevent tampering
- ✅ **CORS Protection**: Configurable cross-origin policies

## Customization

### Styling
- Edit `styles/main.css` to modify colors, fonts, layout
- Current theme uses #121212 (dark) background with #f28c00 (orange) accents
- Uses Inter font family for modern, professional look

### Certificate Template
- Modify the `generateCertificateHTML()` function in `server.js`
- Update styling, layout, or content as needed
- Logo can be embedded as base64 or referenced as URL

### Email Template
- Edit the email HTML in the `/api/generate-certificate` endpoint
- Customize subject line, messaging, and styling

## Troubleshooting

### Video Not Playing
- Ensure video files are in `images/` directory
- Check video format compatibility (.mov files should work in most browsers)
- Verify file paths in HTML

### Email Not Sending
- Verify environment variables are set correctly
- Check Gmail app password (not regular password)
- Test with a simple email service first
- Check server logs for detailed error messages

### PDF Generation Issues
- Ensure all dependencies are installed
- Check that Puppeteer can run in your environment
- For server deployments, may need additional dependencies

## Support

For technical support or questions:
- Email: maugustine@quicktubemedical.com
- Check server logs for detailed error information
- Verify all environment variables are configured correctly 