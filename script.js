class SpeedReader {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.canvas = document.getElementById('pdfCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.guidingPoint = document.getElementById('guidingPoint');

        // Settings
        this.settings = {
            speed: 300, // WPM
            pattern: 'linear',
            cycles: 3,
            pointSize: 15,
            pointColor: '#ff0000',
            fixationDistance: 3, // words between fixations
            chunkSize: 4, // words per chunk
            pointSpeed: 0.3, // point speed multiplier (much slower default)
            startPosition: 0, // start position percentage
            endPosition: 100, // end position percentage
            patternStretch: 1.0 // pattern stretch/compression multiplier
        };

        // Visual elements for advanced patterns
        this.chunkHighlight = document.getElementById('chunkHighlight');
        this.fixationContainer = document.getElementById('fixationPoints');

        // Training modules
        this.eyeTraining = new EyeTraining();
        this.schulteTraining = new SchulteTraining();

        // Animation state
        this.isPlaying = false;
        this.animationId = null;
        this.currentPosition = { x: 0, y: 0 };
        this.pathPoints = [];
        this.currentPointIndex = 0;

        this.initializeEventListeners();
        this.initializePDFJS();
    }

    initializePDFJS() {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    initializeEventListeners() {
        // Settings panel toggle
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsPanel = document.getElementById('settingsPanel');

        settingsBtn.addEventListener('click', () => {
            settingsPanel.classList.toggle('open');
        });

        // Close settings panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
                settingsPanel.classList.remove('open');
            }
        });

        // Settings controls
        this.initializeSettingsControls();

        // PDF upload
        this.initializePDFUpload();

        // Control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());

        // Page navigation
        document.getElementById('prevPageBtn').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPageBtn').addEventListener('click', () => this.nextPage());

        // Training modules
        document.getElementById('eyeTrainingBtn').addEventListener('click', () => this.eyeTraining.show());
        document.getElementById('schulteBtn').addEventListener('click', () => this.schulteTraining.show());

        // Floating controls
        document.getElementById('floatingStartBtn').addEventListener('click', () => this.start());
        document.getElementById('floatingPauseBtn').addEventListener('click', () => this.pause());
    }

    initializeSettingsControls() {
        // Speed control
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');

        speedSlider.addEventListener('input', (e) => {
            this.settings.speed = parseInt(e.target.value);
            speedValue.textContent = this.settings.speed;
        });

        // Point speed control
        const pointSpeedSlider = document.getElementById('pointSpeedSlider');
        const pointSpeedValue = document.getElementById('pointSpeedValue');

        pointSpeedSlider.addEventListener('input', (e) => {
            this.settings.pointSpeed = parseFloat(e.target.value);
            pointSpeedValue.textContent = this.settings.pointSpeed.toFixed(2);
        });

        // Start position control
        const startPositionSlider = document.getElementById('startPositionSlider');
        const startPositionValue = document.getElementById('startPositionValue');

        startPositionSlider.addEventListener('input', (e) => {
            this.settings.startPosition = parseInt(e.target.value);
            startPositionValue.textContent = this.settings.startPosition;
            this.updateProgressIndicator();
            this.generatePath();
        });

        // End position control
        const endPositionSlider = document.getElementById('endPositionSlider');
        const endPositionValue = document.getElementById('endPositionValue');

        endPositionSlider.addEventListener('input', (e) => {
            this.settings.endPosition = parseInt(e.target.value);
            endPositionValue.textContent = this.settings.endPosition;

            // Ensure end is always after start
            if (this.settings.endPosition <= this.settings.startPosition) {
                this.settings.endPosition = this.settings.startPosition + 20;
                endPositionSlider.value = this.settings.endPosition;
                endPositionValue.textContent = this.settings.endPosition;
            }

            this.updateProgressIndicator();
            this.generatePath();
        });

        // Pattern stretch control
        const patternStretchSlider = document.getElementById('patternStretchSlider');
        const patternStretchValue = document.getElementById('patternStretchValue');

        patternStretchSlider.addEventListener('input', (e) => {
            this.settings.patternStretch = parseFloat(e.target.value);
            patternStretchValue.textContent = this.settings.patternStretch.toFixed(1);
            this.generatePath();
        });

        // Pattern selection
        const patternSelect = document.getElementById('patternSelect');
        patternSelect.addEventListener('change', (e) => {
            this.settings.pattern = e.target.value;
            this.generatePath();
        });

        // Cycles control
        const cyclesSlider = document.getElementById('cyclesSlider');
        const cyclesValue = document.getElementById('cyclesValue');

        cyclesSlider.addEventListener('input', (e) => {
            this.settings.cycles = parseInt(e.target.value);
            cyclesValue.textContent = this.settings.cycles;
            this.generatePath();
        });

        // Point size control
        const pointSizeSlider = document.getElementById('pointSizeSlider');
        const pointSizeValue = document.getElementById('pointSizeValue');

        pointSizeSlider.addEventListener('input', (e) => {
            this.settings.pointSize = parseInt(e.target.value);
            pointSizeValue.textContent = this.settings.pointSize;
            this.updatePointAppearance();
        });

        // Point color control
        const pointColorPicker = document.getElementById('pointColorPicker');
        pointColorPicker.addEventListener('change', (e) => {
            this.settings.pointColor = e.target.value;
            this.updatePointAppearance();
        });

        // Fixation distance control
        const fixationDistanceSlider = document.getElementById('fixationDistanceSlider');
        const fixationDistanceValue = document.getElementById('fixationDistanceValue');

        fixationDistanceSlider.addEventListener('input', (e) => {
            this.settings.fixationDistance = parseInt(e.target.value);
            fixationDistanceValue.textContent = this.settings.fixationDistance;
            this.generatePath();
        });

        // Chunk size control
        const chunkSizeSlider = document.getElementById('chunkSizeSlider');
        const chunkSizeValue = document.getElementById('chunkSizeValue');

        chunkSizeSlider.addEventListener('input', (e) => {
            this.settings.chunkSize = parseInt(e.target.value);
            chunkSizeValue.textContent = this.settings.chunkSize;
            this.generatePath();
        });
    }

    initializePDFUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const pdfInput = document.getElementById('pdfInput');

        uploadArea.addEventListener('click', () => {
            pdfInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                this.loadPDF(files[0]);
            }
        });

        pdfInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type === 'application/pdf') {
                this.loadPDF(file);
            }
        });
    }

    async loadPDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;

            await this.renderPage(1);

            // Hide upload area and show PDF viewer
            document.getElementById('uploadArea').classList.add('hidden');
            document.getElementById('pdfViewer').classList.add('visible');
            document.getElementById('pageNavigation').classList.add('visible');

            this.updatePageInfo();
            this.updateProgressIndicator();
            this.generatePath();
        } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Fehler beim Laden der PDF-Datei');
        }
    }

    async renderPage(pageNum) {
        const page = await this.pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });

        // Calculate scale to fill the entire screen with high resolution
        const scaleX = window.innerWidth / viewport.width;
        const scaleY = window.innerHeight / viewport.height;
        const scale = Math.max(scaleX, scaleY) * 2.5; // Much higher resolution + fill screen

        const scaledViewport = page.getViewport({ scale });

        this.canvas.width = scaledViewport.width;
        this.canvas.height = scaledViewport.height;

        // Remove any positioning - let flexbox handle centering
        this.canvas.style.left = '';
        this.canvas.style.top = '';

        const renderContext = {
            canvasContext: this.ctx,
            viewport: scaledViewport
        };

        await page.render(renderContext).promise;
    }

    generatePath() {
        if (!this.canvas) return;

        const canvasRect = this.canvas.getBoundingClientRect();
        const margin = 50;

        // Calculate actual reading area based on start/end position settings
        const totalWidth = canvasRect.width - (margin * 2);
        const totalHeight = canvasRect.height - (margin * 2);

        const startXOffset = (this.settings.startPosition / 100) * totalWidth;
        const endXOffset = (this.settings.endPosition / 100) * totalWidth;

        const startX = canvasRect.left + margin + startXOffset;
        const endX = canvasRect.left + margin + endXOffset;
        const startY = canvasRect.top + margin;
        const endY = canvasRect.bottom - margin;

        this.pathPoints = [];

        switch (this.settings.pattern) {
            case 'linear':
                this.generateLinearPath(startX, startY, endX, endY);
                break;
            case 'bookpattern1':
                this.generateBookPattern1(startX, startY, endX, endY);
                break;
            case 'bookpattern2':
                this.generateBookPattern2(startX, startY, endX, endY);
                break;
            case 'bookpattern3':
                this.generateBookPattern3(startX, startY, endX, endY);
                break;
            case 'bookpattern4':
                this.generateBookPattern4(startX, startY, endX, endY);
                break;
            case 'bookpattern5':
                this.generateBookPattern5(startX, startY, endX, endY);
                break;
            case 'bookpattern6':
                this.generateBookPattern6(startX, startY, endX, endY);
                break;
            case 'scurve':
                this.generateSCurvePath(startX, startY, endX, endY);
                break;
            case 'serpentine':
                this.generateSerpentinePath(startX, startY, endX, endY);
                break;
            case 'horizontalscan':
                this.generateHorizontalScanPath(startX, startY, endX, endY);
                break;
            case 'diagonalzigzag':
                this.generateDiagonalZigzagPath(startX, startY, endX, endY);
                break;
            case 'multicolumn':
                this.generateMultiColumnPath(startX, startY, endX, endY);
                break;
            case 'zigzag':
                this.generateZigzagPath(startX, startY, endX, endY);
                break;
            case 'spiral':
                this.generateSpiralPath(startX, startY, endX, endY);
                break;
            case 'chunking':
                this.generateChunkingPath(startX, startY, endX, endY);
                break;
            case 'metaguiding':
                this.generateMetaGuidingPath(startX, startY, endX, endY);
                break;
            case 'fixationreduction':
                this.generateFixationReductionPath(startX, startY, endX, endY);
                break;
            case 'peripheral':
                this.generatePeripheralVisionPath(startX, startY, endX, endY);
                break;
            case 'schulte':
                this.generateSchultePatternPath(startX, startY, endX, endY);
                break;
        }
    }

    generateLinearPath(startX, startY, endX, endY) {
        const lineHeight = 30;
        const pointsPerLine = 100; // Extrem viele Punkte für ultra-glatte Bewegung

        for (let y = startY; y <= endY; y += lineHeight) {
            for (let i = 0; i <= pointsPerLine; i++) {
                const x = startX + (endX - startX) * (i / pointsPerLine);
                this.pathPoints.push({ x, y });
            }
        }
    }

    generateZigzagPath(startX, startY, endX, endY) {
        const lineHeight = 30;
        const pointsPerLine = 20;
        const zigzagHeight = 15;

        for (let y = startY; y <= endY; y += lineHeight) {
            for (let i = 0; i <= pointsPerLine; i++) {
                const progress = i / pointsPerLine;
                const x = startX + (endX - startX) * progress;
                const zigzagY = Math.sin(progress * Math.PI * 2 * this.settings.cycles) * zigzagHeight;

                this.pathPoints.push({
                    x: x,
                    y: y + zigzagY
                });
            }
        }
    }

    generateSpiralPath(startX, startY, endX, endY) {
        const lineHeight = 30;
        const pointsPerLine = 20;
        const spiralAmplitude = 30;

        for (let y = startY; y <= endY; y += lineHeight) {
            const lineProgress = (y - startY) / (endY - startY);

            for (let i = 0; i <= pointsPerLine; i++) {
                const progress = i / pointsPerLine;
                const angle = progress * Math.PI * 2 * this.settings.cycles + lineProgress * Math.PI * 2;
                const spiralX = Math.sin(angle) * spiralAmplitude * (1 - lineProgress * 0.5);

                const x = startX + (endX - startX) * progress + spiralX;

                this.pathPoints.push({
                    x: x,
                    y: y
                });
            }
        }
    }

    updatePointAppearance() {
        this.guidingPoint.style.width = `${this.settings.pointSize}px`;
        this.guidingPoint.style.height = `${this.settings.pointSize}px`;
        this.guidingPoint.style.backgroundColor = this.settings.pointColor;
        this.guidingPoint.style.boxShadow = `0 0 10px ${this.settings.pointColor}80`;
    }

    start() {
        if (!this.pathPoints.length) {
            alert('Bitte laden Sie zuerst eine PDF-Datei');
            return;
        }

        this.isPlaying = true;
        this.guidingPoint.classList.add('active');
        this.animate();

        // Update button states
        document.getElementById('startBtn').classList.add('active');
        document.getElementById('pauseBtn').classList.remove('active');
        document.getElementById('floatingStartBtn').classList.add('active');
        document.getElementById('floatingPauseBtn').classList.remove('active');
    }

    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Update button states
        document.getElementById('startBtn').classList.remove('active');
        document.getElementById('pauseBtn').classList.add('active');
        document.getElementById('floatingStartBtn').classList.remove('active');
        document.getElementById('floatingPauseBtn').classList.add('active');
    }

    reset() {
        this.pause();
        this.currentPointIndex = 0;
        this.guidingPoint.classList.remove('active');

        // Update button states
        document.getElementById('startBtn').classList.remove('active');
        document.getElementById('pauseBtn').classList.remove('active');
        document.getElementById('floatingStartBtn').classList.remove('active');
        document.getElementById('floatingPauseBtn').classList.remove('active');
    }

    animate() {
        if (!this.isPlaying || this.currentPointIndex >= this.pathPoints.length) {
            this.reset();
            return;
        }

        const point = this.pathPoints[this.currentPointIndex];

        // Handle different pattern types with specialized animations
        this.handlePatternSpecificAnimation(point);

        // Position the main guiding point
        this.guidingPoint.style.left = `${point.x - this.settings.pointSize / 2}px`;
        this.guidingPoint.style.top = `${point.y - this.settings.pointSize / 2}px`;

        this.currentPointIndex++;

        // Calculate delay based on WPM and point speed multiplier (faster for smooth movement)
        let delay = (60000 / this.settings.speed / 8) / this.settings.pointSpeed;

        // Pattern-specific delay adjustments
        if (point.duration) {
            delay = point.duration / this.settings.pointSpeed;
        }

        setTimeout(() => {
            this.animationId = requestAnimationFrame(() => this.animate());
        }, delay);
    }

    handlePatternSpecificAnimation(point) {
        // Clear previous visualizations
        this.chunkHighlight.classList.remove('active');
        this.clearFixationPoints();

        switch (this.settings.pattern) {
            case 'horizontalscan':
                this.showHorizontalScanEffect(point);
                break;
            case 'chunking':
                this.showChunkHighlight(point);
                break;
            case 'fixationreduction':
                this.showFixationPoint(point);
                break;
            case 'peripheral':
                this.showPeripheralFocus(point);
                break;
            case 'metaguiding':
                this.showMetaGuidingEffect(point);
                break;
            case 'schulte':
                this.showSchulteEffect(point);
                break;
            // No extra effects for book patterns and others - keep clean
        }
    }

    showChunkHighlight(point) {
        if (point.isChunk) {
            const chunkWidth = 120; // Approximate chunk width
            const chunkHeight = 25;

            this.chunkHighlight.style.left = `${point.x - chunkWidth/2}px`;
            this.chunkHighlight.style.top = `${point.y - chunkHeight/2}px`;
            this.chunkHighlight.style.width = `${chunkWidth}px`;
            this.chunkHighlight.style.height = `${chunkHeight}px`;
            this.chunkHighlight.classList.add('active');
        }
    }

    showFixationPoint(point) {
        if (point.isFixation) {
            const fixationPoint = document.createElement('div');
            fixationPoint.className = 'fixation-point';
            fixationPoint.style.left = `${point.x - 4}px`;
            fixationPoint.style.top = `${point.y - 4}px`;

            this.fixationContainer.appendChild(fixationPoint);

            // Remove after animation
            setTimeout(() => {
                if (fixationPoint.parentNode) {
                    fixationPoint.parentNode.removeChild(fixationPoint);
                }
            }, 1000);
        }
    }

    showPeripheralFocus(point) {
        if (point.isPeripheral) {
            // Create peripheral vision indicator
            const peripheralIndicator = document.createElement('div');
            peripheralIndicator.className = 'peripheral-indicator';
            peripheralIndicator.style.left = `${point.x - point.focusWidth/2}px`;
            peripheralIndicator.style.top = `${point.y - 15}px`;
            peripheralIndicator.style.width = `${point.focusWidth}px`;
            peripheralIndicator.style.height = '30px';
            peripheralIndicator.style.background = 'rgba(0, 255, 255, 0.2)';
            peripheralIndicator.style.border = '2px solid #00ffff';
            peripheralIndicator.style.position = 'absolute';
            peripheralIndicator.style.borderRadius = '15px';

            this.fixationContainer.appendChild(peripheralIndicator);

            setTimeout(() => {
                if (peripheralIndicator.parentNode) {
                    peripheralIndicator.parentNode.removeChild(peripheralIndicator);
                }
            }, 800);
        }
    }

    showMetaGuidingEffect(point) {
        // Create trailing effect for meta-guiding
        const trail = document.createElement('div');
        trail.className = 'meta-guide-trail';
        trail.style.left = `${point.x - 3}px`;
        trail.style.top = `${point.y - 3}px`;
        trail.style.width = '6px';
        trail.style.height = '6px';
        trail.style.background = this.settings.pointColor;
        trail.style.borderRadius = '50%';
        trail.style.position = 'absolute';
        trail.style.opacity = '0.6';
        trail.style.transition = 'opacity 1s ease-out';

        this.fixationContainer.appendChild(trail);

        setTimeout(() => {
            trail.style.opacity = '0';
        }, 50);

        setTimeout(() => {
            if (trail.parentNode) {
                trail.parentNode.removeChild(trail);
            }
        }, 1000);
    }

    showSchulteEffect(point) {
        // Pulsing effect for Schulte pattern
        this.guidingPoint.style.transform = 'scale(1.5)';
        setTimeout(() => {
            this.guidingPoint.style.transform = 'scale(1.0)';
        }, 300);
    }

    // Professional Pattern Effects

    showSCurveEffect(point) {
        if (point.isScurve) {
            // Create S-curve trail effect
            const trail = document.createElement('div');
            trail.style.position = 'absolute';
            trail.style.width = '8px';
            trail.style.height = '8px';
            trail.style.background = 'rgba(255, 100, 255, 0.7)';
            trail.style.borderRadius = '50%';
            trail.style.left = `${point.x - 4}px`;
            trail.style.top = `${point.y - 4}px`;
            trail.style.boxShadow = '0 0 10px rgba(255, 100, 255, 0.8)';
            trail.style.transition = 'opacity 1.5s ease-out';

            this.fixationContainer.appendChild(trail);

            setTimeout(() => trail.style.opacity = '0', 100);
            setTimeout(() => {
                if (trail.parentNode) trail.parentNode.removeChild(trail);
            }, 1500);
        }
    }

    showSerpentineEffect(point) {
        if (point.isSerpentine) {
            // Wave trail effect
            const wave = document.createElement('div');
            wave.style.position = 'absolute';
            wave.style.width = '6px';
            wave.style.height = '6px';
            wave.style.background = 'rgba(100, 255, 100, 0.8)';
            wave.style.borderRadius = '50%';
            wave.style.left = `${point.x - 3}px`;
            wave.style.top = `${point.y - 3}px`;
            wave.style.boxShadow = '0 0 8px rgba(100, 255, 100, 0.6)';

            this.fixationContainer.appendChild(wave);

            setTimeout(() => {
                if (wave.parentNode) wave.parentNode.removeChild(wave);
            }, 1200);
        }
    }

    showHorizontalScanEffect(point) {
        if (point.isHorizontalScan) {
            // Horizontal scan line effect
            const scanLine = document.createElement('div');
            scanLine.style.position = 'absolute';
            scanLine.style.width = '40px';
            scanLine.style.height = '2px';
            scanLine.style.background = 'rgba(255, 200, 0, 0.8)';
            scanLine.style.left = `${point.x - 20}px`;
            scanLine.style.top = `${point.y - 1}px`;
            scanLine.style.borderRadius = '1px';

            this.fixationContainer.appendChild(scanLine);

            setTimeout(() => {
                if (scanLine.parentNode) scanLine.parentNode.removeChild(scanLine);
            }, 800);
        }
    }

    showDiagonalZigzagEffect(point) {
        if (point.isDiagonalZigzag) {
            // Diagonal trail effect
            const diagonal = document.createElement('div');
            diagonal.style.position = 'absolute';
            diagonal.style.width = '10px';
            diagonal.style.height = '10px';
            diagonal.style.background = 'rgba(200, 100, 255, 0.7)';
            diagonal.style.borderRadius = '2px';
            diagonal.style.left = `${point.x - 5}px`;
            diagonal.style.top = `${point.y - 5}px`;
            diagonal.style.transform = 'rotate(45deg)';
            diagonal.style.boxShadow = '0 0 8px rgba(200, 100, 255, 0.5)';

            this.fixationContainer.appendChild(diagonal);

            setTimeout(() => {
                if (diagonal.parentNode) diagonal.parentNode.removeChild(diagonal);
            }, 1000);
        }
    }

    showMultiColumnEffect(point) {
        if (point.isMultiColumn) {
            // Column indicator
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1'];
            const columnIndicator = document.createElement('div');
            columnIndicator.style.position = 'absolute';
            columnIndicator.style.width = '12px';
            columnIndicator.style.height = '12px';
            columnIndicator.style.background = colors[point.column % colors.length];
            columnIndicator.style.borderRadius = '3px';
            columnIndicator.style.left = `${point.x - 6}px`;
            columnIndicator.style.top = `${point.y - 6}px`;
            columnIndicator.style.opacity = '0.8';
            columnIndicator.style.boxShadow = `0 0 8px ${colors[point.column % colors.length]}`;

            this.fixationContainer.appendChild(columnIndicator);

            setTimeout(() => {
                if (columnIndicator.parentNode) columnIndicator.parentNode.removeChild(columnIndicator);
            }, 900);
        }
    }

    clearFixationPoints() {
        // Clear all dynamic elements
        const dynamicElements = this.fixationContainer.querySelectorAll('.fixation-point, .peripheral-indicator, .meta-guide-trail');
        dynamicElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
    }

    updatePageInfo() {
        if (!this.pdfDoc) return;

        document.getElementById('currentPage').textContent = this.currentPage;
        document.getElementById('totalPages').textContent = this.pdfDoc.numPages;

        // Update button states
        document.getElementById('prevPageBtn').disabled = this.currentPage <= 1;
        document.getElementById('nextPageBtn').disabled = this.currentPage >= this.pdfDoc.numPages;
    }

    async previousPage() {
        if (this.currentPage <= 1) return;

        this.pause();
        this.currentPage--;
        await this.renderPage(this.currentPage);
        this.updatePageInfo();
        this.generatePath();
    }

    async nextPage() {
        if (!this.pdfDoc || this.currentPage >= this.pdfDoc.numPages) return;

        this.pause();
        this.currentPage++;
        await this.renderPage(this.currentPage);
        this.updatePageInfo();
        this.generatePath();
    }

    updateProgressIndicator() {
        const progressFill = document.getElementById('progressIndicator');
        if (progressFill) {
            const range = this.settings.endPosition - this.settings.startPosition;
            progressFill.style.width = `${range}%`;
            progressFill.style.marginLeft = `${this.settings.startPosition}%`;
        }
    }

    // Advanced Speed Reading Patterns
    generateChunkingPath(startX, startY, endX, endY) {
        const lineHeight = 35;
        const wordsPerLine = 12;
        const chunkSize = this.settings.chunkSize;

        for (let y = startY; y <= endY; y += lineHeight) {
            for (let chunk = 0; chunk < wordsPerLine; chunk += chunkSize) {
                const chunkCenter = startX + (endX - startX) * ((chunk + chunkSize/2) / wordsPerLine);
                this.pathPoints.push({ x: chunkCenter, y, isChunk: true, chunkSize: chunkSize });
            }
        }
    }

    generateMetaGuidingPath(startX, startY, endX, endY) {
        const lineHeight = 32;
        const pointsPerLine = 8;

        for (let y = startY; y <= endY; y += lineHeight) {
            // Smooth S-curve meta-guiding pattern
            for (let i = 0; i <= pointsPerLine; i++) {
                const progress = i / pointsPerLine;
                const x = startX + (endX - startX) * progress;
                const curve = Math.sin(progress * Math.PI) * 10;
                this.pathPoints.push({ x: x + curve, y: y + curve * 0.2 });
            }
        }
    }

    generateFixationReductionPath(startX, startY, endX, endY) {
        const lineHeight = 40;
        const fixationDistance = this.settings.fixationDistance;

        for (let y = startY; y <= endY; y += lineHeight) {
            const totalWidth = endX - startX;
            const fixations = Math.floor(totalWidth / (fixationDistance * 50)); // 50px per word approximation

            for (let i = 0; i <= fixations; i++) {
                const x = startX + (totalWidth * i / fixations);
                this.pathPoints.push({
                    x,
                    y,
                    isFixation: true,
                    duration: 200 // longer pause at fixation points
                });
            }
        }
    }

    generatePeripheralVisionPath(startX, startY, endX, endY) {
        const lineHeight = 45;
        const centerOffset = (endX - startX) * 0.3;

        for (let y = startY; y <= endY; y += lineHeight) {
            // Left peripheral focus
            this.pathPoints.push({
                x: startX + centerOffset,
                y,
                isPeripheral: true,
                focusWidth: centerOffset * 2
            });

            // Right peripheral focus
            this.pathPoints.push({
                x: endX - centerOffset,
                y,
                isPeripheral: true,
                focusWidth: centerOffset * 2
            });
        }
    }

    generateSchultePatternPath(startX, startY, endX, endY) {
        const gridSize = 5;
        const cellWidth = (endX - startX) / gridSize;
        const cellHeight = (endY - startY) / gridSize;

        // Random order like Schulte table
        const positions = [];
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                positions.push({
                    x: startX + (j * cellWidth) + (cellWidth / 2),
                    y: startY + (i * cellHeight) + (cellHeight / 2),
                    order: positions.length + 1
                });
            }
        }

        // Shuffle positions for Schulte-style training
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        this.pathPoints = positions;
    }

    // Professional Speed Reading Patterns from Book

    generateSCurvePath(startX, startY, endX, endY) {
        const lineHeight = 35;
        const pointsPerLine = 25;
        const curveIntensity = 40;

        for (let y = startY; y <= endY; y += lineHeight) {
            const lineProgress = (y - startY) / (endY - startY);

            for (let i = 0; i <= pointsPerLine; i++) {
                const progress = i / pointsPerLine;
                const x = startX + (endX - startX) * progress;

                // S-curve formula - creates smooth S curves like in the book
                const sCurve = Math.sin(progress * Math.PI * 2 * this.settings.cycles) * curveIntensity;
                const damping = Math.sin(progress * Math.PI); // Damping at line ends

                this.pathPoints.push({
                    x: x + sCurve * damping,
                    y: y + sCurve * 0.2,
                    isScurve: true
                });
            }
        }
    }

    generateSerpentinePath(startX, startY, endX, endY) {
        const lineHeight = 30;
        const pointsPerLine = 30;
        const waveHeight = 25;

        for (let y = startY; y <= endY; y += lineHeight) {
            for (let i = 0; i <= pointsPerLine; i++) {
                const progress = i / pointsPerLine;
                const x = startX + (endX - startX) * progress;

                // Serpentine wave pattern - continuous flowing motion
                const wave = Math.sin(progress * Math.PI * 6) * waveHeight * Math.sin(progress * Math.PI);

                this.pathPoints.push({
                    x: x,
                    y: y + wave,
                    isSerpentine: true
                });
            }
        }
    }

    generateHorizontalScanPath(startX, startY, endX, endY) {
        const scanLines = 8; // Number of horizontal scan lines
        const scanHeight = (endY - startY) / scanLines;
        const pointsPerScan = 15;

        for (let scan = 0; scan <= scanLines; scan++) {
            const y = startY + scan * scanHeight;

            // Alternate direction for each scan line
            const reverse = scan % 2 === 1;

            for (let i = 0; i <= pointsPerScan; i++) {
                const progress = reverse ? (pointsPerScan - i) / pointsPerScan : i / pointsPerScan;
                const x = startX + (endX - startX) * progress;

                this.pathPoints.push({
                    x,
                    y,
                    isHorizontalScan: true,
                    scanLine: scan
                });
            }
        }
    }

    generateDiagonalZigzagPath(startX, startY, endX, endY) {
        const diagonalLines = 6;
        const pointsPerDiagonal = 20;

        // Create diagonal zigzag pattern like in the book
        for (let diag = 0; diag < diagonalLines; diag++) {
            const isDownward = diag % 2 === 0;

            for (let i = 0; i <= pointsPerDiagonal; i++) {
                const progress = i / pointsPerDiagonal;

                let x, y;
                if (isDownward) {
                    // Diagonal down-right
                    x = startX + (endX - startX) * progress;
                    y = startY + (endY - startY) * progress;
                } else {
                    // Diagonal down-left
                    x = endX - (endX - startX) * progress;
                    y = startY + (endY - startY) * progress;
                }

                // Add zigzag offset
                const zigzagOffset = Math.sin(progress * Math.PI * 8) * 15;

                this.pathPoints.push({
                    x: x + zigzagOffset,
                    y: y + zigzagOffset * 0.3,
                    isDiagonalZigzag: true
                });
            }
        }
    }

    generateMultiColumnPath(startX, startY, endX, endY) {
        const columns = 3;
        const columnWidth = (endX - startX) / columns;
        const lineHeight = 35;
        const pointsPerLine = 8;

        for (let col = 0; col < columns; col++) {
            const colStartX = startX + col * columnWidth + 20; // margin
            const colEndX = startX + (col + 1) * columnWidth - 20; // margin

            for (let y = startY; y <= endY; y += lineHeight) {
                for (let i = 0; i <= pointsPerLine; i++) {
                    const progress = i / pointsPerLine;
                    const x = colStartX + (colEndX - colStartX) * progress;

                    this.pathPoints.push({
                        x,
                        y,
                        isMultiColumn: true,
                        column: col
                    });
                }
            }
        }
    }

    // === EXAKTE MUSTER AUS DEM BUCH ===

    // Pattern 1: Horizontale S-Kurven (links oben im Buch)
    generateBookPattern1(startX, startY, endX, endY) {
        const lineSpacing = 35 * this.settings.patternStretch;
        const pointsPerLine = 80;

        for (let y = startY; y <= endY; y += lineSpacing) {
            for (let i = 0; i <= pointsPerLine; i++) {
                const progress = i / pointsPerLine;
                const x = startX + (endX - startX) * progress;

                // Exakte horizontale S-Kurve wie im Buch - Amplitude streckbar
                const sCurve = Math.sin(progress * Math.PI * 4) * (25 * this.settings.patternStretch);

                this.pathPoints.push({
                    x: x,
                    y: y + sCurve,
                    isBookPattern: true,
                    pattern: 1
                });
            }
        }
    }

    // Pattern 2: Vertikale Schlangenwelle (links unten im Buch)
    generateBookPattern2(startX, startY, endX, endY) {
        const totalPoints = 400;
        const height = endY - startY;
        const width = endX - startX;

        for (let i = 0; i <= totalPoints; i++) {
            const verticalProgress = i / totalPoints;
            const y = startY + height * verticalProgress;

            // Vertikale Schlangenbewegung wie im Buch - Amplitude streckbar
            const waveX = Math.sin(verticalProgress * Math.PI * 8) * (width * 0.4 * this.settings.patternStretch);
            const x = startX + width * 0.5 + waveX;

            this.pathPoints.push({
                x: x,
                y: y,
                isBookPattern: true,
                pattern: 2
            });
        }
    }

    // Pattern 3: Spalten-Lesen (mitte im Buch)
    generateBookPattern3(startX, startY, endX, endY) {
        const columns = 1;
        const lineHeight = 30 * this.settings.patternStretch;
        const pointsPerLine = 3; // Nur 3 Fixationspunkte pro Zeile

        for (let y = startY; y <= endY; y += lineHeight) {
            // Links, Mitte, Rechts - klassisches 3-Punkt-Lesen mit Streckung
            const spread = 0.25 * this.settings.patternStretch;
            const leftX = startX + (endX - startX) * Math.max(0.05, 0.25 - spread);
            const centerX = startX + (endX - startX) * 0.5;
            const rightX = startX + (endX - startX) * Math.min(0.95, 0.75 + spread);

            this.pathPoints.push(
                { x: leftX, y, isBookPattern: true, pattern: 3 },
                { x: centerX, y, isBookPattern: true, pattern: 3 },
                { x: rightX, y, isBookPattern: true, pattern: 3 }
            );
        }
    }

    // Pattern 4: Figure-8 Schleifen (rechts oben im Buch)
    generateBookPattern4(startX, startY, endX, endY) {
        const loopHeight = 60 * this.settings.patternStretch;
        const loopsPerPage = Math.floor((endY - startY) / loopHeight);
        const pointsPerLoop = 50;

        for (let loop = 0; loop < loopsPerPage; loop++) {
            const loopCenterY = startY + (loop + 0.5) * loopHeight;
            const loopCenterX = startX + (endX - startX) * 0.5;

            for (let i = 0; i <= pointsPerLoop; i++) {
                const t = (i / pointsPerLoop) * Math.PI * 4; // Zwei komplette Kreise für Figure-8

                // Figure-8 Formel (Lemniskate) - Größe streckbar
                const scale = (endX - startX) * 0.3 * this.settings.patternStretch;
                const x = loopCenterX + scale * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t));
                const y = loopCenterY + (loopHeight * 0.3) * Math.sin(t) * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t));

                this.pathPoints.push({
                    x: x,
                    y: y,
                    isBookPattern: true,
                    pattern: 4
                });
            }
        }
    }

    // Pattern 5: Horizontale Scan-Linien (rechts unten im Buch)
    generateBookPattern5(startX, startY, endX, endY) {
        const scanLines = Math.floor(12 / this.settings.patternStretch);
        const scanSpacing = (endY - startY) / scanLines;
        const pointsPerScan = 60;

        for (let scan = 0; scan <= scanLines; scan++) {
            const y = startY + scan * scanSpacing;

            // Abwechselnde Richtung wie im Buch
            const isReverse = scan % 2 === 1;

            for (let i = 0; i <= pointsPerScan; i++) {
                const progress = isReverse ? 1 - (i / pointsPerScan) : (i / pointsPerScan);
                const x = startX + (endX - startX) * progress;

                this.pathPoints.push({
                    x: x,
                    y: y,
                    isBookPattern: true,
                    pattern: 5,
                    scanDirection: isReverse ? 'reverse' : 'forward'
                });
            }
        }
    }

    // Pattern 6: Diagonale Zickzack-Wellen (rechts mitte im Buch)
    generateBookPattern6(startX, startY, endX, endY) {
        const totalPoints = 300;
        const width = endX - startX;
        const height = endY - startY;

        for (let i = 0; i <= totalPoints; i++) {
            const progress = i / totalPoints;

            // Diagonale Grundbewegung
            const baseX = startX + width * progress;
            const baseY = startY + height * progress;

            // Zickzack-Wellen überlagert - Amplitude streckbar
            const waveAmplitude = 40 * this.settings.patternStretch;
            const waveFreq = 15;
            const zigzagX = Math.sin(progress * Math.PI * waveFreq) * waveAmplitude;
            const zigzagY = Math.cos(progress * Math.PI * waveFreq * 0.7) * (waveAmplitude * 0.5);

            this.pathPoints.push({
                x: baseX + zigzagX,
                y: baseY + zigzagY,
                isBookPattern: true,
                pattern: 6
            });
        }
    }
}

// Eye Training Module
class EyeTraining {
    constructor() {
        this.isActive = false;
        this.animationId = null;
        this.currentPattern = 0;
        this.patterns = [
            'figure8', 'circle', 'diagonal', 'corners', 'center'
        ];
    }

    show() {
        document.getElementById('eyeTrainingModal').classList.add('visible');
        this.start();
    }

    hide() {
        document.getElementById('eyeTrainingModal').classList.remove('visible');
        this.stop();
    }

    start() {
        this.isActive = true;
        this.animate();

        document.getElementById('closeEyeTraining').onclick = () => this.hide();
    }

    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    animate() {
        if (!this.isActive) return;

        const point = document.getElementById('eyeTrainingPoint');
        const area = document.getElementById('eyeTrainingArea');
        const rect = area.getBoundingClientRect();

        const time = Date.now() * 0.001;
        const pattern = this.patterns[this.currentPattern];

        let x, y;

        switch (pattern) {
            case 'figure8':
                x = 200 + Math.sin(time) * 150;
                y = 150 + Math.sin(time * 2) * 100;
                break;
            case 'circle':
                x = 200 + Math.cos(time) * 120;
                y = 150 + Math.sin(time) * 120;
                break;
            case 'diagonal':
                const diag = (time % 4) / 4;
                x = 50 + diag * 300;
                y = 50 + diag * 200;
                break;
            case 'corners':
                const corner = Math.floor(time % 8);
                const corners = [
                    [50, 50], [350, 50], [350, 250], [50, 250],
                    [200, 50], [350, 150], [200, 250], [50, 150]
                ];
                [x, y] = corners[corner % corners.length];
                break;
            case 'center':
                x = 200;
                y = 150;
                break;
        }

        point.style.left = x + 'px';
        point.style.top = y + 'px';

        // Switch pattern every 10 seconds
        if (Math.floor(time) % 10 === 0 && time % 1 < 0.1) {
            this.currentPattern = (this.currentPattern + 1) % this.patterns.length;
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// Schulte Training Module
class SchulteTraining {
    constructor() {
        this.currentNumber = 1;
        this.startTime = 0;
        this.isActive = false;
        this.timer = null;
    }

    show() {
        document.getElementById('schulteModal').classList.add('visible');
        this.reset();
        this.setupEvents();
    }

    hide() {
        document.getElementById('schulteModal').classList.remove('visible');
        this.stop();
    }

    setupEvents() {
        document.getElementById('startSchulte').onclick = () => this.start();
        document.getElementById('resetSchulte').onclick = () => this.reset();
        document.getElementById('closeSchulte').onclick = () => this.hide();
    }

    start() {
        this.isActive = true;
        this.startTime = Date.now();
        this.currentNumber = 1;

        this.updateDisplay();
        this.startTimer();
        this.generateTable();
    }

    stop() {
        this.isActive = false;
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    reset() {
        this.stop();
        this.currentNumber = 1;
        document.getElementById('schulteTimer').textContent = '0';
        document.getElementById('nextNumber').textContent = '1';
        document.getElementById('schulteTable').innerHTML = '';
    }

    generateTable() {
        const table = document.getElementById('schulteTable');
        table.innerHTML = '';

        // Create numbers 1-25
        const numbers = Array.from({length: 25}, (_, i) => i + 1);

        // Shuffle array
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }

        // Create cells
        numbers.forEach(num => {
            const cell = document.createElement('div');
            cell.className = 'schulte-cell';
            cell.textContent = num;
            cell.onclick = () => this.cellClicked(num, cell);
            table.appendChild(cell);
        });
    }

    cellClicked(number, cell) {
        if (!this.isActive) return;

        if (number === this.currentNumber) {
            cell.classList.add('correct');
            this.currentNumber++;

            if (this.currentNumber > 25) {
                this.complete();
            } else {
                this.updateDisplay();
            }
        } else {
            cell.classList.add('wrong');
            setTimeout(() => cell.classList.remove('wrong'), 500);
        }
    }

    complete() {
        this.stop();
        const time = ((Date.now() - this.startTime) / 1000).toFixed(1);
        alert(`Completed in ${time} seconds! Excellent work!`);
    }

    updateDisplay() {
        document.getElementById('nextNumber').textContent = this.currentNumber;
    }

    startTimer() {
        this.timer = setInterval(() => {
            if (this.isActive) {
                const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
                document.getElementById('schulteTimer').textContent = elapsed;
            }
        }, 100);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SpeedReader();
});