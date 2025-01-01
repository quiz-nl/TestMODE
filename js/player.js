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
    const urlParams = new URLSearchParams(window.location.search);
    const gameCode = urlParams.get('game');
    const playerName = urlParams.get('name');

    if (gameCode && playerName) {
        playerState.gameCode = gameCode;
        playerState.name = playerName;
        
        // Auto-join de game met de naam
        const gameRef = firebase.database().ref(`games/${gameCode}/players/${playerName}`);
        gameRef.set(0)
            .then(() => {
                updateGameDisplay(gameCode, playerName);
                initGameListeners();
            })
            .catch(error => {
                alert('Kon niet deelnemen aan het spel: ' + error.message);
            });
    }
});

function joinGame() {
    const gameCodeInput = document.getElementById('game-code');
    const playerNameInput = document.getElementById('player-name');

    if (!gameCodeInput || !playerNameInput) {
        console.error('Kon de invoervelden niet vinden');
        return;
    }

    const gameCode = gameCodeInput.value.trim().toUpperCase();
    const playerName = playerNameInput.value.trim();
    
    if (!gameCode) {
        alert('Vul eerst de game code in!');
        return;
    }
    if (!playerName) {
        alert('Vul eerst je naam in!');
        return;
    }

    // Controleer eerst of de game bestaat
    const gameRef = firebase.database().ref(`games/${gameCode}`);
    gameRef.once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                alert('Deze game bestaat niet!');
                return;
            }

            playerState.gameCode = gameCode;
            playerState.name = playerName;
            
            // Voeg speler toe aan de game
            return gameRef.child(`players/${playerName}`).set(0);
        })
        .then(() => {
            updateGameDisplay(gameCode, playerName);
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

function updateGameDisplay(gameCode, playerName) {
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    document.getElementById('display-name').textContent = playerName;
    document.getElementById('current-game-code').textContent = gameCode;
} 
