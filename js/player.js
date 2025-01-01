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
    clearTimer();
    let timeLeft = duration;
    
    const timerContainer = document.createElement('div');
    timerContainer.className = 'timer-container';
    timerContainer.innerHTML = `
        <div class="timer-circle">
            <span class="timer-text">${timeLeft}</span>
        </div>
    `;
    
    // Voeg timer toe aan het game-screen
    const gameScreen = document.getElementById('game-screen');
    const existingTimer = gameScreen.querySelector('.timer-container');
    if (existingTimer) {
        existingTimer.remove();
    }
    gameScreen.insertBefore(timerContainer, gameScreen.firstChild);
    
    playerState.timer = setInterval(() => {
        timeLeft--;
        const timerText = timerContainer.querySelector('.timer-text');
        if (timerText) {
            timerText.textContent = timeLeft;
        }
        
        const progress = (timeLeft / duration) * 100;
        const timerCircle = timerContainer.querySelector('.timer-circle');
        if (timerCircle) {
            timerCircle.style.background = `conic-gradient(#4CAF50 ${progress}%, transparent ${progress}%)`;
        }
        
        if (timeLeft <= 0) {
            clearTimer();
            // Forceer antwoord submission als er geen antwoord is gegeven
            if (playerState.currentAnswer === null) {
                submitAnswer(-1); // -1 voor geen antwoord
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
