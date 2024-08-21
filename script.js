document.addEventListener("DOMContentLoaded", () => {
    const gridSize = 5;
    const mineCount = 5;
    const initialCash = localStorage.getItem('cashBalance') ? parseInt(localStorage.getItem('cashBalance')) : 1000;
    let cash = initialCash;
    let currentBet = 0;
    let mines = [];
    let gameActive = false;
    let gamesPlayed = 0;
    let gamesWon = 0;
    let gamesLost = 0;
    let startTime;
    let timerInterval;
    let playerName = getCookie('playerName');
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

    const cashAmount = document.getElementById("cash-amount");
    const betAmountInput = document.getElementById("bet-amount");
    const placeBetButton = document.getElementById("place-bet");
    const cashOutButton = document.getElementById("cash-out");
    const resetButton = document.getElementById("reset-button");
    const gameStatus = document.getElementById("game-status");
    const gameContainer = document.getElementById("game-container");
    const gamesPlayedElem = document.getElementById("games-played");
    const gamesWonElem = document.getElementById("games-won");
    const gamesLostElem = document.getElementById("games-lost");
    const gameTimerElem = document.getElementById("game-timer");
    const leaderboardList = document.getElementById("leaderboard-list");

    // Audio elements
    const mineSound = document.getElementById("mine-sound");
    const winSound = document.getElementById("win-sound");
    const loseSound = document.getElementById("lose-sound");

    // Cookie management functions
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + ";" + expires + ";path=/";
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function eraseCookie(name) {
        document.cookie = name + '=; Max-Age=-99999999;';
    }

    function playSound(soundElement) {
        soundElement.currentTime = 0; // Rewind to start
        soundElement.play();
    }

    function updateCash(amount) {
        cash += amount;
        cashAmount.textContent = `Cash: ₹${cash}`;
        localStorage.setItem('cashBalance', cash);  // Store updated cash in localStorage
    }

    function updateStatistics() {
        gamesPlayedElem.textContent = `Games Played: ${gamesPlayed}`;
        gamesWonElem.textContent = `Games Won: ${gamesWon}`;
        gamesLostElem.textContent = `Games Lost: ${gamesLost}`;
    }

    function updateLeaderboard() {
        leaderboardList.innerHTML = "";
        leaderboard.sort((a, b) => b.cash - a.cash).forEach((entry, index) => {
            if (index < 5) { // Show top 5 entries
                const listItem = document.createElement("li");
                listItem.textContent = `${entry.name}: ₹${entry.cash}`;
                leaderboardList.appendChild(listItem);
            }
        });

        // Save leaderboard to local storage
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    }

    function startTimer() {
        startTime = Date.now();
        timerInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            gameTimerElem.textContent = `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function initializeGame() {
        gameContainer.innerHTML = "";
        mines = [];
        gameActive = true;
        resetButton.disabled = false;
        gameStatus.textContent = "Click on a cell to start the game.";
        startTime = Date.now();
        startTimer();

        // Set up the grid
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.index = i;
            cell.addEventListener("click", handleCellClick);
            gameContainer.appendChild(cell);
        }

        // Place mines
        while (mines.length < mineCount) {
            const minePosition = Math.floor(Math.random() * gridSize * gridSize);
            if (!mines.includes(minePosition)) {
                mines.push(minePosition);
            }
        }
    }

    function handleCellClick(event) {
        if (!gameActive) return;

        const cellIndex = parseInt(event.target.dataset.index);
        if (mines.includes(cellIndex)) {
            revealMines();
            event.target.classList.add("mine");
            event.target.textContent = "💣";
            gameStatus.textContent = "Game Over! You hit a mine.";
            updateCash(-currentBet); // Lose the bet amount
            gamesLost++;
            gameActive = false;
            stopTimer();
            resetButton.disabled = false;
            playSound(mineSound); // Play mine sound
            addToLeaderboard();
        } else {
            event.target.classList.add("safe");
            event.target.textContent = "✔️";
            // Check if all non-mine cells are revealed
            const revealedCells = document.querySelectorAll(".cell.safe").length;
            if (revealedCells === (gridSize * gridSize - mineCount)) {
                gameStatus.textContent = "Congratulations! You won.";
                updateCash(currentBet); // Win the bet amount
                gamesWon++;
                gameActive = false;
                stopTimer();
                resetButton.disabled = false;
                playSound(winSound); // Play win sound
                addToLeaderboard();
            }
        }
        updateStatistics();
    }

    function revealMines() {
        document.querySelectorAll(".cell").forEach(cell => {
            const cellIndex = parseInt(cell.dataset.index);
            if (mines.includes(cellIndex)) {
                cell.classList.add("mine");
                cell.textContent = "💣";
            }
        });
    }

    function addToLeaderboard() {
        if (playerName) {
            let playerEntry = leaderboard.find(entry => entry.name === playerName);
            if (playerEntry) {
                playerEntry.cash = cash; // Update the cash amount for the existing player
            } else {
                leaderboard.push({ name: playerName, cash: cash }); // Add new player
            }
            updateLeaderboard();
        } else {
            const newName = prompt("Enter your name:");
            if (newName) {
                playerName = newName;
                setCookie('playerName', playerName, 365); // Store the name in a cookie for 1 year
                addToLeaderboard();
            }
        }
    }

    placeBetButton.addEventListener("click", () => {
        const betAmount = parseInt(betAmountInput.value);
        if (betAmount > 0 && betAmount <= cash) {
            currentBet = betAmount;
            initializeGame();
            gameStatus.textContent = "Game started! Click on a cell.";
        } else {
            alert("Invalid bet amount or insufficient cash.");
        }
    });

    cashOutButton.addEventListener("click", () => {
        alert(`You cashed out with ₹${cash}`);
        resetButton.disabled = false;
        gameActive = false;
        updateCash(-currentBet); // Deduct bet amount on cash out
        currentBet = 0;
        gameStatus.textContent = "Game ended. Place a bet to play again.";
        stopTimer();
        playSound(loseSound); // Play lose sound
        addToLeaderboard();
    });

    resetButton.addEventListener("click", () => {
        if (!gameActive) return;
        initializeGame();
        gameStatus.textContent = "Game reset. Place a new bet.";
    });

    document.getElementById('addMoneyButton').addEventListener('click', function(e) {
        e.preventDefault();
    


        updateCash(userAmount);
    });

    // Razorpay Integration
    document.getElementById('payButton').addEventListener('click', function() {
        const options = {
            "key": "rzp_test_lkyxAo5AfDlADG", // Replace with your Razorpay key
            "amount": "100000", // Amount in paise (₹1000)
            "currency": "INR",
            "name": "Mine Game",
            "description": "Add Cash to Play",
            "handler": function (response) {
                // Handle success
                alert("Payment successful!");
                revealMinesSequence();
            },
            "theme": {
                "color": "#3399cc"
            }
        };
        const paymentObject = new Razorpay(options);
        paymentObject.open();
    });

    function revealMinesSequence() {
        const cells = document.querySelectorAll(".cell");
        let sequence = "";
        mines.forEach((index, i) => {
            setTimeout(() => {
                cells[index].classList.add("mine");
                cells[index].textContent = "💣";
                sequence += `${index + 1} `;
            }, i * 2000); // Show each mine for 2 seconds
        });

        setTimeout(() => {
            alert(`Mines were at positions: ${sequence}`);
            cells.forEach(cell => cell.classList.remove("mine"));
            cells.forEach(cell => cell.textContent = "");
        }, mines.length * 2000);
    }

    document.getElementById('addMoneyButton').addEventListener('click', function(e) {
        e.preventDefault();
        
        // Prompt the user to enter the amount they want to add, ensure it is greater than ₹10
        let userAmount = parseFloat(prompt("Enter the amount you want to add (Minimum ₹10):"));
        
        // Validate the user input
        if (isNaN(userAmount) || userAmount < 10) {
            alert("Invalid amount. Please enter a value greater than ₹10.");
            return;
        }
        
        const amountToAdd = userAmount * 100; // Convert to paise
        
        // Define Razorpay options
        const options = {
            "key": "rzp_test_lkyxAo5AfDlADG", // Your Razorpay key_id
            "amount": amountToAdd, // Amount is in currency subunits (paise)
            "currency": "INR",
            "name": "Mine Game",
            "description": "Add Money to Wallet",
            "handler": function(response) {
                // Success callback
                const updatedCash = parseInt(cashAmount.textContent.replace('Cash: ₹', '')) + userAmount;
                cash = updatedCash;
                cashAmount.textContent = `Cash: ₹${updatedCash}`;
                localStorage.setItem('cashBalance', cash);  // Store the updated cash in localStorage
                alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
            },
            "theme": {
                "color": "#3399cc"
            }
        };
    
        // Create a new Razorpay instance and open it
        const rzp1 = new Razorpay(options);
        rzp1.open();
        
        // Handle payment failure
        rzp1.on('payment.failed', function(response) {
            alert(`Payment failed: ${response.error.description}`);
        });
    });
    
    

    updateCash(0); // Initialize cash display
    updateStatistics();
    updateLeaderboard();
});
