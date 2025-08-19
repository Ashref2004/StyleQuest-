let timer;
        let timeLeft;
        let currentTopic = "";
        let topics = ["حفلة على الشاطئ", "حفل زفاف", "مناسبة رسمية", "رياضي", "خريف 2024", "شتاء دافئ", "أمسية سهرة", "حفلة تخرج"];
        let playerCount = 3;
        let maxPoints = 3;
        let maxX = window.innerWidth - 25;
        let maxY = window.innerHeight - 25;
        let soundEnabled = true;
        let animationFrameId;
        
        let players = [];
        let currentPlayerIndex = 0;
        let currentRaterIndex = 0;
        let currentRatedIndex = 0;
        let usedPointsByRater = []; // لتخزين النقاط المستخدمة لكل مقيم
        
        let upBtn, downBtn, leftBtn, rightBtn;
        let moveUpHandler, moveDownHandler, moveLeftHandler, moveRightHandler;
        
        let doorSound, moveSound, timeSound, ratingSound;
        createSounds();
        
        function startGame() {
            playerCount = parseInt(document.getElementById('player-count').value);
            const playerNamesInput = document.getElementById('player-names').value;
            const topicSelect = document.getElementById('topic-select').value;
            
            let playerNames = [];
            
            if (playerNamesInput) {
                playerNames = playerNamesInput.split(',').map(name => name.trim());
            }
            
            if (topicSelect === 'random') {
                currentTopic = topics[Math.floor(Math.random() * topics.length)];
            } else {
                currentTopic = topicSelect;
            }
            
            maxPoints = playerCount;
            timeLeft = 300;
            
            players = [];
            for (let i = 0; i < playerCount; i++) {
                players.push({
                    id: i,
                    name: playerNames[i] || `اللاعب ${i+1}`,
                    score: 0,
                    ratingsReceived: [],
                    customizationComplete: false,
                    headColor: '#6a11cb',
                    bodyColor: '#2575fc'
                });
            }

            
            usedPointsByRater = Array.from({length: playerCount}, () => []);

            document.getElementById('start-screen').style.display = 'none';
            startPlayerCustomization();
        }

        function startPlayerCustomization() {
            document.getElementById('customization-screen').style.display = 'flex';
            document.getElementById('current-player-number').textContent = currentPlayerIndex + 1;
            document.getElementById('current-player-name').textContent = players[currentPlayerIndex].name;
            
            document.getElementById('topic').textContent = currentTopic;
            
            timeLeft = 300;
            updateTimerDisplay();
            
            const player = players[currentPlayerIndex];
            document.querySelector('#current-avatar-custom .avatar-head').style.backgroundColor = player.headColor;
            document.querySelector('#current-avatar-custom .avatar-body').style.backgroundColor = player.bodyColor;
            
            startTimer();
            setupDoorProximity();
            setupMobileControls();
            
            updateScreenBounds();
            
            autoSaveGame();
        }

        function updateScreenBounds() {
            maxX = window.innerWidth - 25;
            maxY = window.innerHeight - 25;
        }

        function setupMobileControls() {
            upBtn = document.getElementById('up-btn');
            downBtn = document.getElementById('down-btn');
            leftBtn = document.getElementById('left-btn');
            rightBtn = document.getElementById('right-btn');
            
            moveUpHandler = () => movePlayer('up');
            moveDownHandler = () => movePlayer('down');
            moveLeftHandler = () => movePlayer('left');
            moveRightHandler = () => movePlayer('right');
            
            upBtn.addEventListener('touchstart', moveUpHandler);
            downBtn.addEventListener('touchstart', moveDownHandler);
            leftBtn.addEventListener('touchstart', moveLeftHandler);
            rightBtn.addEventListener('touchstart', moveRightHandler);
            
            document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });
        }

        function movePlayer(direction) {
            const playerAvatar = document.getElementById('player-avatar');
            let posX = parseInt(playerAvatar.style.left) || (window.innerWidth / 2);
            let posY = parseInt(playerAvatar.style.top) || (window.innerHeight / 2);
            
            switch(direction) {
                case 'up': posY = Math.max(25, posY - 20); break;
                case 'down': posY = Math.min(maxY, posY + 20); break;
                case 'left': posX = Math.max(25, posX - 20); break;
                case 'right': posX = Math.min(maxX, posX + 20); break;
            }

            playerAvatar.style.left = posX + 'px';
            playerAvatar.style.top = posY + 'px';
            
            playSound(moveSound);

            checkDoorProximity(posX, posY);
        }

        function updateTimerDisplay() {
            let minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            const timerElement = document.getElementById('timer');
            timerElement.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
            if (timeLeft <= 60) {
                timerElement.classList.add('timer-warning');
                if (timeLeft === 60) {
                    playSound(timeSound);
                }
            } else {
                timerElement.classList.remove('timer-warning');
            }
        }

        function startTimer() {
            clearInterval(timer);
            timer = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    finishPlayerCustomization();
                }
            }, 1000);
        }

        function changeHeadColor(color) {
            document.querySelector('#current-avatar-custom .avatar-head').style.backgroundColor = color;
            players[currentPlayerIndex].headColor = color;
        }

        function changeBodyColor(color) {
            document.querySelector('#current-avatar-custom .avatar-body').style.backgroundColor = color;
            players[currentPlayerIndex].bodyColor = color;
        }

        function finishPlayerCustomization() {
            clearInterval(timer);
            players[currentPlayerIndex].customizationComplete = true;
            
            removeMobileControls();
            
            currentPlayerIndex++;
            if (currentPlayerIndex < playerCount) {
                startPlayerCustomization();
            } else {
                document.getElementById('customization-screen').style.display = 'none';
                showShowcase();
            }
            
            autoSaveGame();
        }

        function removeMobileControls() {
            if (upBtn && moveUpHandler) {
                upBtn.removeEventListener('touchstart', moveUpHandler);
                downBtn.removeEventListener('touchstart', moveDownHandler);
                leftBtn.removeEventListener('touchstart', moveLeftHandler);
                rightBtn.removeEventListener('touchstart', moveRightHandler);
            }
        }

        function showShowcase() {
            document.getElementById('showcase-screen').style.display = 'flex';
            
            const showcaseContainer = document.getElementById('showcase-container');
            showcaseContainer.innerHTML = '';
            
            for (let i = 0; i < playerCount; i++) {
                const player = players[i];
                const avatarDiv = document.createElement('div');
                avatarDiv.className = 'avatar-showcase';
                
                const avatar = document.createElement('div');
                avatar.className = 'avatar';
                
                const head = document.createElement('div');
                head.className = 'avatar-head';
                head.style.backgroundColor = player.headColor;
                
                const body = document.createElement('div');
                body.className = 'avatar-body';
                body.style.backgroundColor = player.bodyColor;
                
                avatar.appendChild(head);
                avatar.appendChild(body);
                
                if (Math.random() > 0.5) {
                    avatar.classList.add('dance-animation');
                } else {
                    avatar.classList.add('jump-animation');
                }
                
                const nameDiv = document.createElement('div');
                nameDiv.className = 'player-name';
                nameDiv.textContent = player.name;
                
                avatarDiv.appendChild(avatar);
                avatarDiv.appendChild(nameDiv);
                showcaseContainer.appendChild(avatarDiv);
            }
            
            autoSaveGame();
        }

        function startRating() {
            document.getElementById('showcase-screen').style.display = 'none';
            document.getElementById('rating-screen').style.display = 'flex';
            startPlayerRating();
        }

        function startPlayerRating() {
            if (currentRaterIndex >= playerCount) {
                calculateResults();
                return;
            }

            document.getElementById('rater-number').textContent = currentRaterIndex + 1;
            document.getElementById('rater-name').textContent = players[currentRaterIndex].name;
            currentRatedIndex = 0;
            showNextRating();
        }

        function showNextRating() {
            if (currentRatedIndex === currentRaterIndex) {
                currentRatedIndex++;
            }

            if (currentRatedIndex >= playerCount) {
                currentRaterIndex++;
                startPlayerRating();
                return;
            }

            const ratedPlayer = players[currentRatedIndex];
            document.getElementById('rated-number').textContent = currentRatedIndex + 1;
            document.getElementById('rated-name').textContent = ratedPlayer.name;
            document.getElementById('max-points').textContent = maxPoints;

            document.querySelector('#rating-screen .avatar-head').style.backgroundColor = ratedPlayer.headColor;
            document.querySelector('#rating-screen .avatar-body').style.backgroundColor = ratedPlayer.bodyColor;

            const ratingButtons = document.getElementById('rating-buttons');
            ratingButtons.innerHTML = '';
            
            for (let point = 1; point <= maxPoints; point++) {
                const button = document.createElement('button');
                button.textContent = point;
                
                if (usedPointsByRater[currentRaterIndex].includes(point)) {
                    button.disabled = true;
                } else {
                    button.onclick = () => ratePlayer(point);
                }
                
                ratingButtons.appendChild(button);
            }
            
            autoSaveGame();
        }

        function ratePlayer(score) {
            usedPointsByRater[currentRaterIndex].push(score);
            
            players[currentRatedIndex].ratingsReceived.push(score);
            
            createFloatingPoint(score);
            
            playSound(ratingSound);
            
            currentRatedIndex++;
            showNextRating();
        }

        function createFloatingPoint(score) {
            const ratingScreen = document.getElementById('rating-screen');
            const pointElement = document.createElement('div');
            pointElement.className = 'floating-point';
            pointElement.textContent = '+' + score;
            pointElement.style.left = '50%';
            pointElement.style.top = '60%';
            ratingScreen.appendChild(pointElement);
            
            setTimeout(() => {
                ratingScreen.removeChild(pointElement);
            }, 1500);
        }

        function calculateResults() {
            players.forEach(player => {
                player.score = player.ratingsReceived.reduce((sum, rating) => sum + rating, 0);
            });

            players.sort((a, b) => b.score - a.score);

            showResults();
        }

        function showResults() {
            document.getElementById('rating-screen').style.display = 'none';
            document.getElementById('results-screen').style.display = 'flex';

            const winner = players[0];
            document.getElementById('winner').textContent = 
                `${winner.name} فاز بـ ${winner.score} نقطة!`;

            const resultsList = document.getElementById('results-list');
            resultsList.innerHTML = '';
            players.forEach((player, index) => {
                const resultItem = document.createElement('div');
                resultItem.textContent = `المركز ${index + 1}: ${player.name} - ${player.score} نقطة`;
                resultsList.appendChild(resultItem);
            });
            
            autoSaveGame();
        }

        function newRound() {
            document.getElementById('results-screen').style.display = 'none';
            document.getElementById('start-screen').style.display = 'flex';
            currentPlayerIndex = 0;
            currentRaterIndex = 0;
            currentRatedIndex = 0;
            
            localStorage.removeItem('fashionShowGame');
            checkForSavedGame();
        }

        function setupDoorProximity() {
            const playerAvatar = document.getElementById('player-avatar');
            const doorLeft = document.getElementById('door-left');
            const doorRight = document.getElementById('door-right');

            doorLeft.classList.remove('door-open');
            doorRight.classList.remove('door-open');

            playerAvatar.style.left = (window.innerWidth / 2) + 'px';
            playerAvatar.style.top = (window.innerHeight / 2) + 'px';
            
            window.addEventListener('resize', updateScreenBounds);
        }

        function checkDoorProximity(x, y) {
            const doorLeft = document.getElementById('door-left');
            const doorRight = document.getElementById('door-right');
            const doorNotification = document.getElementById('door-notification');

            const doorLeftRect = doorLeft.getBoundingClientRect();
            const doorRightRect = doorRight.getBoundingClientRect();

            const distLeft = Math.sqrt(Math.pow(x - (doorLeftRect.left + doorLeftRect.width/2), 2) + Math.pow(y - (doorLeftRect.top + doorLeftRect.height/2), 2));
            const distRight = Math.sqrt(Math.pow(x - (doorRightRect.left + doorRightRect.width/2), 2) + Math.pow(y - (doorRightRect.top + doorRightRect.height/2), 2));

            if (distLeft < 100 && !doorLeft.classList.contains('door-open')) {
                doorLeft.classList.add('door-open');
                showDoorNotification("الباب الأيسر فتح!", doorNotification);
                playSound(doorSound);
                if (navigator.vibrate) {
                    navigator.vibrate(200);
                }
            }

            if (distRight < 100 && !doorRight.classList.contains('door-open')) {
                doorRight.classList.add('door-open');
                showDoorNotification("الباب الأيمن فتح!", doorNotification);
                playSound(doorSound);
                if (navigator.vibrate) {
                    navigator.vibrate(200);
                }
            }
        }

        function showDoorNotification(message, notificationElement) {
            notificationElement.textContent = message;
            notificationElement.classList.add('show');
            
            setTimeout(() => {
                notificationElement.classList.remove('show');
            }, 2000);
        }

        function createSounds() {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                doorSound = createTone(audioContext, 200, 0.3);
                
                moveSound = createTone(audioContext, 100, 0.1);
                
                timeSound = createTone(audioContext, 300, 0.5);
                
                ratingSound = createTone(audioContext, 600, 0.4);
            } catch (e) {
                console.log("Web Audio API غير مدعوم، استخدام أصوات بديلة");
                doorSound = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAAAAAA");
                moveSound = new Audio("data:audio/wav;base64,UklGRh4AAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQwAAAAAAA==");
                timeSound = new Audio("data:audio/wav;base64,UklGRhAAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");
                ratingSound = new Audio("data:audio/wav;base64,UklGRh4AAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQwAAAAAAA==");
            }
        }
        
        function createTone(audioContext, frequency, duration) {
            return function() {
                if (!soundEnabled) return;
                
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            };
        }

        function playSound(sound) {
            if (!soundEnabled) return;
            
            if (typeof sound === 'function') {
                sound();
            } else {
                sound.currentTime = 0;
                sound.play().catch(e => console.log("لم يتم تشغيل الصوت بسبب سياسة المتصفح"));
            }
        }
        
        function saveGame() {
            const gameData = {
                players: players,
                currentPlayerIndex: currentPlayerIndex,
                currentRaterIndex: currentRaterIndex,
                currentRatedIndex: currentRatedIndex,
                usedPointsByRater: usedPointsByRater,
                currentTopic: currentTopic,
                timeLeft: timeLeft
            };
            
            localStorage.setItem('fashionShowGame', JSON.stringify(gameData));
            
            const saveNotification = document.getElementById('save-notification');
            saveNotification.textContent = 'تم حفظ اللعبة!';
            saveNotification.classList.add('show');
            
            setTimeout(() => {
                saveNotification.classList.remove('show');
            }, 2000);
        }
        
        function autoSaveGame() {
            const gameData = {
                players: players,
                currentPlayerIndex: currentPlayerIndex,
                currentRaterIndex: currentRaterIndex,
                currentRatedIndex: currentRatedIndex,
                usedPointsByRater: usedPointsByRater,
                currentTopic: currentTopic,
                timeLeft: timeLeft
            };
            
            localStorage.setItem('fashionShowGame', JSON.stringify(gameData));
        }
        
        function loadSavedGame() {
            const savedGame = localStorage.getItem('fashionShowGame');
            if (savedGame) {
                const gameData = JSON.parse(savedGame);
                
                players = gameData.players;
                currentPlayerIndex = gameData.currentPlayerIndex;
                currentRaterIndex = gameData.currentRaterIndex;
                currentRatedIndex = gameData.currentRatedIndex;
                usedPointsByRater = gameData.usedPointsByRater;
                currentTopic = gameData.currentTopic;
                timeLeft = gameData.timeLeft;
                
                playerCount = players.length;
                maxPoints = playerCount;
                
                if (currentPlayerIndex < playerCount) {
                    document.getElementById('start-screen').style.display = 'none';
                    startPlayerCustomization();
                } else if (currentRaterIndex < playerCount) {
                    document.getElementById('start-screen').style.display = 'none';
                    document.getElementById('customization-screen').style.display = 'none';
                    startRating();
                } else {
                    document.getElementById('start-screen').style.display = 'none';
                    document.getElementById('customization-screen').style.display = 'none';
                    document.getElementById('rating-screen').style.display = 'none';
                    calculateResults();
                }
            }
        }
        
        function checkForSavedGame() {
            const savedGame = localStorage.getItem('fashionShowGame');
            if (savedGame) {
                document.getElementById('load-saved').style.display = 'block';
            } else {
                document.getElementById('load-saved').style.display = 'none';
            }
        }
        
        function toggleSound() {
            soundEnabled = !soundEnabled;
            const soundToggle = document.getElementById('sound-toggle');
            soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
        }
        
        function init() {
            document.getElementById('sound-toggle').addEventListener('click', toggleSound);
            
            checkForSavedGame();
            
            window.addEventListener('beforeunload', () => {
                autoSaveGame();
            });
            
            function gameLoop() {
                animationFrameId = requestAnimationFrame(gameLoop);
            }
            
            gameLoop();
        }
        
        window.addEventListener('load', init);