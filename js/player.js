const playerState = {
    name: '',
    score: 0,
    gameCode: null,
    powerUps: {
        timeFreeze: 2,
        doublePoints: 2,
        fiftyFifty: 2
    },
    streak: 0,
    achievements: new Set()
};

// Initialiseer speler bij laden
document.addEventListener('DOMContentLoaded', () => {
    // Haal game code uit URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const gameCode = urlParams.get('game');
    if (gameCode) {
        playerState.gameCode = gameCode;
        document.getElementById('display-name').textContent = `Game: ${gameCode}`;
    }
});

function joinGame() {
    const playerName = document.getElementById('player-name').value.trim();
    if (!playerName) {
        alert('Vul eerst je naam in!');
        return;
    }

    playerState.name = playerName;
    const gameRef = firebase.database().ref(`games/${playerState.gameCode}/players/${playerName}`);
    
    gameRef.set(0)
        .then(() => {
            document.getElementById('welcome-screen').style.display = 'none';
            document.getElementById('game-screen').style.display = 'block';
            document.getElementById('display-name').textContent = playerName;
            initGameListeners();
        })
        .catch(error => {
            alert('Kon niet deelnemen aan het spel: ' + error.message);
        });
}

function initGameListeners() {
    const gameRef = firebase.database().ref(`games/${playerState.gameCode}`);
    gameRef.on('value', (snapshot) => {
        const gameData = snapshot.val();
        if (gameData.currentQuestion !== undefined) {
            updateQuestionDisplay(gameData.currentQuestion);
        }
    });
}

function usePowerUp(type) {
    if (playerState.powerUps[type] > 0) {
        playerState.powerUps[type]--;
        const powerUpBtn = document.querySelector(`[onclick="usePowerUp('${type}')"]`);
        powerUpBtn.textContent = `${powerUpBtn.textContent.split('(')[0]}(${playerState.powerUps[type]})`;
        
        switch(type) {
            case 'timeFreeze':
                freezeTimer();
                break;
            case 'doublePoints':
                activateDoublePoints();
                break;
            case 'fiftyFifty':
                removeTwoWrongAnswers();
                break;
        }
    }
}

function sendReaction(emoji) {
    const reactionRef = firebase.database().ref(`games/${playerState.gameCode}/reactions`);
    reactionRef.push({
        player: playerState.name,
        emoji: emoji,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    showReactionAnimation(emoji);
}

function showReactionAnimation(emoji) {
    const reaction = document.createElement('div');
    reaction.className = 'floating-reaction animate__animated animate__fadeOutUp';
    reaction.textContent = emoji;
    document.getElementById('reactions-container').appendChild(reaction);
    
    setTimeout(() => reaction.remove(), 2000);
}

// Voeg deze functies toe voor de power-ups
function freezeTimer() {
    // Implementatie voor timer bevriezen
}

function activateDoublePoints() {
    // Implementatie voor dubbele punten
}

function removeTwoWrongAnswers() {
    // Implementatie voor fifty-fifty
} 