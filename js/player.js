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
    achievements: new Set(),
    currentAnswer: null,
    timer: null
};

// Initialiseer speler bij laden
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameCode = urlParams.get('game');
    const playerName = urlParams.get('name');

    if (gameCode && playerName) {
        playerState.gameCode = gameCode;
        playerState.name = playerName;
        
        // Auto-join de game met de naam en volledige speler data
        const gameRef = firebase.database().ref(`games/${gameCode}/players/${playerName}`);
        gameRef.set({
            name: playerName,
            score: 0,
            joinedAt: firebase.database.ServerValue.TIMESTAMP,
            lastAnswer: null
        })
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
    const gameCode = document.getElementById('game-code').value.toUpperCase();
    const playerName = document.getElementById('player-name').value;
    
    if (!gameCode || !playerName) {
        alert('Vul beide velden in');
        return;
    }
    
    // Update playerState met de game informatie
    playerState.gameCode = gameCode;
    playerState.name = playerName;
    
    const gameRef = firebase.database().ref(`games/${gameCode}`);
    
    gameRef.once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                alert('Game niet gevonden');
                return;
            }
            
            // Update UI
            document.getElementById('welcome-screen').style.display = 'none';
            document.getElementById('game-screen').style.display = 'block';
            document.getElementById('display-name').textContent = playerName;
            document.getElementById('current-game-code').textContent = gameCode;
            
            // Voeg speler toe aan Firebase met de juiste structuur
            gameRef.child('players').child(playerName).set({
                name: playerName,
                score: 0,
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
                lastAnswer: null
            });
            
            // Start met luisteren naar game updates
            initGameListeners();
        })
        .catch(error => {
            console.error('Error joining game:', error);
            alert('Er ging iets mis bij het joinen van de game');
        });
}

function initGameListeners() {
    const gameRef = firebase.database().ref(`games/${playerState.gameCode}`);
    
    gameRef.on('value', (snapshot) => {
        const gameData = snapshot.val();
        if (!gameData) return;

        if (gameData.currentQuestion !== undefined && gameData.currentRound !== undefined) {
            playerState.currentAnswer = null; // Reset het antwoord voor de nieuwe vraag
            showCurrentQuestion(gameData.currentRound, gameData.currentQuestion);
            
            // Start de timer als de game actief is
            if (gameData.status === 'active') {
                startTimer(20); // 20 seconden per vraag
            }
        }
    });
}

function showCurrentQuestion(round, questionNumber) {
    const rondeData = quizData[`ronde${round}`];
    if (!rondeData || !rondeData.vragen[questionNumber]) {
        console.error('Vraag niet gevonden');
        return;
    }

    const vraag = rondeData.vragen[questionNumber];
    const gameScreen = document.getElementById('game-screen');
    
    // Voeg vraag sectie toe aan game-screen
    const questionSection = document.createElement('div');
    questionSection.className = 'question-section animate__animated animate__fadeIn';
    questionSection.innerHTML = `
        <h2>Ronde ${round}</h2>
        <p class="question-text">${vraag.vraag}</p>
        <div class="options-grid">
            ${vraag.opties.map((optie, index) => `
                <button onclick="submitAnswer(${index})" class="option-btn">
                    <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                    <span class="option-text">${optie}</span>
                </button>
            `).join('')}
        </div>
    `;

    // Vervang bestaande vraag sectie of voeg nieuwe toe
    const existingQuestion = gameScreen.querySelector('.question-section');
    if (existingQuestion) {
        existingQuestion.replaceWith(questionSection);
    } else {
        gameScreen.appendChild(questionSection);
    }
}

function submitAnswer(answerIndex) {
    // Voorkom dubbele antwoorden
    if (playerState.currentAnswer !== null) return;
    
    playerState.currentAnswer = answerIndex;
    const gameRef = firebase.database().ref(`games/${playerState.gameCode}`);
    
    // Sla het antwoord op in Firebase
    gameRef.child('players').child(playerState.name).update({
        lastAnswer: {
            index: answerIndex,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }
    });

    // Markeer de gekozen optie
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach((btn, index) => {
        btn.disabled = true;
        if (index === answerIndex) {
            btn.classList.add('selected');
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
    // Eerst controleren of alle elementen bestaan
    const welcomeScreen = document.getElementById('welcome-screen');
    const gameScreen = document.getElementById('game-screen');
    const displayName = document.getElementById('display-name');
    const currentGameCode = document.getElementById('current-game-code');

    if (!welcomeScreen || !gameScreen || !displayName || !currentGameCode) {
        console.error('Kon niet alle benodigde elementen vinden');
        return;
    }

    // Update de weergave
    welcomeScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    displayName.textContent = playerName;
    currentGameCode.textContent = gameCode;
}

function startTimer(duration) {
    clearTimer(); // Zorg ervoor dat er geen andere timer loopt
    
    const timerText = document.querySelector('.timer-text');
    const timerCircle = document.querySelector('.timer-circle');
    
    if (!timerText || !timerCircle) {
        console.error('Timer elementen niet gevonden');
        return;
    }
    
    let timeLeft = duration;
    
    playerState.timer = setInterval(() => {
        timeLeft--;
        
        if (timerText) {
            timerText.textContent = timeLeft;
        }
        
        const progress = (timeLeft / duration) * 100;
        if (timerCircle) {
            timerCircle.style.background = `conic-gradient(#4CAF50 ${progress}%, transparent ${progress}%)`;
        }
        
        if (timeLeft <= 0) {
            clearTimer();
            // Als er geen antwoord is gegeven, stuur -1
            if (playerState.currentAnswer === null) {
                submitAnswer(-1);
            }
        }
    }, 1000);
}

function clearTimer() {
    if (playerState.timer) {
        clearInterval(playerState.timer);
        playerState.timer = null;
    }
} 
