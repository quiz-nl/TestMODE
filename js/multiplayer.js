// Game state
const gameState = {
    playerName: '',
    teamCode: null,
    isHost: false
};

document.addEventListener('DOMContentLoaded', () => {
    const testBtn = document.getElementById('testFirebaseBtn');
    if (testBtn) {
        testBtn.addEventListener('click', testFirebase);
    }
});

// Debug functie
function testFirebase() {
    console.log("Testing Firebase connection...");
    const testRef = firebase.database().ref('test');
    testRef.set({
        test: 'Dit is een test',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        console.log('Firebase test succesvol');
        alert('Firebase connectie werkt!');
    }).catch(error => {
        console.error('Firebase test mislukt:', error);
        alert('Firebase connectie mislukt: ' + error.message);
    });
}

// Maak de functie globaal beschikbaar
window.testFirebase = testFirebase;

function startMultiplayer() {
    const playerName = prompt("Voer je naam in:");
    if (!playerName) return;

    gameState.playerName = playerName;
    gameState.teamCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    gameState.isHost = true;

    const gameRef = firebase.database().ref(`games/${gameState.teamCode}`);
    gameRef.set({
        host: gameState.playerName,
        players: {[gameState.playerName]: 0},
        currentQuestion: 0,
        active: true,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        alert(`Game gestart! Team code: ${gameState.teamCode}`);
        initGameListeners();
    }).catch(error => {
        console.error("Error starting game:", error);
        alert("Er ging iets mis bij het starten van de game: " + error.message);
    });
}

function updateGameState(snapshot) {
    const data = snapshot.val();
    if (!data) return;

    const playersList = document.getElementById('players-list');
    if (playersList && data.players) {
        playersList.innerHTML = Object.entries(data.players)
            .map(([name, score]) => `
                <div class="player-card animate__animated animate__fadeIn">
                    <div class="player-info">
                        <span class="player-name">${name}</span>
                        <span class="player-score">${score} pts</span>
                    </div>
                </div>
            `).join('');
    }
}

function initGameListeners() {
    const gameRef = firebase.database().ref(`games/${gameState.teamCode}`);
    gameRef.on('value', updateGameState);
}
