// Certification App State Management
class CertificationApp {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 6;
        this.videoProgress = {
            video0: false,
            video1: false,
            video2: false
        };
        this.progressIntervals = {};
        this.players = {};
        this.init();
    }

    init() {
        // Initialize video event listeners
        this.setupVideoTracking();
        
        // Initialize form submission
        this.setupFormSubmission();
        
        // Set initial completion date to today
        this.setInitialDate();
        
        // Setup clickable breadcrumbs
        this.setupBreadcrumbNavigation();
        
        // Setup hamburger menu
        this.setupHamburgerMenu();
        
        // Update navigation buttons
        this.updateNavigation();
    }

    setupVideoTracking() {
        const videos = ['video0', 'video1'];
        
        videos.forEach(videoId => {
            const iframe = document.getElementById(videoId);
            const statusEl = document.getElementById(`${videoId}-status`);
            
            if (iframe && statusEl) {
                // Set initial status
                statusEl.textContent = 'Not completed';
                statusEl.className = 'video-status not-completed';
                
                console.log(`YouTube video ${videoId} initialized`);
            }
        });

        // Initialize YouTube players when API is ready
        this.initializeYouTubePlayers(videos);
    }

    initializeYouTubePlayers(videos) {
        // Wait for YouTube API to be ready
        const initPlayers = () => {
            if (!window.YT || !window.YT.Player) {
                console.log('YouTube API not ready, waiting...');
                setTimeout(initPlayers, 500);
                return;
            }
            
            console.log('YouTube API ready, initializing players...');
            
            videos.forEach((videoId, index) => {
                const iframe = document.getElementById(videoId);
                if (iframe) {
                    // Extract video ID from src
                    const src = iframe.src;
                    const videoIdMatch = src.match(/embed\/([^?]+)/);
                    const youtubeVideoId = videoIdMatch ? videoIdMatch[1] : 'pSPoq13ZHf4';
                    
                    console.log(`Creating player for ${videoId} with YouTube ID: ${youtubeVideoId}`);
                    
                    // Replace iframe with div for YouTube player
                    const playerDiv = document.createElement('div');
                    playerDiv.id = videoId + '_player';
                    iframe.parentNode.replaceChild(playerDiv, iframe);
                    
                    // Create YouTube player
                    const player = new window.YT.Player(playerDiv.id, {
                        height: '400',
                        width: '100%',
                        videoId: youtubeVideoId,
                        playerVars: {
                            'enablejsapi': 1,
                            'origin': window.location.origin
                        },
                        events: {
                            'onReady': (event) => {
                                console.log(`YouTube player ${videoId} ready`);
                                this.startProgressTracking(event.target, index);
                            },
                            'onStateChange': (event) => this.onPlayerStateChange(event, index)
                        }
                    });
                    
                    // Store player reference
                    if (!this.players) this.players = {};
                    this.players[videoId] = player;
                }
            });
        };
        
        initPlayers();
    }

    onPlayerStateChange(event, videoIndex) {
        const videoId = `video${videoIndex}`;
        console.log(`Video ${videoId} state changed:`, event.data);
        
        // Start tracking when video plays
        if (event.data === window.YT.PlayerState.PLAYING) {
            this.startProgressTracking(event.target, videoIndex);
        }
        
        // Stop tracking when video pauses or ends
        if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
            this.stopProgressTracking(videoIndex);
        }
    }

    startProgressTracking(player, videoIndex) {
        const videoId = `video${videoIndex}`;
        
        // Clear any existing interval
        this.stopProgressTracking(videoIndex);
        
        // Initialize intervals object if not exists
        if (!this.progressIntervals) {
            this.progressIntervals = {};
        }
        
        console.log(`Starting progress tracking for ${videoId}`);
        
        // Track progress every 2 seconds
        this.progressIntervals[videoId] = setInterval(() => {
            try {
                if (player.getPlayerState() === window.YT.PlayerState.PLAYING) {
                    const currentTime = player.getCurrentTime();
                    const duration = player.getDuration();
                    
                    if (duration > 0) {
                        const progress = (currentTime / duration) * 100;
                        console.log(`${videoId} progress: ${progress.toFixed(1)}%`);
                        
                        // Auto-complete at 90%
                        if (progress >= 90 && !this.videoProgress[videoId]) {
                            console.log(`${videoId} reached 90%, marking as complete`);
                            this.completeVideo(videoIndex, true);
                            this.stopProgressTracking(videoIndex);
                        }
                    }
                }
            } catch (error) {
                console.error(`Error tracking progress for ${videoId}:`, error);
                this.stopProgressTracking(videoIndex);
            }
        }, 2000);
    }

    stopProgressTracking(videoIndex) {
        const videoId = `video${videoIndex}`;
        if (this.progressIntervals && this.progressIntervals[videoId]) {
            clearInterval(this.progressIntervals[videoId]);
            delete this.progressIntervals[videoId];
            console.log(`Stopped progress tracking for ${videoId}`);
        }
    }

    trackVideoProgress(player, videoIndex) {
        // This method is now replaced by startProgressTracking
        this.startProgressTracking(player, videoIndex);
    }

    completeVideo(videoIndex, isAutomatic = false) {
        const videoId = `video${videoIndex}`;
        const statusEl = document.getElementById(`${videoId}-status`);
        
        if (!this.videoProgress[videoId]) {
            this.videoProgress[videoId] = true;
            statusEl.textContent = 'Completed ✓';
            statusEl.className = 'video-status completed';
            
            // Update progress tracker
            this.updateProgressTracker();
            
            // Update navigation
            this.updateNavigation();
        }
    }

    setupFormSubmission() {
        const form = document.getElementById('certForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleCertificateGeneration();
            });
        }
    }

    setInitialDate() {
        const completionDateInput = document.getElementById('completionDate');
        if (completionDateInput) {
            const today = new Date().toISOString().split('T')[0];
            completionDateInput.value = today;
        }
    }

    updateProgressTracker() {
        const steps = document.querySelectorAll('.progress-step');
        
        steps.forEach((step, index) => {
            const stepData = parseInt(step.dataset.step);
            
            // Mark as completed if:
            // - It's before current step
            // - It's a video step and video is completed
            // - It's the success step and we're on it (final step should be green, not orange)
            let isCompleted = stepData < this.currentStep;
            
            if (stepData === 1 && this.videoProgress.video0) isCompleted = true;
            if (stepData === 2 && this.videoProgress.video1) isCompleted = true;
            if (stepData === 3 && this.videoProgress.video2) isCompleted = true;
            if (stepData === 5 && this.currentStep === 5) isCompleted = true; // Mark success step as completed when reached
            
            // Update classes
            step.classList.remove('active', 'completed');
            if (stepData === this.currentStep && stepData !== 5) {
                // Only show as active if not the final success step
                step.classList.add('active');
            } else if (isCompleted) {
                step.classList.add('completed');
            }
        });
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        // Previous button
        if (this.currentStep === 0) {
            prevBtn.style.visibility = 'hidden';
        } else {
            prevBtn.style.visibility = 'visible';
            prevBtn.disabled = false;
        }
        
        // Next button logic
        let canProceed = false;
        
        switch (this.currentStep) {
            case 0: // Welcome step - hide next button, use primary CTA instead
                nextBtn.style.display = 'none';
                break;
            case 1: // Video 0
                canProceed = this.videoProgress.video0;
                nextBtn.textContent = 'Next Video →';
                nextBtn.style.display = 'block';
                break;
            case 2: // Video 1
                canProceed = this.videoProgress.video1;
                nextBtn.textContent = 'Next →';
                nextBtn.style.display = 'block';
                break;
            case 3: // Video 2
                // For PDF step, check the checkbox state
                const pdfCheckbox = document.getElementById('pdfConfirmation');
                canProceed = pdfCheckbox && pdfCheckbox.checked;
                nextBtn.textContent = 'Complete Training →';
                nextBtn.style.display = 'block';
                break;
            case 4: // Form step
                nextBtn.style.display = 'none'; // Form has its own submit button
                break;
            case 5: // Success step
                nextBtn.style.display = 'none';
                break;
        }
        
        if (this.currentStep > 0 && this.currentStep < 4) {
            nextBtn.disabled = !canProceed;
        }
    }

    goToStep(stepNumber) {
        // Hide current step
        const currentStepEl = document.getElementById(`step-${this.currentStep}`);
        if (currentStepEl) {
            currentStepEl.classList.remove('active');
        }
        // Reset PDF checkbox if leaving or entering step 3
        if (this.currentStep === 3 || stepNumber === 3) {
            const pdfCheckbox = document.getElementById('pdfConfirmation');
            if (pdfCheckbox) pdfCheckbox.checked = false;
            this.videoProgress.video2 = false;
            this.updateNavigation();
        }
        // Update current step
        this.currentStep = stepNumber;
        // Show new step
        const newStepEl = document.getElementById(`step-${this.currentStep}`);
        if (newStepEl) {
            newStepEl.classList.add('active');
        }
        // Update progress tracker and navigation
        this.updateProgressTracker();
        this.updateNavigation();
    }

    canGoToStep(stepNumber) {
        // Can always go back to completed steps
        if (stepNumber < this.currentStep) return true;
        
        // Can only advance if requirements are met
        switch (stepNumber) {
            case 1: return true; // Can always go to first video
            case 2: return this.videoProgress.video0;
            case 3: return this.videoProgress.video1;
            case 4: return this.videoProgress.video2;
            case 5: return false; // Success step only accessible via form submission
            default: return false;
        }
    }

    async handleCertificateGeneration() {
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        // Show loading state
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        submitBtn.disabled = true;
        
        try {
            // Collect form data
            const formData = {
                physicianName: document.getElementById('physicianName').value,
                licenseNumber: document.getElementById('licenseNumber').value,
                institution: document.getElementById('institution').value,
                completionDate: document.getElementById('completionDate').value,
                signature: document.getElementById('signature').value,
                email: document.getElementById('email').value
            };
            
            // Generate PDF
            const pdfBlob = await this.generatePDF(formData);
            
            // Send email with certificate
            await this.sendCertificate(formData, pdfBlob);
            
            // Go to success step
            this.goToStep(5);
            
        } catch (error) {
            console.error('Certificate generation failed:', error);
            alert('There was an error generating your certificate. Please try again.');
            
            // Reset button state
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    // Utility to convert image to base64
    async getBase64Image(imgPath) {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function () {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = imgPath;
        });
    }

    async generatePDF(formData) {
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
        
        // Add company logo at the top using base64
        try {
            const logoBase64 = await this.getBase64Image('assets/logo.png');
            const logoWidth = 80;
            // Create a temporary image to get the aspect ratio
            const tempLogoImg = new window.Image();
            tempLogoImg.src = logoBase64;
            await new Promise((resolve, reject) => {
                tempLogoImg.onload = resolve;
                tempLogoImg.onerror = reject;
            });
            const logoHeight = (tempLogoImg.height * logoWidth) / tempLogoImg.width;
            doc.addImage(logoBase64, 'PNG', margin, 30, logoWidth, logoHeight);
        } catch (error) {
            console.warn('Could not load logo image:', error);
        }
        
        // Header - Left side (moved down to accommodate logo)
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Quick Tube Medical', margin, 120);
        
        // Header - Right side (aligned right)
        doc.setFont(undefined, 'normal');
        const headerLines = [
            'Quick Tube Medical, LLC',
            'Attn: Michael Augustine', 
            '3049 Kingston Pike',
            'Knoxville, TN. 37917'
        ];
        
        let yPos = 120;
        headerLines.forEach(line => {
            const textWidth = doc.getTextWidth(line);
            doc.text(line, pageWidth - margin - textWidth, yPos);
            yPos += 12;
        });
        
        // Contact info (right aligned, with spacing)
        yPos += 8;
        doc.text('maugustine@quicktubemedical.com', pageWidth - margin - doc.getTextWidth('maugustine@quicktubemedical.com'), yPos);
        yPos += 12;
        doc.text('(763) 442-1848', pageWidth - margin - doc.getTextWidth('(763) 442-1848'), yPos);
        
        // Title (centered)
        yPos = 230;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        const title = 'Quick Tube Chest Tube Training Certification Form';
        const titleWidth = doc.getTextWidth(title);
        doc.text(title, (pageWidth - titleWidth) / 2, yPos);
        
        // Main description paragraph
        yPos += 25;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const description = 'This certification form confirms that the undersigned healthcare professional has completed the required training for the safe and effective use of the Quick Tube Chest Tube, a medical device designed to treat pneumothorax, manufactured by Quick Tube Medical, LLC.';
        
        const descLines = doc.splitTextToSize(description, contentWidth);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 12 + 15;
        
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
        
        yPos += 30;
        
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
        
        yPos += 35;
        
        // Training Requirements section
        doc.setFont(undefined, 'bold');
        doc.text('Training Requirements Completed:', margin, yPos);
        doc.setFont(undefined, 'normal');
        doc.text('By signing below, I certify that I have:', margin + 200, yPos);
        yPos += 18;
        
        // Training requirements (as paragraph text)
        const requirements = [
            'Read and understood the Instructions for Use (IFU) for the Quick Tube Chest Tube, available on the Quick Tube Medical website. quicktubemedical.com',
            'Watched all instructional videos demonstrating the proper deployment and use of the Quick Tube Chest Tube, as provided on the Quick Tube Medical website.',
            'Understood the unique placement technique for the Quick Tube Chest Tube, which differs from traditional chest tube placement methods.'
        ];
        
        requirements.forEach(req => {
            const reqLines = doc.splitTextToSize(req, contentWidth);
            doc.text(reqLines, margin, yPos);
            yPos += reqLines.length * 12 + 6;
        });
        
        yPos += 12;
        
        // Acknowledgment paragraph
        const acknowledgment = 'I acknowledge that I am responsible for applying the training and IFU guidelines correctly during the placement and use of the Quick Tube Chest Tube. I confirm that I have the necessary skills, knowledge, and clinical judgment to use the device safely and effectively in accordance with its intended purpose.';
        
        const ackLines = doc.splitTextToSize(acknowledgment, contentWidth);
        doc.text(ackLines, margin, yPos);
        yPos += ackLines.length * 12 + 16;
        
        // Indemnification section
        doc.setFont(undefined, 'bold');
        doc.text('Indemnification:', margin, yPos);
        yPos += 14;
        
        doc.setFont(undefined, 'normal');
        const indemnification = 'I agree that Quick Tube Medical shall not be held liable for any adverse outcomes, complications, or damages arising from my use or misuse of the Quick Tube Chest Tube, including but not limited to improper placement, failure to follow the IFU, or deviations from the training provided. I hereby indemnify and hold harmless Quick Tube Medical, its officers, employees, and affiliates from any claims, liabilities, or legal actions resulting from my actions or omissions during the use of the Quick Tube Chest Tube, provided that such use is not due to a defect in the device itself as determined by applicable regulatory standards.';
        
        const indemnLines = doc.splitTextToSize(indemnification, contentWidth);
        doc.text(indemnLines, margin, yPos);
        yPos += indemnLines.length * 12 + 25;
        
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
        
        yPos += 35;
        
        // Add doctor's signature image and name using base64
        try {
            const signatureBase64 = await this.getBase64Image('assets/signature.png');
            const sigImgWidth = 60;
            // Create a temporary image to get the aspect ratio
            const tempSigImg = new window.Image();
            tempSigImg.src = signatureBase64;
            await new Promise((resolve, reject) => {
                tempSigImg.onload = resolve;
                tempSigImg.onerror = reject;
            });
            const sigImgHeight = (tempSigImg.height * sigImgWidth) / tempSigImg.width;
            doc.addImage(signatureBase64, 'PNG', margin, yPos, sigImgWidth, sigImgHeight);
            yPos += sigImgHeight + 5;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text('Allen C. Smith, MD', margin, yPos);
            yPos += 20;
        } catch (error) {
            console.warn('Could not load signature image:', error);
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text('Allen C. Smith, MD', margin, yPos);
            yPos += 20;
        }
        
        // Note section
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Note:', margin, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 12;
        
        const note = 'This certification does not replace any institutional or regulatory requirements for credentialing or privileging to perform chest tube placement procedures.';
        const noteLines = doc.splitTextToSize(note, contentWidth);
        doc.text(noteLines, margin, yPos);
        
        // Return as blob (not base64 string like the old version)
        return doc.output('blob');
    }

    async sendCertificate(formData, pdfBlob) {
        // Convert blob to base64
        const reader = new FileReader();
        const pdfBase64 = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(pdfBlob);
        });
        
        // Determine API endpoint based on environment
        const apiUrl = window.location.hostname === 'localhost' 
            ? '/api/generate-certificate'
            : '/.netlify/functions/send-certificate'; // Use the actual function
        
        console.log('Sending to API URL:', apiUrl);
        console.log('Form data:', formData);
        
        try {
            // Send via appropriate endpoint
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    formData: formData,
                    pdfBase64: pdfBase64
                })
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                
                // Try to parse as JSON, fallback to text
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { message: errorText || `Server error: ${response.status}` };
                }
                
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Success result:', result);
            
        } catch (error) {
            console.error('Certificate sending failed:', error);
            
            // Provide more specific error messages
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
            } else if (error.message.includes('404')) {
                throw new Error('Service unavailable: The certificate service is not properly configured. Please contact support.');
            } else {
                throw error;
            }
        }
    }

    setupBreadcrumbNavigation() {
        const progressSteps = document.querySelectorAll('.progress-step');
        
        progressSteps.forEach((step, index) => {
            step.addEventListener('click', () => {
                const stepNumber = parseInt(step.dataset.step);
                
                // Only allow clicking on completed steps or current step
                if (this.canClickStep(stepNumber)) {
                    this.goToStep(stepNumber);
                }
            });
        });
    }

    canClickStep(stepNumber) {
        // Can always click on welcome step
        if (stepNumber === 0) return true;
        
        // Can click on current step
        if (stepNumber === this.currentStep) return true;
        
        // Can click on completed video steps
        if (stepNumber === 1 && this.videoProgress.video0) return true;
        if (stepNumber === 2 && this.videoProgress.video1) return true;
        if (stepNumber === 3 && this.videoProgress.video2) return true;
        
        // Can click on form step if all videos completed
        if (stepNumber === 4 && this.videoProgress.video0 && this.videoProgress.video1 && this.videoProgress.video2) return true;
        
        // Cannot click on success step - only reachable via form submission
        return false;
    }

    setupHamburgerMenu() {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');
        
        if (hamburger && navLinks) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navLinks.classList.toggle('active');
            });
            
            // Close menu when clicking on nav links
            const links = navLinks.querySelectorAll('.nav-link');
            links.forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                });
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (event) => {
                if (!hamburger.contains(event.target) && !navLinks.contains(event.target)) {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                }
            });
        }
    }

    handlePdfConfirmation(checkbox) {
        this.videoProgress.video2 = checkbox.checked;
        this.updateNavigation();
    }
}

// Global functions for HTML onclick handlers
function startCertification() {
    app.goToStep(1);
}

function goToNextStep() {
    const nextStep = app.currentStep + 1;
    if (nextStep < app.totalSteps && app.canGoToStep(nextStep)) {
        app.goToStep(nextStep);
    }
}

function goToPreviousStep() {
    if (app.currentStep > 0) {
        app.goToStep(app.currentStep - 1);
    }
}

// Print certificate function
function printCertificate() {
    // Get the form data from the current form
    const formData = {
        physicianName: document.getElementById('physicianName').value,
        licenseNumber: document.getElementById('licenseNumber').value,
        institution: document.getElementById('institution').value,
        completionDate: document.getElementById('completionDate').value,
        signature: document.getElementById('signature').value,
        email: document.getElementById('email').value
    };
    
    // Generate PDF and open print dialog
    app.generatePDF(formData).then(pdfBlob => {
        const url = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(url, '_blank');
        
        printWindow.onload = function() {
            printWindow.print();
        };
        
        // Clean up the URL after printing
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    }).catch(error => {
        console.error('Error generating certificate for printing:', error);
        alert('There was an error generating the certificate for printing. Please try again.');
    });
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CertificationApp();
    window.handlePdfConfirmation = function(checkbox) {
        app.handlePdfConfirmation(checkbox);
    };
});

// Global YouTube API ready callback
window.onYouTubeIframeAPIReady = function() {
    console.log('YouTube API loaded globally');
    if (app) {
        app.setupVideoTracking();
    }
}; 