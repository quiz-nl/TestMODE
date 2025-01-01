const presenterState = {
    currentQuestion: 0,
    gameCode: null,
    activeQuestion: null
};

function initPresenter() {
    // Genereer unieke game code
    presenterState.gameCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // Initialiseer Firebase game sessie
    const gameRef = firebase.database().ref(`games/${presenterState.gameCode}`);
    gameRef.set({
        active: true,
        currentQuestion: 0,
        players: {},
        startTime: firebase.database.ServerValue.TIMESTAMP
    });

    // Genereer QR code voor game
    const gameUrl = `${window.location.origin}/player.html?game=${presenterState.gameCode}`;
    QRCode.toCanvas(document.getElementById('qr-code'), gameUrl, {
        width: 300,
        margin: 2
    });

    // Start live scorebord updates
    initLeaderboard();
}

function nextQuestion() {
    presenterState.currentQuestion++;
    const questionRef = firebase.database().ref(`games/${presenterState.gameCode}`);
    questionRef.update({
        currentQuestion: presenterState.currentQuestion,
        questionStartTime: firebase.database.ServerValue.TIMESTAMP
    });
    updateQuestionDisplay();
}

function updateQuestionDisplay() {
    const question = quizData[`ronde${Math.floor(presenterState.currentQuestion / 5) + 1}`]
        .vragen[presenterState.currentQuestion % 5];
    
    document.getElementById('question-display').innerHTML = `
        <h3>${question.vraag}</h3>
        <div class="options">
            ${question.opties.map((optie, index) => `
                <div class="option">${String.fromCharCode(65 + index)}. ${optie}</div>
            `).join('')}
        </div>
    `;
}

function initLeaderboard() {
    const scoresRef = firebase.database().ref(`games/${presenterState.gameCode}/players`);
    scoresRef.on('value', (snapshot) => {
        const scores = snapshot.val() || {};
        updateLeaderboard(scores);
    });
}

function updateLeaderboard(scores) {
    const sortedPlayers = Object.entries(scores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    document.getElementById('scores-display').innerHTML = `
        <div class="leaderboard-grid">
            ${sortedPlayers.map(([name, score], index) => `
                <div class="player-row ${index < 3 ? 'top-three' : ''}">
                    <span class="position">${index + 1}</span>
                    <span class="name">${name}</span>
                    <span class="score">${score}</span>
                </div>
            `).join('')}
        </div>
    `;
} 