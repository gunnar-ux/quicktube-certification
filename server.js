const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' })); // Increase limit for PDF data
app.use(express.static('.'));

// CORS middleware for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Email transporter setup
let transporter;

async function setupEmailTransporter() {
    // Use environment variables for email configuration
    if (process.env.SMTP_HOST) {
        // Custom SMTP configuration
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else {
        // Gmail configuration (fallback for development)
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_PASS || 'your-app-password'
            }
        });
    }
}

// API endpoint to send certificate (now receives PDF from client)
app.post('/api/generate-certificate', async (req, res) => {
    try {
        const { formData, pdfBase64 } = req.body;
        
        // Validate required fields
        const requiredFields = ['physicianName', 'licenseNumber', 'institution', 'completionDate', 'signature', 'email'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: 'Missing required fields',
                missingFields
            });
        }

        if (!pdfBase64) {
            return res.status(400).json({ error: 'PDF data is required' });
        }

        // Setup email if not already done
        if (!transporter) {
            await setupEmailTransporter();
        }

        // Convert base64 to buffer
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        // Email content
        const mailOptions = {
            from: process.env.FROM_EMAIL || 'noreply@quicktubemedical.com',
            to: formData.email,
            bcc: 'gunnar.autterson@gmail.com', // Testing - change to maugustine@quicktubemedical.com for production
            subject: 'Quick Tube Chest Tube System - Certificate of Completion',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f28c00;">Congratulations on Your Certification!</h2>
                    
                    <p>Dear Dr. ${formData.physicianName},</p>
                    
                    <p>Thank you for completing the Quick Tube Chest Tube System training program. 
                    Your certificate of completion is attached to this email.</p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">Training Details:</h3>
                        <ul style="color: #666;">
                            <li><strong>Physician:</strong> ${formData.physicianName}</li>
                            <li><strong>Institution:</strong> ${formData.institution}</li>
                            <li><strong>Completion Date:</strong> ${new Date(formData.completionDate).toLocaleDateString()}</li>
                            <li><strong>License Number:</strong> ${formData.licenseNumber}</li>
                        </ul>
                    </div>
                    
                    <p>This certificate verifies that you have successfully completed our comprehensive 
                    training program and are certified to use the Quick Tube Chest Tube System in clinical practice.</p>
                    
                    <p>If you have any questions or need additional documentation, please contact us at 
                    <a href="mailto:maugustine@quicktubemedical.com">maugustine@quicktubemedical.com</a>.</p>
                    
                    <p>Best regards,<br>
                    <strong>Quick Tube Medical Team</strong></p>
                </div>
            `,
            attachments: [
                {
                    filename: `QuickTube_Certificate_${formData.physicianName.replace(/\s+/g, '_')}.pdf`,
                    content: pdfBuffer
                }
            ]
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Certificate generated and sent successfully'
        });

    } catch (error) {
        console.error('Error sending certificate:', error);
        res.status(500).json({
            error: 'Failed to send certificate',
            message: error.message
        });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Quick Tube Certification Server running on port ${PORT}`);
    console.log(`📧 Email transporter will be configured on first certificate request`);
    console.log(`🌐 Open http://localhost:${PORT} to view the application`);
    console.log(`📄 PDF generation now handled client-side - Netlify compatible!`);
}); 