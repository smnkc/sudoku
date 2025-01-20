class Sudoku {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.mistakes = 0;
        this.selectedCell = null;
        this.timer = 0;
        this.timerInterval = null;
        this.lastHighlightedNumber = null;
        this.numberCounts = Array(10).fill(9); // 1-9 arası sayıların sayısı (index 0 kullanılmıyor)
        this.initializeGame();
        this.setupNumberPicker();
    }

    initializeGame() {
        this.generateSolution();
        this.createPuzzle(document.getElementById('difficulty').value);
        this.renderBoard();
        this.setupEventListeners();
        this.startTimer();
    }

    generateSolution() {
        // Basit bir çözüm oluşturma algoritması
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        const shuffle = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        const isValid = (num, pos) => {
            const [row, col] = pos;
            
            // Satır kontrolü
            for(let i = 0; i < 9; i++) {
                if(this.solution[row][i] === num) return false;
            }
            
            // Sütun kontrolü
            for(let i = 0; i < 9; i++) {
                if(this.solution[i][col] === num) return false;
            }
            
            // 3x3 kutu kontrolü
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            
            for(let i = 0; i < 3; i++) {
                for(let j = 0; j < 3; j++) {
                    if(this.solution[boxRow + i][boxCol + j] === num) return false;
                }
            }
            
            return true;
        };

        const fillBoard = (pos = 0) => {
            if(pos === 81) return true;
            
            const row = Math.floor(pos / 9);
            const col = pos % 9;
            
            if(this.solution[row][col] !== 0) return fillBoard(pos + 1);
            
            const nums = shuffle([...numbers]);
            
            for(const num of nums) {
                if(isValid(num, [row, col])) {
                    this.solution[row][col] = num;
                    if(fillBoard(pos + 1)) return true;
                    this.solution[row][col] = 0;
                }
            }
            
            return false;
        };

        fillBoard();
    }

    createPuzzle(difficulty) {
        // Sayı sayaçlarını sıfırla
        this.numberCounts = Array(10).fill(9);
        
        // Mevcut createPuzzle mantığı
        for(let i = 0; i < 9; i++) {
            for(let j = 0; j < 9; j++) {
                this.board[i][j] = this.solution[i][j];
            }
        }

        const difficulties = {
            'easy': 30,
            'medium': 40,
            'hard': 50
        };

        const cellsToRemove = difficulties[difficulty];
        
        for(let i = 0; i < cellsToRemove; i++) {
            let row = Math.floor(Math.random() * 9);
            let col = Math.floor(Math.random() * 9);
            
            while(this.board[row][col] === 0) {
                row = Math.floor(Math.random() * 9);
                col = Math.floor(Math.random() * 9);
            }
            
            const num = this.board[row][col];
            this.board[row][col] = 0;
            this.numberCounts[num]++;
        }

        // Başlangıçta yerleştirilmiş sayıları sayaçlardan düş
        for(let i = 0; i < 9; i++) {
            for(let j = 0; j < 9; j++) {
                if(this.board[i][j] !== 0) {
                    this.numberCounts[this.board[i][j]]--;
                }
            }
        }

        this.updateRemainingNumbers();
    }

    renderBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';

        for(let i = 0; i < 9; i++) {
            for(let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                if(this.board[i][j] !== 0) {
                    cell.textContent = this.board[i][j];
                    cell.classList.add('fixed');
                }
                
                boardElement.appendChild(cell);
            }
        }
    }

    highlightSameNumbers(number) {
        // Önceki vurgulamaları temizle
        const allCells = document.querySelectorAll('.board div');
        allCells.forEach(cell => cell.classList.remove('same-number'));

        if (number === null) return;

        // Aynı sayıya sahip hücreleri vurgula
        allCells.forEach(cell => {
            if (cell.textContent === number.toString()) {
                cell.classList.add('same-number');
            }
        });
    }

    setupNumberPicker() {
        const picker = document.getElementById('numberPicker');
        document.addEventListener('click', (e) => {
            if (!this.selectedCell || e.target.closest('#numberPicker')) return;
            picker.style.display = 'none';
        });

        picker.addEventListener('click', (e) => {
            if (!e.target.matches('button')) return;
            
            if (e.target.id === 'pickerEraser') {
                if (!this.selectedCell) return;
                const row = parseInt(this.selectedCell.dataset.row);
                const col = parseInt(this.selectedCell.dataset.col);
                const oldNum = this.board[row][col];
                
                if (oldNum !== 0) {
                    this.numberCounts[oldNum]++;
                    this.updateRemainingNumbers();
                }

                this.selectedCell.textContent = '';
                this.selectedCell.classList.remove('error', 'correct');
                this.board[row][col] = 0;
                this.highlightSameNumbers(null);
            } else {
                const num = parseInt(e.target.textContent);
                if (!this.selectedCell) return;
                
                const row = parseInt(this.selectedCell.dataset.row);
                const col = parseInt(this.selectedCell.dataset.col);
                const oldNum = this.board[row][col];

                if (oldNum !== 0) {
                    this.numberCounts[oldNum]++;
                }
                
                this.numberCounts[num]--;
                
                this.selectedCell.textContent = num;
                this.board[row][col] = num;

                this.selectedCell.classList.remove('error', 'correct');
                
                if(this.board[row][col] !== this.solution[row][col]) {
                    this.selectedCell.classList.add('error');
                    this.selectedCell.style.color = '#e53e3e';  // Kırmızı renk
                    this.mistakes++;
                    document.getElementById('mistakes').textContent = this.mistakes;
                    
                    if(this.mistakes >= 3) {
                        setTimeout(() => {
                            alert('Oyun Bitti! Çok fazla hata yaptınız.');
                            this.newGame();
                        }, 500);
                    }
                } else {
                    this.selectedCell.classList.add('correct');
                    this.selectedCell.style.color = '';  // Varsayılan renk
                    if(this.checkWin()) {
                        setTimeout(() => {
                            alert('Tebrikler! Sudoku\'yu başarıyla tamamladınız!');
                            this.newGame();
                        }, 500);
                    }
                }

                this.highlightSameNumbers(num);
                this.updateRemainingNumbers();
            }
            picker.style.display = 'none';
        });
    }

    updateRemainingNumbers() {
        // Sayı sayaçlarını sıfırla
        this.numberCounts = Array(10).fill(9);
        
        // Tahtadaki mevcut sayıları say
        for(let i = 0; i < 9; i++) {
            for(let j = 0; j < 9; j++) {
                if(this.board[i][j] !== 0) {
                    this.numberCounts[this.board[i][j]]--;
                }
            }
        }
        
        const container = document.querySelector('.number-counts');
        container.innerHTML = '';
        
        for (let i = 1; i <= 9; i++) {
            const count = this.numberCounts[i];
            const div = document.createElement('div');
            div.className = count === 0 ? 'number-count completed' : 'number-count';
            div.textContent = `${i}: ${count}`;
            container.appendChild(div);
        }
    }

    setupEventListeners() {
        const board = document.getElementById('board');
        const picker = document.getElementById('numberPicker');
        
        // Mobil cihaz kontrolü
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        
        board.addEventListener('click', (e) => {
            const cell = e.target;
            
            // Eğer tıklanan yer board'ın kendisiyse (hücre değilse) işlem yapma
            if (!cell.dataset.row) return;
            
            if(cell.classList.contains('fixed')) {
                // Sabit hücrelere tıklandığında sadece vurgula
                const number = parseInt(cell.textContent);
                this.highlightSameNumbers(number);
                picker.style.display = 'none';
                return;
            }

            // Önceki seçili hücreyi temizle
            const prevSelected = board.querySelector('.selected');
            if(prevSelected) prevSelected.classList.remove('selected');
            
            // Yeni hücreyi seç
            cell.classList.add('selected');
            this.selectedCell = cell;

            if (isMobile) {
                // Mobil cihazlarda sayı seçici her zaman ekranın altında
                picker.style.display = 'block';
            } else {
                // Masaüstünde sayı seçiciyi hücrenin yanında konumlandır
                const rect = cell.getBoundingClientRect();
                const boardRect = board.getBoundingClientRect();
                
                // Ekranın sağ kenarına yakınsa sola doğru konumlandır
                const rightSpace = window.innerWidth - rect.right;
                let leftPos = rightSpace < 200 ? rect.left - 190 : rect.right + 5;
                
                // Ekranın alt kenarına yakınsa yukarı doğru konumlandır
                const bottomSpace = window.innerHeight - rect.bottom;
                let topPos = bottomSpace < 250 ? rect.top - 220 : rect.bottom + 5;

                // Ekranın dışına taşmasını önle
                if (leftPos < 0) leftPos = rect.right + 5;
                if (topPos < 0) topPos = rect.bottom + 5;
                
                picker.style.left = `${leftPos - boardRect.left}px`;
                picker.style.top = `${topPos - boardRect.top}px`;
                picker.style.display = 'block';
            }

            // Hücredeki mevcut sayıyı vurgula
            const number = cell.textContent ? parseInt(cell.textContent) : null;
            this.highlightSameNumbers(number);

            // Tıklama olayının yayılmasını engelle
            e.stopPropagation();
        });

        // Dokunmatik cihazlar için özel işlemler
        if ('ontouchstart' in window) {
            // Çift dokunma zoom'u engelle
            document.addEventListener('touchstart', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });

            // Sayı seçicide kaydırma hareketini engelle
            picker.addEventListener('touchmove', (e) => {
                e.preventDefault();
            }, { passive: false });
        }

        // Sayı seçicinin dışına tıklandığında kapat
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#numberPicker') && !e.target.closest('.board')) {
                picker.style.display = 'none';
            }
        });

        document.getElementById('newGame').addEventListener('click', () => {
            this.highlightSameNumbers(null);
            this.lastHighlightedNumber = null;
            picker.style.display = 'none';
            this.newGame();
        });
        
        document.getElementById('difficulty').addEventListener('change', () => {
            this.highlightSameNumbers(null);
            this.lastHighlightedNumber = null;
            picker.style.display = 'none';
            this.newGame();
        });

        // İpucu butonu için event listener
        const hintButton = document.getElementById('hintButton');
        hintButton.addEventListener('click', () => {
            hintButton.classList.toggle('active');
            if (hintButton.classList.contains('active')) {
                this.showAllPossibleNumbers();
            } else {
                this.hideAllPossibleNumbers();
            }
        });
    }

    checkWin() {
        for(let i = 0; i < 9; i++) {
            for(let j = 0; j < 9; j++) {
                if(this.board[i][j] !== this.solution[i][j]) return false;
            }
        }
        return true;
    }

    startTimer() {
        if(this.timerInterval) clearInterval(this.timerInterval);
        
        this.timer = 0;
        const timeDisplay = document.getElementById('time');
        
        this.timerInterval = setInterval(() => {
            this.timer++;
            const minutes = Math.floor(this.timer / 60);
            const seconds = this.timer % 60;
            timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    newGame() {
        this.mistakes = 0;
        document.getElementById('mistakes').textContent = '0';
        this.selectedCell = null;
        this.lastHighlightedNumber = null;
        if(this.timerInterval) clearInterval(this.timerInterval);
        this.highlightSameNumbers(null);
        this.hideAllPossibleNumbers();
        document.getElementById('numberPicker').style.display = 'none';
        
        // İpucu butonunu sıfırla
        const hintButton = document.getElementById('hintButton');
        hintButton.classList.remove('active');
        
        // Oyunu yeniden başlat
        this.initializeGame();
        
        // İpucu butonu event listener'ını yeniden ekle
        hintButton.removeEventListener('click', this.handleHintButton);
        hintButton.addEventListener('click', this.handleHintButton = () => {
            hintButton.classList.toggle('active');
            if (hintButton.classList.contains('active')) {
                this.showAllPossibleNumbers();
            } else {
                this.hideAllPossibleNumbers();
            }
        });
    }

    isPossibleNumber(num, row, col) {
        // Satır kontrolü
        for(let i = 0; i < 9; i++) {
            if(this.board[row][i] === num) return false;
        }
        
        // Sütun kontrolü
        for(let i = 0; i < 9; i++) {
            if(this.board[i][col] === num) return false;
        }
        
        // 3x3 kutu kontrolü
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for(let i = 0; i < 3; i++) {
            for(let j = 0; j < 3; j++) {
                if(this.board[boxRow + i][boxCol + j] === num) return false;
            }
        }
        
        return true;
    }

    getPossibleNumbers(row, col) {
        const possibleNums = [];
        for(let num = 1; num <= 9; num++) {
            if(this.isPossibleNumber(num, row, col)) {
                possibleNums.push(num);
            }
        }
        return possibleNums;
    }

    showAllPossibleNumbers() {
        this.hideAllPossibleNumbers();
        
        const cells = document.querySelectorAll('.board div');
        cells.forEach(cell => {
            if (!cell.classList.contains('fixed') && !cell.textContent) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                const possibleNums = this.getPossibleNumbers(row, col);
                
                const hintsDiv = document.createElement('div');
                hintsDiv.className = 'hints-container';
                
                // Olası sayıları yan yana göster
                possibleNums.forEach(num => {
                    const numSpan = document.createElement('span');
                    numSpan.className = 'possible-number';
                    numSpan.textContent = num;
                    hintsDiv.appendChild(numSpan);
                });
                
                cell.appendChild(hintsDiv);
                cell.classList.add('has-hints');
            }
        });
    }

    hideAllPossibleNumbers() {
        const cells = document.querySelectorAll('.board div');
        cells.forEach(cell => {
            if (cell.classList.contains('has-hints')) {
                const hintsContainer = cell.querySelector('.hints-container');
                if (hintsContainer) {
                    cell.removeChild(hintsContainer);
                }
                cell.classList.remove('has-hints');
            }
        });
    }
}

// Oyunu başlat
window.onload = () => new Sudoku(); 