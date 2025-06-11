const nodemailer = require('nodemailer');

// Email transporter setup
async function setupEmailTransporter() {
    // Use environment variables for email configuration
    if (process.env.SMTP_HOST) {
        // Custom SMTP configuration
        return nodemailer.createTransport({
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
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_PASS || 'your-app-password'
            }
        });
    }
}

exports.handler = async (event, context) => {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { formData, pdfBase64 } = JSON.parse(event.body);
        
        // Validate required fields
        const requiredFields = ['physicianName', 'licenseNumber', 'institution', 'completionDate', 'signature', 'email'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (missingFields.length > 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Missing required fields',
                    missingFields
                })
            };
        }

        if (!pdfBase64) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'PDF data is required' })
            };
        }

        // Setup email transporter
        const transporter = await setupEmailTransporter();

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

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Certificate generated and sent successfully'
            })
        };

    } catch (error) {
        console.error('Error sending certificate:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to send certificate',
                message: error.message
            })
        };
    }
}; 