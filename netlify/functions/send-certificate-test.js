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
        
        // For now, just return success without actually sending email
        console.log('Form data received:', formData);
        console.log('PDF data length:', pdfBase64 ? pdfBase64.length : 'No PDF');
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Test successful - certificate would be sent (email disabled for testing)',
                data: {
                    physician: formData.physicianName,
                    email: formData.email
                }
            })
        };

    } catch (error) {
        console.error('Test function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Test function failed',
                message: error.message
            })
        };
    }
}; 