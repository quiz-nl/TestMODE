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
    document.getElementById('game-code-display').textContent = presenterState.gameCode;
    
    initializeFirebase();
    setupEventListeners();
    initializeQRCode();
}

function initializeFirebase() {
    const gameRef = firebase.database().ref(`games/${presenterState.gameCode}`);
    gameRef.set({
        active: true,
        currentQuestion: 0,
        players: {},
        startTime: firebase.database.ServerValue.TIMESTAMP,
        currentRound: 1
    });

    // Luister naar speler updates
    gameRef.child('players').on('value', updatePlayersList);
    gameRef.child('reactions').on('child_added', handleNewReaction);
}

function initializeQRCode() {
    const gameUrl = `${window.location.origin}/player.html?game=${presenterState.gameCode}`;
    QRCode.toCanvas(document.getElementById('qr-code'), gameUrl, {
        width: 300,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    });
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

// Voeg deze helper functies toe aan het einde van het bestand
function updatePlayersList(snapshot) {
    const players = snapshot.val() || {};
    const count = Object.keys(players).length;
    document.getElementById('player-count').textContent = count;
    
    updateLeaderboard(players);
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
