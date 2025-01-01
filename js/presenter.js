const presenterState = {
    currentQuestion: 0,
    gameCode: null,
    activeQuestion: null,
    timer: null,
    players: {},
    currentRound: 1,
    isGameActive: false
};

document.addEventListener('DOMContentLoaded', initPresenter);

function initPresenter() {
    presenterState.gameCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const gameCodeDisplay = document.getElementById('game-code-display');
    if (gameCodeDisplay) {
        gameCodeDisplay.textContent = presenterState.gameCode;
    }

    initializeFirebase();
    setupEventListeners();
    generateQRCode();
}

function initializeFirebase() {
    // Controleer eerst of Firebase correct is geïnitialiseerd
    if (typeof firebase === 'undefined') {
        console.error('Firebase is niet correct geladen!');
        return;
    }

    const gameRef = firebase.database().ref(`games/${presenterState.gameCode}`);
    
    // Maak een nieuwe game aan met meer gedetailleerde structuur
    const gameData = {
        active: true,
        currentQuestion: 0,
        players: {},
        startTime: firebase.database.ServerValue.TIMESTAMP,
        currentRound: 1,
        gameCode: presenterState.gameCode,
        status: 'waiting', // waiting, active, finished
        settings: {
            timePerQuestion: 20,
            pointsPerQuestion: 10
        }
    };

    gameRef.set(gameData)
        .then(() => {
            console.log('Game succesvol aangemaakt:', presenterState.gameCode);
            
            // Luister naar speler updates
            gameRef.child('players').on('value', (snapshot) => {
                const players = snapshot.val() || {};
                updatePlayersList(players);
            });

            // Luister naar reacties
            gameRef.child('reactions').on('child_added', handleNewReaction);
        })
        .catch(error => {
            console.error('Fout bij aanmaken game:', error);
            alert('Er ging iets mis bij het aanmaken van de game: ' + error.message);
        });
}

function updatePlayersList(players) {
    const playersList = document.getElementById('players-list');
    if (!playersList) return;

    const playersHTML = Object.entries(players)
        .map(([name, score]) => `
            <div class="player-card animate__animated animate__fadeIn">
                <div class="player-info">
                    <span class="player-name">${name}</span>
                    <span class="player-score">${score} pts</span>
                </div>
            </div>
        `).join('');

    playersList.innerHTML = playersHTML;
    
    const playerCount = Object.keys(players).length;
    const playerCountDisplay = document.getElementById('player-count');
    if (playerCountDisplay) {
        playerCountDisplay.textContent = playerCount;
    }
}

function generateQRCode() {
    const gameUrl = `${window.location.origin}/player.html?game=${presenterState.gameCode}`;
    const qrCodeContainer = document.getElementById('qr-code');
    
    if (qrCodeContainer && typeof QRCode !== 'undefined') {
        QRCode.toCanvas(qrCodeContainer, gameUrl, {
            width: 200,
            margin: 2,
            color: {
                dark: '#4CAF50',
                light: '#ffffff'
            }
        });
    }
}

function startRound() {
    presenterState.isGameActive = true;
    updateQuestionDisplay();
    startTimer(20); // 20 seconden per vraag
}

function previousQuestion() {
    if (presenterState.currentQuestion > 0) {
        presenterState.currentQuestion--;
        updateQuestionDisplay();
    }
}

function nextQuestion() {
    clearTimer();
    presenterState.currentQuestion++;
    updateFirebaseGameState();
    updateQuestionDisplay();
    startTimer(20);
}

function startTimer(duration) {
    clearTimer();
    let timeLeft = duration;
    
    const timerText = document.getElementById('timer-text');
    const timerCircle = document.getElementById('timer-circle');
    
    presenterState.timer = setInterval(() => {
        timerText.textContent = timeLeft;
        const progress = (timeLeft / duration) * 100;
        timerCircle.style.background = `conic-gradient(#4CAF50 ${progress}%, transparent ${progress}%)`;
        
        if (timeLeft <= 0) {
            clearTimer();
            showAnswers();
        }
        timeLeft--;
    }, 1000);
}

function clearTimer() {
    if (presenterState.timer) {
        clearInterval(presenterState.timer);
        presenterState.timer = null;
    }
}

function showResults() {
    const scoresRef = firebase.database().ref(`games/${presenterState.gameCode}/players`);
    scoresRef.once('value').then(snapshot => {
        const scores = snapshot.val() || {};
        const sortedScores = Object.entries(scores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        document.getElementById('question-display').innerHTML = `
            <h2>🏆 Eindresultaten 🏆</h2>
            <div class="final-scores">
                ${sortedScores.map(([name, score], index) => `
                    <div class="score-row ${index < 3 ? 'top-three' : ''}">
                        <span class="position">${index + 1}</span>
                        <span class="name">${name}</span>
                        <span class="score">${score}</span>
                    </div>
                `).join('')}
            </div>
        `;
    });
}

function handleNewReaction(snapshot) {
    const reaction = snapshot.val();
    const reactionDiv = document.createElement('div');
    reactionDiv.className = 'reaction animate__animated animate__fadeIn';
    reactionDiv.innerHTML = `
        <span class="reaction-player">${reaction.player}</span>
        <span class="reaction-emoji">${reaction.emoji}</span>
    `;
    
    const reactionsDisplay = document.getElementById('reactions-display');
    reactionsDisplay.prepend(reactionDiv);
    
    // Verwijder oude reacties
    if (reactionsDisplay.children.length > 5) {
        reactionsDisplay.lastChild.remove();
    }
}

function setupEventListeners() {
    // Luister naar knoppen in de presenter controls
    const startRoundBtn = document.querySelector('button[onclick="startRound()"]');
    const prevBtn = document.querySelector('button[onclick="previousQuestion()"]');
    const nextBtn = document.querySelector('button[onclick="nextQuestion()"]');
    const resultsBtn = document.querySelector('button[onclick="showResults()"]');

    if (startRoundBtn) {
        startRoundBtn.addEventListener('click', () => {
            updateFirebaseGameState();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            updateFirebaseGameState();
        });
    }
}

function updateFirebaseGameState() {
    const gameRef = firebase.database().ref(`games/${presenterState.gameCode}`);
    gameRef.update({
        currentQuestion: presenterState.currentQuestion,
        currentRound: presenterState.currentRound,
        status: presenterState.isGameActive ? 'active' : 'waiting'
    });
}

function updateQuestionDisplay() {
    const rondeData = quizData[`ronde${presenterState.currentRound}`];
    if (!rondeData) {
        showResults();
        return;
    }

    const vraag = rondeData.vragen[presenterState.currentQuestion];
    if (!vraag) {
        presenterState.currentRound++;
        presenterState.currentQuestion = 0;
        updateQuestionDisplay();
        return;
    }

    const questionDisplay = document.getElementById('question-display');
    if (questionDisplay) {
        questionDisplay.innerHTML = `
            <div class="question-container animate__animated animate__fadeIn">
                <h2>Ronde ${presenterState.currentRound}: ${rondeData.titel}</h2>
                <p class="question-text">${vraag.vraag}</p>
                <div class="options-grid">
                    ${vraag.opties.map((optie, index) => `
                        <div class="option">
                            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                            <span class="option-text">${optie}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Update Firebase met de nieuwe vraag status
    updateFirebaseGameState();
} 
