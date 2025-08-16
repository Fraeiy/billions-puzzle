class BillionsPuzzle {
    constructor() {
        this.currentLevel = 1;
        this.gridSize = 3;
        this.pieces = [];
        this.solution = [];
        this.startTime = null;
        this.timerInterval = null;
        this.score = 0;
        this.hintsUsed = 0;
        
        // Cache DOM elements for better performance
        this.elements = {
            level: document.getElementById('level'),
            timer: document.getElementById('timer'),
            score: document.getElementById('score'),
            piecesLeft: document.getElementById('pieces-left'),
            originalImg: document.getElementById('original-img'),
            puzzleGrid: document.getElementById('puzzle-grid'),
            piecesGrid: document.getElementById('pieces-grid'),
            completionModal: document.getElementById('completion-modal'),
            completionTime: document.getElementById('completion-time'),
            shareText: document.getElementById('share-text')
        };

        // Real photo images only - filtered for visual complexity
        this.realImages = [
            "images/blogo.jpeg",
            "images/billions-logo.jpg",
            "images/billions-meme.jpeg",
            "images/billions-cover-logo.jpeg",
            "images/bjavi.png",
            "images/bcapy.jpeg",
            "images/bkaito.jpeg",
            "images/bmeme.jpeg",
            "images/bevin.jpeg",
            "images/bil-lag-collab.jpeg",
            "images/bill-sap-collab.png",
            "images/bnft.png",
            "images/btrust.png",
            "images/bpeng.jpeg",
            "images/bmeme2.jpeg",
            "images/bmeme3.jpeg",
            "images/bgomtu.jpeg"
        ];

        // Filtered images after complexity analysis
        this.validImages = [];
        
        this.init();
    }

    async init() {
        // Filter images for visual complexity
        await this.filterValidImages();
        this.setupEventListeners();
        this.newGame();
    }

    async filterValidImages() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;

        for (const imageSrc of this.realImages) {
            try {
                const isValid = await this.analyzeImageComplexity(imageSrc, canvas, ctx);
                if (isValid) {
                    this.validImages.push(imageSrc);
                }
            } catch (error) {
                console.warn(`Failed to analyze image ${imageSrc}:`, error);
                // Include image if analysis fails (assume it's complex enough)
                this.validImages.push(imageSrc);
            }
        }

        // Ensure we have at least some images
        if (this.validImages.length === 0) {
            this.validImages = this.realImages;
        }

        console.log(`Filtered ${this.validImages.length} valid images from ${this.realImages.length} total`);
    }

    async analyzeImageComplexity(imageSrc, canvas, ctx) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                try {
                    ctx.drawImage(img, 0, 0, 200, 200);
                    const imageData = ctx.getImageData(0, 0, 200, 200);
                    const data = imageData.data;
                    
                    // Analyze color distribution
                    const colorMap = new Map();
                    const totalPixels = data.length / 4;
                    
                    for (let i = 0; i < data.length; i += 4) {
                        // Group similar colors (reduce precision)
                        const r = Math.floor(data[i] / 32) * 32;
                        const g = Math.floor(data[i + 1] / 32) * 32;
                        const b = Math.floor(data[i + 2] / 32) * 32;
                        const colorKey = `${r},${g},${b}`;
                        
                        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
                    }
                    
                    // Calculate complexity metrics
                    const uniqueColors = colorMap.size;
                    const colorVariety = uniqueColors / totalPixels;
                    
                    // Find largest color group
                    let maxColorCount = 0;
                    for (const count of colorMap.values()) {
                        maxColorCount = Math.max(maxColorCount, count);
                    }
                    const dominantColorRatio = maxColorCount / totalPixels;
                    
                    // Edge detection (simple Sobel-like)
                    let edgeCount = 0;
                    for (let y = 1; y < 199; y++) {
                        for (let x = 1; x < 199; x++) {
                            const idx = (y * 200 + x) * 4;
                            const current = data[idx] + data[idx + 1] + data[idx + 2];
                            const right = data[idx + 4] + data[idx + 5] + data[idx + 6];
                            const down = data[idx + 800] + data[idx + 801] + data[idx + 802];
                            
                            if (Math.abs(current - right) > 30 || Math.abs(current - down) > 30) {
                                edgeCount++;
                            }
                        }
                    }
                    const edgeDensity = edgeCount / (198 * 198);
                    
                    // Complexity scoring
                    const complexityScore = (colorVariety * 0.4) + ((1 - dominantColorRatio) * 0.4) + (edgeDensity * 0.2);
                    
                    // Reject images that are too simple
                    const isValid = complexityScore > 0.1 && dominantColorRatio < 0.6 && uniqueColors > 50;
                    
                    console.log(`${imageSrc}: complexity=${complexityScore.toFixed(3)}, dominant=${dominantColorRatio.toFixed(3)}, colors=${uniqueColors}, valid=${isValid}`);
                    resolve(isValid);
                    
                } catch (error) {
                    console.warn(`Canvas analysis failed for ${imageSrc}:`, error);
                    resolve(true); // Default to valid if analysis fails
                }
            };
            
            img.onerror = () => {
                console.warn(`Failed to load image: ${imageSrc}`);
                resolve(false);
            };
            
            img.src = imageSrc;
        });
    }

    getRandomImage() {
        if (this.validImages.length === 0) {
            return this.realImages[Math.floor(Math.random() * this.realImages.length)];
        }
        return this.validImages[Math.floor(Math.random() * this.validImages.length)];
    }

    setupEventListeners() {
        // Use event delegation for better performance
        document.addEventListener('click', this.handleClick.bind(this));
        
        // Prevent context menu on mobile
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    handleClick(e) {
        const target = e.target;
        
        // Level buttons
        if (target.classList.contains('level-btn')) {
            const level = parseInt(target.dataset.level);
            const size = parseInt(target.dataset.size);
            this.setLevel(level, size);
            return;
        }
        
        // Control buttons
        switch(target.id) {
            case 'shuffle-btn':
                this.shufflePieces();
                break;
            case 'hint-btn':
                this.showHint();
                break;
            case 'new-game-btn':
                this.newGame();
                break;
            case 'share-btn':
                this.shareResult();
                break;
            case 'next-level-btn':
                this.nextLevel();
                break;
            case 'close-modal-btn':
                this.closeModal();
                break;
            case 'completion-modal':
                if (target.id === 'completion-modal') {
                    this.closeModal();
                }
                break;
        }
    }

    setLevel(level, size) {
        this.currentLevel = level;
        this.gridSize = size;
        
        // Update UI efficiently
        document.querySelector('.level-btn.active')?.classList.remove('active');
        document.querySelector(`[data-level="${level}"]`)?.classList.add('active');
        
        this.newGame();
    }

    newGame() {
        this.clearTimer();
        this.startTime = performance.now();
        this.score = this.calculateMaxScore();
        this.hintsUsed = 0;
        
        this.updateStats();
        this.createPuzzle();
        this.startTimer();
    }

    createPuzzle() {
        const totalPieces = this.gridSize * this.gridSize;
        const currentImage = this.getRandomImage(); // Random selection
        
        // Update original image
        this.elements.originalImg.src = currentImage;
        
        // Create puzzle components
        this.createGrid();
        this.createPieces(currentImage, totalPieces);
        this.shufflePieces();
    }

    createGrid() {
        const grid = this.elements.puzzleGrid;
        
        // Clear existing content efficiently
        grid.textContent = '';
        
        // Set CSS Grid properties
        grid.style.cssText = `
            grid-template-columns: repeat(${this.gridSize}, 60px);
            grid-template-rows: repeat(${this.gridSize}, 60px);
        `;
        
        // Create fragment for better performance
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const dropZone = document.createElement('div');
            dropZone.className = 'drop-zone';
            dropZone.dataset.position = i;
            
            this.setupDropZone(dropZone);
            fragment.appendChild(dropZone);
        }
        
        grid.appendChild(fragment);
    }

    generatePieceShape(row, col) {
        const seed = row * this.gridSize + col;
        const random = (n) => Math.sin(seed * n * 12.9898) * 43758.5453 % 1;
        
        // Choose between rounded corners or angled cuts
        const shapeType = Math.floor(random(1) * 2);
        
        if (shapeType === 0) {
            // Simple rounded corners - clean and classic
            const radius = 8 + Math.floor(random(2) * 8); // 8-16px radius
            return `border-radius: ${radius}px;`;
        } else {
            // Triangle cuts on corners - 45 degree angles
            const cutSize = 8 + Math.floor(random(3) * 6); // 8-14px cuts
            
            // Randomly choose which corners to cut
            const cutTopLeft = random(4) > 0.5;
            const cutTopRight = random(5) > 0.5;
            const cutBottomRight = random(6) > 0.5;
            const cutBottomLeft = random(7) > 0.5;
            
            let clipPath = 'polygon(';
            const points = [];
            
            // Top edge
            if (cutTopLeft) {
                points.push(`${cutSize}px 0`);
            } else {
                points.push('0 0');
            }
            
            if (cutTopRight) {
                points.push(`calc(100% - ${cutSize}px) 0`);
                points.push('100% ' + cutSize + 'px');
            } else {
                points.push('100% 0');
            }
            
            // Right and bottom
            if (cutBottomRight) {
                points.push(`100% calc(100% - ${cutSize}px)`);
                points.push(`calc(100% - ${cutSize}px) 100%`);
            } else {
                points.push('100% 100%');
            }
            
            if (cutBottomLeft) {
                points.push(cutSize + 'px 100%');
                points.push('0 calc(100% - ' + cutSize + 'px)');
            } else {
                points.push('0 100%');
            }
            
            // Close back to start
            if (cutTopLeft) {
                points.push('0 ' + cutSize + 'px');
            }
            
            clipPath += points.join(', ') + ');';
            return `clip-path: ${clipPath};`;
        }
    }

    createPieces(imageSrc, totalPieces) {
        const piecesGrid = this.elements.piecesGrid;
        piecesGrid.textContent = '';
        this.pieces = [];
        
        const fragment = document.createDocumentFragment();
        const pieceSize = 60;
        const totalSize = this.gridSize * pieceSize;
        
        for (let i = 0; i < totalPieces; i++) {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.draggable = true;
            piece.dataset.correctPosition = i;
            piece.dataset.currentPosition = i;
            
            // Calculate position
            const row = Math.floor(i / this.gridSize);
            const col = i % this.gridSize;
            
            // Create either rounded corners or angled cuts
            const shapeStyle = this.generatePieceShape(row, col);
            
            // Style the piece with clean puzzle edges
            piece.style.cssText = `
                background-image: url(${imageSrc});
                background-size: ${totalSize}px ${totalSize}px;
                background-position: ${-(col * pieceSize)}px ${-(row * pieceSize)}px;
                border: 2px solid rgba(255, 255, 255, 0.9);
                position: relative;
                transition: all 0.2s ease;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                ${shapeStyle}
            `;
            
            // Add very subtle texture only for plain areas (optional)
            const textureOverlay = document.createElement('div');
            textureOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05) 1px, transparent 1px);
                background-size: 15px 15px;
                pointer-events: none;
                opacity: 0.3;
                ${shapeStyle}
            `;
            piece.appendChild(textureOverlay);
            
            this.setupDragAndDrop(piece);
            fragment.appendChild(piece);
            this.pieces.push(piece);
        }
        
        piecesGrid.appendChild(fragment);
    }



    setupDragAndDrop(piece) {
        // Desktop drag events
        piece.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', piece.dataset.correctPosition);
            requestAnimationFrame(() => piece.classList.add('dragging'));
        });

        piece.addEventListener('dragend', () => {
            piece.classList.remove('dragging');
        });

        // Optimized touch events for mobile
        let touchData = { isDragging: false, currentDropZone: null };

        piece.addEventListener('touchstart', (e) => {
            touchData.isDragging = true;
            piece.classList.add('dragging');
            e.preventDefault();
        }, { passive: false });

        piece.addEventListener('touchmove', (e) => {
            if (!touchData.isDragging) return;
            
            const touch = e.touches[0];
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            
            // Remove previous hover effects efficiently
            if (touchData.currentDropZone) {
                touchData.currentDropZone.classList.remove('drag-over');
            }
            
            if (elementBelow && elementBelow.classList.contains('drop-zone')) {
                elementBelow.classList.add('drag-over');
                touchData.currentDropZone = elementBelow;
            } else {
                touchData.currentDropZone = null;
            }
            
            e.preventDefault();
        }, { passive: false });

        piece.addEventListener('touchend', (e) => {
            if (!touchData.isDragging) return;
            
            touchData.isDragging = false;
            piece.classList.remove('dragging');
            
            if (touchData.currentDropZone) {
                this.dropPiece(touchData.currentDropZone, piece.dataset.correctPosition);
                touchData.currentDropZone.classList.remove('drag-over');
                touchData.currentDropZone = null;
            }
            
            e.preventDefault();
        }, { passive: false });
    }

    setupDropZone(dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            const pieceId = e.dataTransfer.getData('text/plain');
            this.dropPiece(dropZone, pieceId);
            dropZone.classList.remove('drag-over');
        });
    }

    dropPiece(dropZone, pieceId) {
        const piece = document.querySelector(`[data-correct-position="${pieceId}"]`);
        const dropPosition = parseInt(dropZone.dataset.position);
        
        // Handle existing piece in drop zone
        if (dropZone.children.length > 0) {
            const existingPiece = dropZone.children[0];
            this.elements.piecesGrid.appendChild(existingPiece);
        }
        
        // Handle piece coming from another drop zone
        const currentParent = piece.parentNode;
        if (currentParent.classList.contains('drop-zone')) {
            currentParent.classList.remove('filled');
        }
        
        // Place the piece
        dropZone.appendChild(piece);
        dropZone.classList.add('filled');
        piece.dataset.currentPosition = dropPosition;
        
        // Visual feedback for correct/incorrect placement
        const isCorrect = parseInt(pieceId) === dropPosition;
        if (isCorrect) {
            piece.style.border = '2px solid #48dbfb';
            piece.style.boxShadow = '0 0 15px rgba(72, 219, 251, 0.6)';
        } else {
            piece.style.border = '2px solid rgba(255, 255, 255, 0.3)';
            piece.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        }
        
        this.updateStats();
        this.checkCompletion();
    }

    shufflePieces() {
        const piecesGrid = this.elements.piecesGrid;
        const pieces = Array.from(piecesGrid.children);
        
        // Fisher-Yates shuffle with animation
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            
            // Add subtle animation
            pieces[j].style.transform = 'scale(0.8) rotate(180deg)';
            pieces[j].style.transition = 'transform 0.3s ease';
            
            setTimeout(() => {
                piecesGrid.appendChild(pieces[j]);
                pieces[j].style.transform = '';
                pieces[j].style.transition = '';
            }, 50);
        }
    }

    showHint() {
        if (this.hintsUsed >= 3) {
            alert('No more hints available! 💡');
            return;
        }
        
        // Find incorrectly placed pieces efficiently
        const wrongPieces = this.pieces.filter(piece => {
            const correctPos = parseInt(piece.dataset.correctPosition);
            const currentPos = parseInt(piece.dataset.currentPosition);
            return correctPos !== currentPos;
        });
        
        if (wrongPieces.length === 0) return;
        
        const randomWrongPiece = wrongPieces[Math.floor(Math.random() * wrongPieces.length)];
        const correctPosition = parseInt(randomWrongPiece.dataset.correctPosition);
        const correctDropZone = document.querySelector(`[data-position="${correctPosition}"]`);
        
        // Animated hint
        correctDropZone.style.cssText += `
            background: rgba(72, 219, 251, 0.4);
            border-color: #48dbfb;
            animation: pulse 0.5s ease-in-out 3;
        `;
        
        setTimeout(() => {
            correctDropZone.style.background = '';
            correctDropZone.style.borderColor = '';
            correctDropZone.style.animation = '';
        }, 2000);
        
        this.hintsUsed++;
        this.score = Math.max(0, this.score - 100);
        this.updateStats();
    }

    checkCompletion() {
        const placedPieces = document.querySelectorAll('.drop-zone .puzzle-piece');
        
        if (placedPieces.length !== this.pieces.length) return;
        
        // Count correct pieces efficiently
        let correctCount = 0;
        for (const piece of placedPieces) {
            if (parseInt(piece.dataset.correctPosition) === parseInt(piece.dataset.currentPosition)) {
                correctCount++;
            }
        }
        
        if (correctCount === this.pieces.length) {
            this.completeGame();
        }
    }

    completeGame() {
        this.clearTimer();
        const completionTime = this.formatTime(performance.now() - this.startTime);
        
        this.elements.completionTime.textContent = completionTime;
        this.elements.shareText.textContent = 
            `I just solved the @billions\_ntwk puzzle in ${completionTime} 👓🧩 #BillionsNetwork`;
        
        this.elements.completionModal.style.display = 'flex';
        this.celebrationEffect();
    }

    celebrationEffect() {
        const pieces = document.querySelectorAll('.puzzle-piece');
        let index = 0;
        
        const animateNext = () => {
            if (index >= pieces.length) return;
            
            const piece = pieces[index];
            requestAnimationFrame(() => {
                piece.style.transform = 'scale(1.1) rotate(360deg)';
                piece.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                
                setTimeout(() => {
                    piece.style.transform = 'scale(1) rotate(0deg)';
                }, 300);
            });
            
            index++;
            setTimeout(animateNext, 30);
        };
        
        requestAnimationFrame(animateNext);
    }

    shareResult() {
        const shareText = this.elements.shareText.textContent;
        const gameUrl = window.location.href;
        
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(gameUrl)}`;
        
        if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
            navigator.share({
                title: 'Billions Puzzle Challenge',
                text: shareText,
                url: gameUrl
            });
        } else {
            window.open(twitterUrl, '_blank', 'width=550,height=420,resizable=yes,scrollbars=yes');
        }
    }

    nextLevel() {
        this.closeModal();
        
        if (this.currentLevel < 4) {
            const nextLevel = this.currentLevel + 1;
            const nextSize = [3, 4, 5, 6][nextLevel - 1];
            this.setLevel(nextLevel, nextSize);
        } else {
            alert('Congratulations! You\'ve completed all levels! 🎉');
        }
    }

    closeModal() {
        this.elements.completionModal.style.display = 'none';
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = performance.now() - this.startTime;
            this.elements.timer.textContent = this.formatTime(elapsed);
        }, 1000);
    }

    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    calculateMaxScore() {
        const baseScore = this.gridSize * this.gridSize * 100;
        const difficultyMultiplier = this.currentLevel;
        return baseScore * difficultyMultiplier;
    }

    updateStats() {
        requestAnimationFrame(() => {
            this.elements.level.textContent = this.currentLevel;
            this.elements.score.textContent = Math.max(0, this.score);
            
            const placedPieces = document.querySelectorAll('.drop-zone.filled').length;
            const totalPieces = this.gridSize * this.gridSize;
            this.elements.piecesLeft.textContent = totalPieces - placedPieces;
        });
    }
}

// Initialize the game efficiently
document.addEventListener('DOMContentLoaded', () => {
    new BillionsPuzzle();
});

// Add CSS animation for hint pulse effect
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    .puzzle-piece {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(style);