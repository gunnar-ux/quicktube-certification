// Video completion tracking
let video0Completed = false;
let video1Completed = false;
let video2Completed = false;

// DOM elements
const video0 = document.getElementById('video0');
const video1 = document.getElementById('video1');
const video2 = document.getElementById('video2');
const video0Status = document.getElementById('video0-status');
const video1Status = document.getElementById('video1-status');
const video2Status = document.getElementById('video2-status');
const certificationForm = document.getElementById('certificationForm');
const certForm = document.getElementById('certForm');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');

// Initialize video tracking
function initializeVideoTracking() {
    // Video 0 event listeners
    video0.addEventListener('ended', () => {
        markVideoCompleted(0);
    });

    video0.addEventListener('timeupdate', () => {
        // Mark as completed if 95% watched (to account for slight timing differences)
        if (video0.currentTime / video0.duration >= 0.95) {
            markVideoCompleted(0);
        }
    });

    // Video 1 event listeners
    video1.addEventListener('ended', () => {
        markVideoCompleted(1);
    });

    video1.addEventListener('timeupdate', () => {
        // Mark as completed if 95% watched (to account for slight timing differences)
        if (video1.currentTime / video1.duration >= 0.95) {
            markVideoCompleted(1);
        }
    });

    // Video 2 event listeners
    video2.addEventListener('ended', () => {
        markVideoCompleted(2);
    });

    video2.addEventListener('timeupdate', () => {
        // Mark as completed if 95% watched
        if (video2.currentTime / video2.duration >= 0.95) {
            markVideoCompleted(2);
        }
    });
}

// Mark video as completed
function markVideoCompleted(videoNumber) {
    if (videoNumber === 0 && !video0Completed) {
        video0Completed = true;
        video0Status.textContent = 'Completed ✓';
        video0Status.className = 'video-status completed';
        document.querySelector('#video0').closest('.video-item').classList.add('completed');
    } else if (videoNumber === 1 && !video1Completed) {
        video1Completed = true;
        video1Status.textContent = 'Completed ✓';
        video1Status.className = 'video-status completed';
        document.querySelector('#video1').closest('.video-item').classList.add('completed');
    } else if (videoNumber === 2 && !video2Completed) {
        video2Completed = true;
        video2Status.textContent = 'Completed ✓';
        video2Status.className = 'video-status completed';
        document.querySelector('#video2').closest('.video-item').classList.add('completed');
    }

    // Show form if all videos are completed
    if (video0Completed && video1Completed && video2Completed) {
        showCertificationForm();
    }
}

// Show certification form with animation
function showCertificationForm() {
    certificationForm.style.display = 'block';
    certificationForm.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
    
    // Set completion date to today by default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('completionDate').value = today;
}

// Handle form submission
function handleFormSubmission() {
    certForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        // Show loading state
        setLoadingState(true);

        try {
            // Collect form data
            const formData = {
                physicianName: document.getElementById('physicianName').value.trim(),
                licenseNumber: document.getElementById('licenseNumber').value.trim(),
                institution: document.getElementById('institution').value.trim(),
                completionDate: document.getElementById('completionDate').value,
                signature: document.getElementById('signature').value.trim(),
                email: document.getElementById('email').value.trim()
            };

            // Generate PDF on client-side
            const pdfBase64 = await generateCertificatePDF(formData);

            // Send to Netlify Function (or Express endpoint for local dev)
            const apiUrl = window.location.hostname === 'localhost' 
                ? '/api/generate-certificate'
                : '/.netlify/functions/send-certificate';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ formData, pdfBase64 })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            
            // Show success message
            showSuccessMessage();
            
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('There was an error generating your certificate. Please try again or contact support.');
        } finally {
            setLoadingState(false);
        }
    });
}

// Generate Certificate PDF using jsPDF
async function generateCertificatePDF(formData) {
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });

    // Create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'letter');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    
    // Header - Left side
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Quick Tube Medical', margin, 60);
    
    // Header - Right side (aligned right)
    doc.setFont(undefined, 'normal');
    const headerLines = [
        'Quick Tube Medical, LLC',
        'Attn: Michael Augustine', 
        '3049 Kingston Pike',
        'Knoxville, TN. 37917'
    ];
    
    let yPos = 60;
    headerLines.forEach(line => {
        const textWidth = doc.getTextWidth(line);
        doc.text(line, pageWidth - margin - textWidth, yPos);
        yPos += 14;
    });
    
    // Contact info (right aligned, with spacing)
    yPos += 10;
    doc.text('maugustine@quicktubemedical.com', pageWidth - margin - doc.getTextWidth('maugustine@quicktubemedical.com'), yPos);
    yPos += 14;
    doc.text('(763) 442-1848', pageWidth - margin - doc.getTextWidth('(763) 442-1848'), yPos);
    
    // Title (centered)
    yPos = 180;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    const title = 'Quick Tube Chest Tube Training Certification Form';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, yPos);
    
    // Main description paragraph
    yPos += 30;
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    const description = 'This certification form confirms that the undersigned healthcare professional has completed the required training for the safe and effective use of the Quick Tube Chest Tube, a medical device designed to treat pneumothorax, manufactured by Quick Tube Medical, LLC.';
    
    const descLines = doc.splitTextToSize(description, contentWidth);
    doc.text(descLines, margin, yPos);
    yPos += descLines.length * 14 + 20;
    
    // Form fields with better spacing and overflow handling
    const midPoint = pageWidth / 2;
    
    // First row - Physician Name and License Number
    doc.text('Physician Name:', margin, yPos);
    const nameStartX = margin + doc.getTextWidth('Physician Name: ');
    const nameEndX = midPoint - 20; // Leave some space before next field
    doc.line(nameStartX, yPos + 2, nameEndX, yPos + 2);
    
    // Handle long physician names
    const physicianNameText = doc.splitTextToSize(formData.physicianName, nameEndX - nameStartX - 5);
    doc.text(physicianNameText[0] || formData.physicianName, nameStartX + 2, yPos);
    
    // License number on the right
    const licenseLabel = 'Medical License Number:';
    const licenseStartX = midPoint;
    doc.text(licenseLabel, licenseStartX, yPos);
    const licenseFieldX = licenseStartX + doc.getTextWidth(licenseLabel) + 5;
    const licenseEndX = pageWidth - margin;
    doc.line(licenseFieldX, yPos + 2, licenseEndX, yPos + 2);
    
    // Handle long license numbers
    const licenseText = doc.splitTextToSize(formData.licenseNumber, licenseEndX - licenseFieldX - 5);
    doc.text(licenseText[0] || formData.licenseNumber, licenseFieldX + 2, yPos);
    
    yPos += 35;
    
    // Second row - Institution and Date
    doc.text('Institution/Hospital:', margin, yPos);
    const instStartX = margin + doc.getTextWidth('Institution/Hospital: ');
    const instEndX = midPoint - 20;
    doc.line(instStartX, yPos + 2, instEndX, yPos + 2);
    
    // Handle long institution names
    const institutionText = doc.splitTextToSize(formData.institution, instEndX - instStartX - 5);
    doc.text(institutionText[0] || formData.institution, instStartX + 2, yPos);
    
    // Date on the right
    const dateLabel = 'Date of Training Completion:';
    const dateStartX = midPoint;
    doc.text(dateLabel, dateStartX, yPos);
    const dateFieldX = dateStartX + doc.getTextWidth(dateLabel) + 5;
    const dateEndX = pageWidth - margin;
    doc.line(dateFieldX, yPos + 2, dateEndX, yPos + 2);
    
    const formattedDate = new Date(formData.completionDate).toLocaleDateString('en-US');
    doc.text(formattedDate, dateFieldX + 2, yPos);
    
    yPos += 40;
    
    // Training Requirements section
    doc.setFont(undefined, 'bold');
    doc.text('Training Requirements Completed:', margin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text('By signing below, I certify that I have:', margin + 200, yPos);
    yPos += 20;
    
    // Training requirements (as paragraph text)
    const requirements = [
        'Read and understood the Instructions for Use (IFU) for the Quick Tube Chest Tube, available on the Quick Tube Medical website. quicktubemedical.com',
        'Watched all instructional videos demonstrating the proper deployment and use of the Quick Tube Chest Tube, as provided on the Quick Tube Medical website.',
        'Understood the unique placement technique for the Quick Tube Chest Tube, which differs from traditional chest tube placement methods.'
    ];
    
    requirements.forEach(req => {
        const reqLines = doc.splitTextToSize(req, contentWidth);
        doc.text(reqLines, margin, yPos);
        yPos += reqLines.length * 14 + 8;
    });
    
    yPos += 15;
    
    // Acknowledgment paragraph
    const acknowledgment = 'I acknowledge that I am responsible for applying the training and IFU guidelines correctly during the placement and use of the Quick Tube Chest Tube. I confirm that I have the necessary skills, knowledge, and clinical judgment to use the device safely and effectively in accordance with its intended purpose.';
    
    const ackLines = doc.splitTextToSize(acknowledgment, contentWidth);
    doc.text(ackLines, margin, yPos);
    yPos += ackLines.length * 14 + 20;
    
    // Indemnification section
    doc.setFont(undefined, 'bold');
    doc.text('Indemnification:', margin, yPos);
    yPos += 16;
    
    doc.setFont(undefined, 'normal');
    const indemnification = 'I agree that Quick Tube Medical shall not be held liable for any adverse outcomes, complications, or damages arising from my use or misuse of the Quick Tube Chest Tube, including but not limited to improper placement, failure to follow the IFU, or deviations from the training provided. I hereby indemnify and hold harmless Quick Tube Medical, its officers, employees, and affiliates from any claims, liabilities, or legal actions resulting from my actions or omissions during the use of the Quick Tube Chest Tube, provided that such use is not due to a defect in the device itself as determined by applicable regulatory standards.';
    
    const indemnLines = doc.splitTextToSize(indemnification, contentWidth);
    doc.text(indemnLines, margin, yPos);
    yPos += indemnLines.length * 14 + 30;
    
    // Signature section with better spacing
    const sigLabel = 'Physician Signature:';
    doc.text(sigLabel, margin, yPos);
    const sigStartX = margin + doc.getTextWidth(sigLabel) + 5;
    const sigEndX = midPoint + 50; // Give more space for signature
    doc.line(sigStartX, yPos + 2, sigEndX, yPos + 2);
    
    // Handle long signatures
    const signatureText = doc.splitTextToSize(formData.signature, sigEndX - sigStartX - 5);
    doc.text(signatureText[0] || formData.signature, sigStartX + 2, yPos);
    
    // Date field on the right with proper spacing
    const dateSignLabel = 'Today\'s Date:';
    const dateSigStartX = midPoint + 80;
    doc.text(dateSignLabel, dateSigStartX, yPos);
    const dateSigFieldX = dateSigStartX + doc.getTextWidth(dateSignLabel) + 5;
    const dateSigEndX = pageWidth - margin;
    doc.line(dateSigFieldX, yPos + 2, dateSigEndX, yPos + 2);
    doc.text(currentDate, dateSigFieldX + 2, yPos);
    
    yPos += 40;
    
    // Note section
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Note:', margin, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 14;
    
    const note = 'This certification does not replace any institutional or regulatory requirements for credentialing or privileging to perform chest tube placement procedures.';
    const noteLines = doc.splitTextToSize(note, contentWidth);
    doc.text(noteLines, margin, yPos);
    
    // Convert to base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    return pdfBase64;
}

// Validate form data
function validateForm() {
    const requiredFields = [
        'physicianName',
        'licenseNumber', 
        'institution',
        'completionDate',
        'signature',
        'email'
    ];

    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();
        
        if (!value) {
            field.style.borderColor = '#dc3545';
            isValid = false;
        } else {
            field.style.borderColor = '#333';
        }
    });

    // Additional email validation
    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        document.getElementById('email').style.borderColor = '#dc3545';
        isValid = false;
    }

    if (!isValid) {
        alert('Please fill in all required fields correctly.');
    }

    return isValid;
}

// Set loading state
function setLoadingState(loading) {
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    
    if (loading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        submitBtn.disabled = true;
    } else {
        btnText.style.display = 'block';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Show success message
function showSuccessMessage() {
    certificationForm.style.display = 'none';
    successMessage.style.display = 'block';
    successMessage.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeVideoTracking();
    handleFormSubmission();
    
    // Set initial video status classes
    video0Status.className = 'video-status not-completed';
    video1Status.className = 'video-status not-completed';
    video2Status.className = 'video-status not-completed';
});

// Add form field focus/blur effects
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input');
    
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.style.borderColor = '#f28c00';
        });
        
        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                input.style.borderColor = '#333';
            }
        });
    });
}); 