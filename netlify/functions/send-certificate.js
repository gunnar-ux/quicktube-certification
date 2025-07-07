const nodemailer = require('nodemailer');

// Email transporter setup
async function setupEmailTransporter() {
    console.log('Setting up email transporter...');
    console.log('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'Set (length: ' + (process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0) + ')' : 'Not set');

    // Use Gmail SMTP configuration (default)
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === 'true', // false for STARTTLS
        auth: {
            user: process.env.SMTP_USER, // quicktubecertification@gmail.com
            pass: process.env.SMTP_PASS  // Gmail app password
        }
    });
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
        
        // Test the connection
        try {
            await transporter.verify();
            console.log('Email transporter verified successfully');
        } catch (verifyError) {
            console.error('Email transporter verification failed:', verifyError);
            throw new Error(`Email configuration error: ${verifyError.message}`);
        }

        // Convert base64 to buffer
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        // Email content
        const mailOptions = {
            from: process.env.FROM_EMAIL || 'info@quicktubemedical.com',
            to: formData.email,
            bcc: 'maugustine@quicktubemedical.com', // Mike gets a copy
            replyTo: process.env.FROM_EMAIL || 'info@quicktubemedical.com',
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
                    <a href="mailto:info@quicktubemedical.com">info@quicktubemedical.com</a>.</p>
                    
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
        console.log('Attempting to send email to:', formData.email);
        console.log('Email subject:', mailOptions.subject);
        
        try {
            const result = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            throw new Error(`Failed to send email: ${emailError.message}`);
        }

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