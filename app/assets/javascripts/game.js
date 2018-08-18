let Game = function() {
  /********************************************************************
  /* START -> Methods that get called from channel script Game.coffee *
  /********************************************************************/

  this.init = function(playerId, letters, firstToGo, challengable, timeLimit, pointsLimit, opponentId=null,  opponentName=null) {
    // Make sure this method is called only at the beginning
    if (!this.playerId) {
      this.playerId = playerId;
      this.opponentId = opponentId;
      this.opponentName = opponentName;

      this.timeLimit = Number(timeLimit);
      this.pointsLimit = Number(pointsLimit);

      this.tileClicked = '';
      this.draggedTile = null;

      this.rackTiles = [];

      this.wordTiles = [];
      this.word = '';
      this.words = [];

      this.isFirstMove = firstToGo;
      this.myTurn = firstToGo;
      this.started = !!this.opponentId;

      this.passedLetters = [];
      this.passes = 0;
      this.passingEnd = false;

      this.challengable = challengable;
      this.canChallenge = true;
      this.isChallenged = false;
      this.challenging = false;
      this.drawnTiles = [];
      this.prevTurnScore = 0;
      this.deductedPoints = 0;
      this.prevWordTiles = [];
      this.prevWords = [];
      this.finalChallengeAlreadyDone = false;

      this.aboutToEnd = false;

      this.totalScore = 0;
      this.opponentScore = 0;

      this.letterPoints = {};
      'LSUNRTOAIE'.split('').forEach(l => this.letterPoints[l] = 1);
      'GD'.split('').forEach(l => this.letterPoints[l] = 2);
      'BCMP'.split('').forEach(l => this.letterPoints[l] = 3);
      'FHVWY'.split('').forEach(l => this.letterPoints[l] = 4);
      'JX'.split('').forEach(l => this.letterPoints[l] = 8);
      'QZ'.split('').forEach(l => this.letterPoints[l] = 10);
      this.letterPoints['K'] = 5;
      this.letterPoints[' '] = 0;

      this.doubleLetterBonus = 'a4 a12 c7 c9 d1 d8 d15 g3 g7 g9 g13 h4 h12 o4 o12 m7 m9 l1 l8 l15 i3 i7 i9 i13'.split(' ');
      this.tripleLetterBonus = 'b6 b10 n6 n10 f2 f6 f10 f14 j2 j6 j10 j14'.split(' ');
      this.doubleWordBonus = 'h8 b2 c3 d4 e5 b14 c13 d12 e11 n2 m3 l4 k5 n14 m13 l12 k11'.split(' ');
      this.tripleWordBonus = 'a1 a8 a15 h15 o15 h1 o8 o1'.split(' ');

      this.gameIsReady = false; // This flag is to prevent these functions to be called again from console.

      this.prepareBoard();
      this.prepareRack();
      this.addButtonHandlers();
      this.prepareInfoArea();
      this.prepareChat();
      this.addDialogueHandlers();
      this.populateRack(letters);

      if (this.timeLimit && this.opponentId) {
        this.startCountdown();
      }

      this.gameIsReady = true;
    }
  }

  this.setOpponent = function(opponentId, opponentName) {
    this.opponentId = opponentId;
    this.opponentName = opponentName;
    this.messagesArea.children[2].textContent = this.opponentName + ": 0";
    this.started = true;

    if (this.timeLimit) {
      this.startCountdown();
    }
  }

  this.writeToChat = function(message) {
    // If this is the very first message to be written, no need for a new line.
    // • was for preventing to break code because of space between words.
    if (this.chatArea.value == "") {
      this.chatArea.value = this.opponentName + ": " + message.replace(/[•]/g, ' ');
    } else {
      this.chatArea.value += '\n' + this.opponentName + ": " + message.replace(/[•]/g, ' ');;
    }
  }

  this.placeTile = function(id, letter) {
    // If the letter to be placed is wild tile, '*' is appended to the letter
    letter = letter.split("");

    let tile = document.getElementById(id);
    tile.draggable = false;
    tile.innerHTML = '<span></span><sub></sub>';
    tile.getElementsByTagName('span')[0].textContent = letter[0] == "." ? " " : letter[0];
    
    // If the letter to be placed is wild tile, length is two
    if (letter.length > 1) {
      tile.getElementsByTagName("sub")[0].textContent = 0;
    } else {
      tile.getElementsByTagName("sub")[0].textContent = this.letterPoints[letter[0]];
    }

    this.determineTileBackground(tile);
  }

  this.removeTile = function(id) {
    let tile = document.getElementById(id);
    tile.innerHTML = "";
    tile.draggable = true;
    this.determineTileBackground(tile);
  }

  this.processValidWords = function() {
    if (this.aboutToEnd) {
      // It was the last word to be challenged.
      App.game.deliver_score(this.totalScore, true);
    } else if (this.isChallenged) {
      // The word was challenged and proved to be valid. Turn passes. No letters to be drawn.
      App.game.switch_turn(0, this.passes);
    } else if (this.word) {
      // Good old valid word.
      this.totalScore += this.calcPoints();
      this.deactivateWordTiles();
      this.resetTurn();

      App.game.deliver_score(this.totalScore, false);
      App.game.switch_turn(7 - this.rackTiles.filter(node => node.innerHTML).length, this.passes);

      this.passes = 0;
    } else {
      App.game.printMessage("Tile placement is not valid!");
    }
  }

  this.processInvalidWords = function(word) {
    if (this.isChallenged) {
      this.aboutToEnd = false;
      this.isChallenged = false;
      this.totalScore -= this.prevTurnScore;

      this.activateWordTiles();
      this.replaceRackTiles();

      this.messagesArea.firstChild.textContent = "You:" + this.totalScore;

      App.game.printMessage("You have been challenged! '" + word + "' is not a valid word!");
      App.game.deliver_score(this.totalScore, false);
    } else {
      App.game.printMessage("'" + word + "' is not a valid word!");
    }

    this.words = [];
  }

  this.challenge = function(last) {
    this.aboutToEnd = last;
    this.isChallenged = true;

    let wordsAsString = this.prevWords.map(word => word.map(tile => tile.getElementsByTagName("SPAN")[0].textContent).join("")).join(" ");

    App.game.validate_words(wordsAsString);
  }

  this.passLetters = function(letters) {
    this.passes += 1;

    letters = letters.replace(/\./g, ' ').split("")

    for (let i = 0; i < letters.length; i++) {
      let rackTile = this.rackTiles.find(tile => tile.textContent[0] === this.passedLetters[i]);
      rackTile.getElementsByTagName('span')[0].textContent = letters[i];
      rackTile.lastChild.textContent = this.letterPoints[letters[i]];
    }

    App.game.switch_turn(0, this.passes);
  }

  this.switchTurn = function(letters, letRemaining, passes, gameOver) {
    this.myTurn = !this.myTurn;
    this.finalChallengeAlreadyDone = false;

    if (this.pointsLimit && (this.opponentScore >= this.pointsLimit || this.totalScore >= this.pointsLimit)) {
      App.game.finalize_game(false, true, false);
    } else {
      if (this.myTurn) {
        this.drawnTiles = [];
      }

      if (this.passes >= 3 && Number(passes) >= 3) {
        App.game.finalize_game(true, false, false);
      } else if (gameOver == "true" && this.rackTiles.every(tile => !tile.innerHTML)) {
        App.game.finalize_game(false, false, false);
      } else {
        if (letters) {
          this.populateRack(letters.split(""));
        }

        this.messagesArea.children[6].textContent = 'Letters in Bag: ' + letRemaining;

        this.canChallenge = true;

        if (this.isChallenged) {
          this.isChallenged = false;
          App.game.printMessage("A challenge against you failed! Your turn...");
        } else if (this.myTurn) {
          App.game.printMessage("Your turn...");
        } else if (this.challenging) {
          this.challenging = false;
          App.game.printMessage("Challenge failed! Opponent's turn...");
        } else {
          App.game.printMessage("Opponent's turn...");
        }
      }
    }
  }

  this.updateScore = function(score) {
    if (this.challenging) {
      this.challenging = false;
      App.game.printMessage("Challenge successful! Your turn...");
    }

    pElems = this.messagesArea.children;

    pElems[0].textContent = 'You: ' + this.totalScore;
    pElems[2].textContent = this.opponentName + ': ' + score;
    this.opponentScore = score;
  }

  this.cancelGame = function() {
    App.game.printMessage("The game has been forfeited by the opponent. You are the winner.");
    this.deactivateBoardAndButtons();
    App.game.register_scores(this.totalScore, true);
  }

  this.finishGame = function(passEnding, pointsLimit, timeLimit) {
    // This is to prevent duplicate execution
    if (!this.finalChallengeAlreadyDone) {
      if (passEnding) {
        this.deductPoints(pointsLimit);
      } else if (this.challengable && !timeLimit) {
        if (this.myTurn) {
          if (confirm("The game is about to end. Would you like to challenge the last word?")) {
            App.game.challenge(true);
          } else {
            this.deductPoints(pointsLimit);
          }
        } else {
          App.game.printMessage("Waiting to see if your opponent will challenge your last word...");
        }
      } else {
        this.deductPoints(pointsLimit);
      }

      this.finalChallengeAlreadyDone = true;
    }
  }

  this.theEnd = function() {
    this.myTurn = false;
    this.started = false;

    this.deactivateBoardAndButtons();

    let winner = null;

    if (this.pointsLimit && this.pointsLimit <= this.totalScore || this.pointsLimit <= this.opponentScore) {
      if (this.opponentScore >= this.pointsLimit) {
        winner = false;
        App.game.printMessage("Points Limit has been reached! Your opponent has won the game by " + this.opponentScore + " points!");
      } else if ( this.totalScore >= this.pointsLimit) {
        winner = true;
        App.game.printMessage("Points Limit has been reached! You have won the game by " + this.totalScore + " points!");
      }
    } else if (this.totalScore > this.opponentScore) {
      winner = true;
      App.game.printMessage("Game is over! After points deducted for remaining letters on your racks, you won with " + this.totalScore + " points!");
    } else if (this.totalScore < this.opponentScore) {
      winner = false;
      App.game.printMessage("Game is over! After points deducted for remaining letters on your racks, your opponent won with " + this.opponentScore + " points!");
    } else {
      App.game.printMessage("Game is over! After points deducted for remaining letters on your racks, it is a tie with " + this.totalScore + " points!");
    }

    App.game.register_scores(this.totalScore, winner);
  }

  /************************************************************
  /* START -> Methods to get the game layout and events ready *
  /************************************************************/

  this.prepareBoard = function() {
    if (!this.gameIsReady) {
      let board = document.getElementById('board');

      for (let i = 1; i <= 15; i++) {
        for (let j = 97; j <= 111; j++) {
          let tile = document.createElement('div');
          tile.id = String.fromCharCode(j) + i;
          tile.className = 'tile';
          this.determineTileBackground(tile);

          tile.addEventListener('contextmenu', event => {
            let target = event.target;

            // Because of event capturing, this is necessary
            if (['SPAN', 'SUB'].includes(event.target.nodeName)) {
              target = event.target.parentNode;
            }

            if (target.innerHTML && target.draggable && this.opponentId) {
              // Prevent context menu to pop up
              event.preventDefault();

              // Find the first empty spot in rack
              let rackTile = this.rackTiles.filter((tile) => tile.innerHTML === '')[0];

              rackTile.innerHTML = target.innerHTML;
              target.innerHTML = '';
              this.determineTileBackground(rackTile);
              this.determineTileBackground(target);
            }
          });

          this.addDefaultHandlers(tile);
          board.appendChild(tile);
        }
      }
    }
  }

  this.prepareRack = function() {
    if (!this.gameIsReady) {
      let rack = document.getElementById('rack');

      for (let i = 0; i < 7; i++) {
        let rackTile = document.createElement('div');
        rackTile.className = 'rack-tile';
        this.addDefaultHandlers(rackTile);
        this.rackTiles.push(rackTile);
        rack.appendChild(rackTile);
      }
    }
  }

  this.addButtonHandlers = function() {
    if (!this.gameIsReady) {
      let submitButton = document.getElementById('submit');
      submitButton.addEventListener('click', event => {
        if (this.myTurn && this.opponentId) {
          this.setWildTileAndSubmit();
        }
      });

      let passButton = document.getElementById('pass');
      passButton.addEventListener('click', event => {
        if (this.myTurn && this.opponentId) {
          this.showDialogue("Enter letters to change: ", null);
        }
      });

      if (this.challengable) {
        let challengeButton = document.getElementById("challenge");
        challengeButton.addEventListener('click', event => {
          if (this.myTurn && !this.isFirstMove && this.canChallenge && this.opponentId) {
            this.removeTilesFromBoard();

            this.challenging = true;
            this.canChallenge = false;
            App.game.challenge(false);
          }
        })
      }

      let shuffleButton = document.getElementById('shuffle');
      shuffleButton.addEventListener('click', event => {
        let tiles = [];

        // Get tiles from tile nodes
        for (let i = 0; i < this.rackTiles.length; i++) {
          tiles.push(this.rackTiles[i].innerHTML)
        }

        // Durstenfeld shuffle algorithm to randomize letters.
        for (let i = tiles.length - 1; i > 0; i--) {
          let j = Math.floor(Math.random() * (i + 1));
          [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }

        // Place letter values to tile nodes
        for (let i = 0; i < this.rackTiles.length; i++) {
          this.rackTiles[i].innerHTML = tiles[i];
          this.determineTileBackground(this.rackTiles[i]);
        }
      });

      let forfeitButton = document.getElementById('forfeit');
      forfeitButton.addEventListener('click', event => {
        if (this.started) {
          if (confirm("Are you sure to forfeit the game? 50 points will be deducted from your overall score.")) {
            this.forfeit();
          }
        }
      });
    }
  }

  this.prepareInfoArea = function() {
    if (!this.gameIsReady) {
      this.messagesArea = document.getElementById('messages-area');

      this.messagesArea.innerHTML = '<p class="float-left">You: 0</p><span id="clock"></span><p class="float-right">' + (this.opponentName || 'Opponent') + ': 0</p><hr class="clear"><p id="message" class="mt-4"></p><hr><p class="my-0">Letters in Bag: 86</p>';

      if (this.pointsLimit > 0) {
        this.messagesArea.innerHTML += "<p class='my-0'>Points Limit is set to " + this.pointsLimit + ".</p>";
      }
    }
  }

  this.prepareChat = function() {
    if (!this.gameIsReady) {
      this.chatArea = document.getElementById("chat");

      chatInput = document.getElementById("chat-input");

      chatInput.addEventListener("keypress", event => {
        if (event.key == "Enter") {
          if (this.chatArea.value == "") {
            this.chatArea.value = "Me: " + chatInput.value;
          } else {
            this.chatArea.value += '\n' + "Me: " + chatInput.value;
          }

          App.game.transmitChat(chatInput.value.replace(/[ ]/g, '•'));

          chatInput.value = "";
        }
      });
    }
  }

  this.startCountdown = function() {
    if (!this.gameIsReady) {
      let tickTock = setInterval(() => {
        let minutes = Math.floor(this.timeLimit / 60);
        let seconds = Math.floor(this.timeLimit % 60);

        this.timeLimit -= 1;

        document.getElementById("clock").innerHTML = minutes + "m " + seconds + "s ";

        if (this.timeLimit < 0) {
          document.getElementById("clock").innerHTML = "TIME'S UP";

          App.game.finalize_game(false, false, true);

          clearInterval(tickTock);
        }
      }, 1000); 
    }
  }

  this.addDefaultHandlers = function(elem) {
    elem.draggable = true;

    elem.addEventListener('dragstart', event => {
      if (event.target.innerHTML) {
        event.dataTransfer.setData('text/html', event.target.innerHTML);
        this.draggedTile = event.target;

        if (event.target.className != "rack-tile" && this.myTurn && this.opponentId) {
          App.game.remove_tile(event.target.id);
        }
      }
    });

    elem.addEventListener('dragend', event => {
      this.determineTileBackground(event.target);
      this.draggedTile = null;
    });

    elem.addEventListener('click', event => {
      let target = event.target;

      // Because of event capturing, this is necessary
      if (['SPAN', 'SUB'].includes(event.target.nodeName)) {
        target = event.target.parentNode;
      }

      if (target.draggable && (this.myTurn || target.className == "rack-tile") && this.opponentId) {
        if (target.innerHTML !== '') {
          // Both board tile and clicked tile are occupied
          // This is the click to place the letter with swapping
          if (this.tileClicked !== '') {
            [target.innerHTML, this.tileClicked] = [this.tileClicked, target.innerHTML];
            this.addTileToWord(target)

            if (target.className != "rack-tile" && this.myTurn) {
              let letter = target.getElementsByTagName("SPAN")[0].textContent;

              App.game.remove_tile(target.id);
              App.game.make_move(target.id + " " + (letter == " " ? "." : letter));
            }
          } 
          // This is the click to grab the letter
          else {
            this.tileClicked = target.innerHTML;
            target.innerHTML = '';
            this.determineTileBackground(target);

            if (target.className != "rack-tile" && this.myTurn) {
              App.game.remove_tile(target.id);
            }
          }
        } else {
          // This is the click to place the letter without swapping
          if (this.tileClicked !== '') {
            target.innerHTML = this.tileClicked;
            this.tileClicked = '';
            this.determineTileBackground(target);
            this.addTileToWord(target);

            if (target.className != "rack-tile" && this.myTurn) {
              let letter = target.getElementsByTagName("SPAN")[0].textContent;

              App.game.make_move(target.id + " " + (letter == " " ? "." : letter));
            }
          }
        }
      }
    });

    elem.addEventListener('dragover', event => {
      event.preventDefault();

      return false;
    });

    elem.addEventListener('drop', event => {
      let target = event.target;

      // Because of event capturing, this is necessary
      if (['SPAN', 'SUB'].includes(event.target.nodeName)) {
        target = event.target.parentNode;
      }

      if (this.draggedTile && target.draggable && (this.myTurn || target.className == 'rack-tile')  && this.opponentId) {
        this.draggedTile.innerHTML = target.innerHTML;
        target.innerHTML = event.dataTransfer.getData('text/html');

        this.determineTileBackground(target);
        this.addTileToWord(target);

        if (target.className != 'rack-tile') {
          let letter = target.getElementsByTagName("SPAN")[0].textContent;

          App.game.make_move(target.id + " " + (letter == " " ? "." : letter));
        }

        event.preventDefault();
      }
    });
  }

  this.addDialogueHandlers = function() {
    if (!this.gameIsReady) {
      let outerDiv = document.getElementById("outer-div");
      let input = document.getElementById("dialogue-input");
      let cancelButton = document.getElementById("dialogue-cancel");
      let submitButton = document.getElementById("dialogue-submit");

      cancelButton.addEventListener("click", event => {
        outerDiv.classList.add("d-none")
      });

      submitButton.addEventListener("click", event => {
        let wildLetterValue = input.value.toUpperCase().replace(/[^A-Z]/, '');
        let lettersToPass = input.value.toUpperCase().replace(/[^A-Z ]/, '');

        if (wT && wildLetterValue.length === 1) {
          outerDiv.classList.add("d-none")

          wT.getElementsByTagName("SPAN")[0].textContent = wildLetterValue;
          wT.getElementsByTagName("SUB")[0].textContent = 0;

          App.game.make_move(wT.id + " " + wildLetterValue + "*")

          this.submit();
        } else if (!wT && lettersToPass) {
          outerDiv.classList.add("d-none")

          this.pass(lettersToPass.split(""));
        }
      });
    }
  }

  /******************************************************
  /* START -> Methods to check tile and word conditions *
  /******************************************************/

  // See if the tiles placed are only sideways or only downwards
  this.isConsecutive = function(ids) {
    for (let i = 0; i < ids.length; i++) {
      if (ids[i + 1]) {
        // Word is towards right. Ids are strings
        if (typeof ids[i] === 'string') {
          if (ids[i + 1].charCodeAt(0) - ids[i].charCodeAt(0) !== 1) {
            return false;
          }
        }
        // Word is downwards. Ids are numbers
        else {
          if (ids[i + 1] - ids[i] !== 1) {
            return false;
          }
        }
      }
    }

    return true;
  }

  // See if there are spots without tiles in the words placed on board
  this.hasNoGaps = function() {
    let inBetweenTiles = this.getInBetweenTiles();

    return !inBetweenTiles.length || inBetweenTiles.every(id => document.getElementById(id).innerHTML);
  }

  // See if a word is adjacent to another word
  this.isAdjacent = function() {
    let wordTilesIds = this.wordTiles.map(tile => tile.id);

    let isOccupiedRight = tile => {
      if (this.extractLetter(tile) == "o") {
        return false;
      } else {
        let id = String.fromCharCode(tile.id.charCodeAt(0) + 1) + tile.id.slice(1);
        return !wordTilesIds.includes(id) && document.getElementById(id).innerHTML;
      }
    }

    let isOccupiedLeft = tile => {
      if (this.extractLetter(tile) == "a") {
        return false;
      } else {
        let id = String.fromCharCode(tile.id.charCodeAt(0) - 1) + tile.id.slice(1);
        return !wordTilesIds.includes(id) && document.getElementById(id).innerHTML;
      }
    }
    
    let isOccupiedUp = tile => {
      let numberPart = this.extractNumber(tile);

      if (numberPart == 1) {
        return false;
      } else {
        let id = tile.id[0] + (numberPart - 1);
        return !wordTilesIds.includes(id) && document.getElementById(id).innerHTML;
      }
    }

    let isOccupiedDown = tile => {
      let numberPart = this.extractNumber(tile);

      if (numberPart == 15) {
        return false;
      } else {
        let id = tile.id[0] + (numberPart + 1);
        return !wordTilesIds.includes(id) && document.getElementById(id).innerHTML;
      }
    }

    return this.wordTiles.some(tile => tile.id === 'h8' || ((isOccupiedUp(tile) || isOccupiedDown(tile) || isOccupiedLeft(tile) || isOccupiedRight(tile)) && this.hasNoGaps()));
  }

  this.isValidPlacement = function() {
    return ((this.wordTiles.some(tile => tile.id === 'h8') && this.wordTiles.length > 1) || this.isContinuation()) && ((this.isValidToRight() && !this.isValidDownwards()) || (this.isValidDownwards() && !this.isValidToRight()) || this.wordTiles.length === 1);
  }

  this.isContinuation = function() {
    let placedIds = this.wordTiles.map(tile => tile.id);

    // By collecting tiles and filtering out the tiles placed by the player, we can see if it is a continuation.
    down = this.wordTiles.some(tile => this.collectWordTiles(this.extractNumber(tile), this.extractLetter(tile), true).filter(id => !placedIds.includes(id)).length);
    side = this.wordTiles.some(tile => this.collectWordTiles(this.extractLetter(tile), this.extractNumber(tile), false).filter(id => !placedIds.includes(id)).length);

    return down || side;
  }

  this.isValidToRight = function() {
    let checkLetter = this.extractLetter(this.wordTiles[0]);
    let checkNumber = this.extractNumber(this.wordTiles[0]);

    // If the word is towards right, the number parts of the ids are the same
    let isValid = tile => {
      return this.extractLetter(tile) !== checkLetter && this.extractNumber(tile) === checkNumber;
    }

    return this.wordTiles.slice(1).every(isValid);
  }

  this.isValidDownwards = function() {
    let checkLetter = this.extractLetter(this.wordTiles[0]);
    let checkNumber = this.extractNumber(this.wordTiles[0]);

    // If the word is towards right, the letter parts of the ids are the same
    let isValid = tile => {
      return this.extractLetter(tile) === checkLetter && this.extractNumber(tile) !== checkNumber;
    }

    return this.wordTiles.slice(1).every(isValid);
  }

  this.isDownwards = function() {
    return this.wordTiles.length > 1 && this.extractLetter(this.wordTiles[0]) === this.extractLetter(this.wordTiles[1]);
  }

  /***********************************
  /* START -> Methods to build words *
  /***********************************/

  this.setWildTileAndSubmit = function() {
    this.cleanWordTiles();

    let wild = this.wordTiles.filter(tile => tile.getElementsByTagName('span')[0].textContent === " ")[0];

    if (wild) {
      this.showDialogue("Enter a letter: ", wild);
    } else {
      this.submit();
    }
  }

  this.submit = () => {
    if (this.isValidPlacement()) {
      this.word = this.produceWord();
      console.log(this.word);

      if (this.challengable) {
        this.processValidWords();
      } else {
        let wordsAsString = this.words.map(word => word.map(tile => tile.getElementsByTagName("SPAN")[0].textContent).join("")).join(" ");
        App.game.validate_words(wordsAsString);
      }

    } else {
      App.game.printMessage("Tile placement is not valid!");
    }
  }

  this.addTileToWord = function(tile) {
    if (tile.className !== 'rack-tile') {
      this.wordTiles.push(tile)
    }
  }

  this.cleanWordTiles = function() {
    let cleaned = []

    // Remove duplicate and empty tile nodes
    for (let i = 0; i < this.wordTiles.length; i++) {
      if (!cleaned.includes(this.wordTiles[i]) && this.wordTiles[i].innerHTML !== '') {
        cleaned.push(this.wordTiles[i])
      }
    }

    cleaned.sort(this.idSort);

    this.wordTiles = cleaned;
  }

  this.produceWord = function() {
    if (this.isDownwards()) {
      return this.isAdjacent() && this.produceDownwards();
    } else {
      return this.isAdjacent() && this.produceSideways();
    }
  }

  this.produceDownwards = function() {
    let pre = this.extractLetter(this.wordTiles[0]);

    // A small arrow function argument to 'sort' method because it sorts according to unicode values
    // a - b because sort needs -1, 0, 1 to perform sorting
    let sortedIds = this.wordTiles.map(tile => this.extractNumber(tile)).sort((a, b) => a - b);

    let gatheredIds = this.collectWordTiles(sortedIds[0], pre, true);

    // If the node with the last id in sortedIds isn't in the list gatheredIds, an illegal move was made
    if (gatheredIds.indexOf(pre + sortedIds[sortedIds.length - 1]) === -1) {
      return false;
    }

    // Because this.isConsecutive expects numbers as ids for downwards this.words
    sortedIds = gatheredIds.map(id => this.extractNumber(id));

    for (let i = 0; i < this.wordTiles.length; i++) {
      let word = this.collectWordSideways(this.wordTiles[i]);

      if (word) {
        this.words.push(word);
      }
    }

    // Necessary for calculating points for adding the final main word
    this.words.push([]);

    // Construct the ids again with letter value
    let fullIds = sortedIds.map(id => pre + id.toString());

    // Get the letter values for the word in the sorted order
    let sortedWord = [];
    for (let i = 0; i < fullIds.length; i++) {
      let node = document.getElementById(fullIds[i]);

      this.words[this.words.length - 1].push(node);

      sortedWord.push(node.getElementsByTagName('span')[0].textContent);
    }

    return this.isConsecutive(sortedIds) && sortedWord.join('');
  }

  this.produceSideways = function() {
    let post = this.extractNumber(this.wordTiles[0]);

    // Unicode sort is ok because numeric parts are the same for the rows
    let sortedIds = this.wordTiles.map(tile => tile.id).sort();

    let gatheredIds = this.collectWordTiles(sortedIds[0][0], post);

    // If the node with the last id in sortedIds isn't in the list gatheredIds, an illegal move was made
    if (gatheredIds.indexOf(sortedIds[sortedIds.length - 1]) === -1) {
      return false;
    }

    for (let i = 0; i < this.wordTiles.length; i++) {
      let word = this.collectWordDownwards(this.wordTiles[i]);

      if (word) {
        this.words.push(word);
      }
    }

    // Get the letter values for the word in the sorted order
    let sortedWord = [];

    // If only one tile is placed, main word is a gathered word
    if (gatheredIds.length > 1) {
      // Necessary for calculating points for adding the final main word
      this.words.push([]);

      for (let i = 0; i < gatheredIds.length; i++) {
        let node = document.getElementById(gatheredIds[i]);
        
        this.words[this.words.length - 1].push(node);

        sortedWord.push(node.getElementsByTagName('span')[0].textContent);
      }
    } else {
      sortedWord = this.words[this.words.length - 1]
    }

    return this.isConsecutive(gatheredIds) && sortedWord.join('');
  }

  this.showDialogue = function(message, wT) {
    let outerDiv = document.getElementById("outer-div");
    let p = document.getElementById("dialogue-text");

    p.textContent = message;

    outerDiv.classList.remove("d-none");
  }

  this.pass = lettersToPass => {
    let lettersOnRack = this.rackTiles.map(rackTile => rackTile.textContent[0]);

    // Remove redundant letters 
    for (let i = 0; i < lettersToPass.length; i++) {
      if (lettersOnRack.includes(lettersToPass[i])) {
        lettersOnRack[lettersOnRack.indexOf(lettersToPass[i])] = null;
      } else {
        lettersToPass[i] = null;
      }
    }

    lettersToPass = lettersToPass.filter(letter => letter);

    if (lettersToPass.length) {
      this.passedLetters = lettersToPass;

      this.removeTilesFromBoard();

      App.game.pass_letters(lettersToPass);
    }
  }

  this.collectWordTiles = function(start, affix, downwards=false) {
    let tiles = [];
    let node = null;

    if (downwards) {
      tile = document.getElementById(affix + start);

      while (tile && tile.innerHTML) {
        tiles.push(tile.id);
        start += 1;
        tile = document.getElementById(affix + start);
      }

      start = start - (tiles.length + 1)

      tile = document.getElementById(affix + start)

      while (tile && tile.innerHTML) {
        tiles.unshift(tile.id);
        start -= 1;
        tile = document.getElementById(affix + start);
      }

    } else {
      tile = document.getElementById(start + affix);

      while (tile && tile.innerHTML) {
        tiles.push(tile.id);
        start = String.fromCharCode(start.charCodeAt(0) + 1);
        tile = document.getElementById(start + affix);
      }

      start = String.fromCharCode(tiles[0].charCodeAt(0) - 1);

      tile = document.getElementById(start + affix);

      while (tile && tile.innerHTML) {
        tiles.unshift(tile.id);
        start = String.fromCharCode(start.charCodeAt(0) - 1);
        tile = document.getElementById(start + affix);
      }
    }

    return tiles;
  }

  this.collectWordSideways = function(tile) {
    let word = [tile];

    let collectToRight = tile => {
      let id = String.fromCharCode(tile.id.charCodeAt(0) + 1) + tile.id.slice(1);
      let node = document.getElementById(id);

      while (node && node.innerHTML) {
        word.push(node)
        id = String.fromCharCode(id.charCodeAt(0) + 1) + id.slice(1);
        node = document.getElementById(id);
      }
    }

    let collectToLeft = tile => {
      let id = String.fromCharCode(tile.id.charCodeAt(0) - 1) + tile.id.slice(1);
      let node = document.getElementById(id);

      while (node && node.innerHTML) {
        word.unshift(node)
        id = String.fromCharCode(id.charCodeAt(0) - 1) + id.slice(1);
        node = document.getElementById(id);
      }
    }

    collectToLeft(tile);
    collectToRight(tile);

    if (word.length > 1) {
      return word;
    } else {
      return null;
    }
  }

  this.collectWordDownwards = function(tile) {
    let word = [tile];

    let collectUpwards = tile => {
      let id = tile.id[0] + (this.extractNumber(tile) - 1);
      let node = document.getElementById(id);

      while (node && node.innerHTML) {
        word.unshift(node)
        id = id[0] + (Number(id.slice(1)) - 1);
        node = document.getElementById(id);
      }
    }

    let collectDownwards = tile => {
      let id = tile.id[0] + (this.extractNumber(tile) + 1);
      let node = document.getElementById(id);

      while (node && node.innerHTML) {
        word.push(node)
        id = id[0] + (Number(id.slice(1)) + 1);
        node = document.getElementById(id);
      }
    }

    collectUpwards(tile);
    collectDownwards(tile);

    if (word.length > 1) {
      return word;
    } else {
      return null;
    }
  }

  this.getInBetweenTiles = function() {
    let sortedWordTiles = this.wordTiles.sort(this.sortById);
    let onBoard = [];

    if (this.determineDirection() === "D") {
      let idLetter = this.extractLetter(sortedWordTiles[0]);
      let idNumbers = sortedWordTiles.map(tile => this.extractNumber(tile));

      for(let i = 0; i < idNumbers.length; i++) {
        let calculatedIdNumber = idNumbers[i] + 1;

        if (idNumbers[i + 1] && calculatedIdNumber != idNumbers[i + 1] && calculatedIdNumber < 15) {
          onBoard.push(idLetter + String(calculatedIdNumber));

          let lastIdNumber = this.extractNumber(onBoard[onBoard.length - 1]);

          while(idNumbers[i + 1] != lastIdNumber + 1 && lastIdNumber + 1 < 15) {
            lastIdNumber = lastIdNumber + 1;
            onBoard.push(idLetter + String(lastIdNumber));
          }
        }
      }
    } else {
      let idLetters = sortedWordTiles.map(tile => this.extractLetter(tile));
      let idNumber = this.extractNumber(sortedWordTiles[0]);

      for(let i = 0; i < idLetters.length; i++) {
        let calculatedIdLetter = String.fromCharCode(idLetters[i].charCodeAt(0) + 1);

        if (idLetters[i + 1] && calculatedIdLetter != idLetters[i + 1] && calculatedIdLetter < 'o') {
          onBoard.push(calculatedIdLetter + idNumber);

          let lastId = onBoard[onBoard.length - 1];

          while(idLetters[i + 1] != lastId[0] && lastId[0] < "o") {
            onBoard.push(String.fromCharCode(lastId.charCodeAt(0) + 1) + idNumber);
            lastId = onBoard[onBoard.length - 1];
          }
        }
      }
    }

    return onBoard;
  }

  this.determineDirection = function() {
    let idLetters = this.wordTiles.map(tile => tile.id[0]);
    let checkLetter = idLetters[0];

    if (idLetters.slice(1).every(idLetter => idLetter === checkLetter)) {
      return "D";
    } else {
      return "R";
    }
  }

  this.extractLetter = function(tile) {
    // First index of the id is a letter
    return tile.id[0];
  }

  this.extractNumber = function(tileOrId) {
    let id = tileOrId.id || tileOrId;

    // Get indeces except the first one (that is, the numeric part)
    return Number(id.split('').slice(1).join(''));
  }

  // Arrow function syntax is used for a proper 'this'.
  // This function is only used with 'sort' Array method.
  this.sortById = (t1, t2) => {
    let t1Letter = this.extractLetter(t1);
    let t1Number = this.extractNumber(t1);
    let t2Letter = this.extractLetter(t2);
    let t2Number = this.extractNumber(t2);

    if (t1Letter == t2Letter) {
      if (t1Number < t2Number) {
        return -1;
      } else if (t1Number > t2Number) {
        return 1;
      } else {
        return 0;
      }
    } else {
      if (t1Letter < t2Letter) {
        return -1;
      } else if (t1Letter > t2Letter) {
        return 1;
      } else {
        return 0;
      }
    }
  }

  /***********************************************
  /* START -> Methods to control board and tiles *
  /***********************************************/

  this.determineTileBackground = function(tile) {
    if (tile.innerHTML) {
      tile.style.backgroundColor = '#BE975B';
    } else if (this.tripleWordBonus.includes(tile.id)) {
      tile.style.backgroundColor = '#ff3300';
    } else if (this.doubleWordBonus.includes(tile.id)) {
      tile.style.backgroundColor = '#ff99cc';
    } else if (this.tripleLetterBonus.includes(tile.id)) {
      tile.style.backgroundColor = '#3366ff';
    } else if (this.doubleLetterBonus.includes(tile.id)) {
      tile.style.backgroundColor = '#b3c6ff';
    } else if (tile.className === 'rack-tile') {
      tile.style.backgroundColor = '#cccccc';
    } else {
      tile.style.backgroundColor = '#ffd6cc';
    }
  }

  this.removeTilesFromBoard = function() {
    for (let i = 0; i < this.rackTiles.length; i++) {
      if (!this.rackTiles[i].innerHTML) {
        let tileOnBoard = this.wordTiles.pop();

        this.rackTiles[i].innerHTML = tileOnBoard.innerHTML;
        tileOnBoard.innerHTML = "";
        this.determineTileBackground(this.rackTiles[i]);
        this.determineTileBackground(tileOnBoard);

        App.game.remove_tile(tileOnBoard.id);
      }
    }

    this.wordTiles = [];
  }

  this.activateWordTiles = function() {
    for (let i = 0; i < this.prevWordTiles.length; i++) {
      this.prevWordTiles[i].draggable = true;
    }
  }

  this.deactivateWordTiles = function() {
    for (let i = 0; i < this.wordTiles.length; i++) {
      this.wordTiles[i].draggable = false;
    }
  }

  this.deactivateBoardAndButtons = function() {
    let tiles = document.getElementById("board").children;

    for (let i = 0; i < tiles.length; i++) {
      tiles[i].draggable = false;
    }

    for (let i = 0; i < this.rackTiles.length; i++) {
      this.rackTiles[i].draggable = false;
    }

    this.started = false;
  }

  this.replaceRackTiles = function() {
    let replaceTile = (presentTile, prevTile) => {
      this.presentTile.innerHTML = this.prevTile.innerHTML;
      this.prevTile.innerHTML = "";
      this.determineTileBackground(this.presentTile);
      this.determineTileBackground(this.prevTile);

      App.game.remove_tile(this.prevTile.id);
    }

    // This method is called after a challenge is successful to return drawn letters to bag
    if (this.rackTiles.every(rackTile => !rackTile.innerHTML)) {
      // If rack is completely empty, just put the placed tiles back on
      for (let i = 0; i < this.prevWordTiles.length; i++) {
        replaceTile(rackTiles[i], prevWordTiles[i]);
      }
    } else {
      // If not completely empty, then should check if replacing the correct letter
      for (let i = 0; i < this.drawnTiles.length; i++) {
        for (let j = 0; j < this.rackTiles.length; j++) {
          if (this.drawnTiles[i] === this.rackTiles[j].getElementsByTagName("SPAN")[0].textContent) {
            replaceTile(rackTiles[i], prevWordTiles[i]);

            break;
          }
        }
      }
    }

    App.game.return_back_letters(this.drawnTiles);
  }

  this.populateRack = function(tiles) {
    this.drawnTiles = tiles.slice();

    for (let i = 0; i < this.rackTiles.length; i++) {
      if (!this.rackTiles[i].innerHTML) {
        let tile = tiles.pop()
        
        if (tile) {
          this.rackTiles[i].innerHTML = '<span></span><sub></sub>';
          this.rackTiles[i].getElementsByTagName('span')[0].textContent = tile == "." ? " " : tile;
          this.rackTiles[i].lastChild.textContent = this.letterPoints[tile];
          this.determineTileBackground(this.rackTiles[i]);
        }
      }
    }
  }

  /**************************************************
  /* START -> Methods to determine points and score *
  /**************************************************/

  this.calcPoints = function() {
    let calcWordPoints = word => {
      let points = 0;

      word.forEach(tile => points += this.calcLetterBonus(tile));
      word.forEach(tile => points *= this.calcWordBonus(tile));

      return points;
    }

    // Additional 60 points if all the tiles in the rack are used
    let points = this.rackTiles.some(tile => tile.innerHTML) ? 0 : 60;

    this.words.forEach(word => points += calcWordPoints(word));

    this.prevTurnScore = points;

    return points;
  }

  this.calcLetterBonus = function(tile) {
    if (tile.getElementsByTagName('sub')[0].textContent != '0') {
      // Make sure the tile wasn't placed previously. Draggable means it is just placed.
      if (tile.draggable) {
        if (this.doubleLetterBonus.includes(tile.id)) {
          return this.letterPoints[tile.getElementsByTagName('span')[0].textContent] * 2;
        } else if (this.tripleLetterBonus.includes(tile.id)) {
          return this.letterPoints[tile.getElementsByTagName('span')[0].textContent] * 3;
        } else {
          return this.letterPoints[tile.getElementsByTagName('span')[0].textContent];
        }
      } else {
        return this.letterPoints[tile.getElementsByTagName('span')[0].textContent];
      }
    } else {
      return 0;
    }
  }

  this.calcWordBonus = function(tile) {
    // Make sure the tile wasn't placed previously. Draggable means it is just placed. 
    if (tile.draggable) {
      if (this.tripleWordBonus.includes(tile.id)) {
        return 3;
      } else if (this.doubleWordBonus.includes(tile.id)) {
        return 2;
      } else {
        return 1;
      }
    } else {
      return 1;
    }
  }

  this.deductPoints = function(pointsLimit) {
    if (!pointsLimit) {
      for (let i = 0; i < this.rackTiles.length; i++) {
        if (this.rackTiles[i].innerHTML) {
          pointsToBeDeducted = this.letterPoints[this.rackTiles[i].getElementsByTagName("SPAN")[0].textContent];
          this.deductedPoints += pointsToBeDeducted;
          this.totalScore -= pointsToBeDeducted;
        }
      }
    }

    App.game.printMessage('You: ' + this.totalScore);
    App.game.deliver_score(this.totalScore, true);
  }

  this.forfeit = function() {
    App.game.forfeit(this.totalScore);
    this.deactivateBoardAndButtons();
    App.game.printMessage("You have forfeited the game. 50 points has been deducted from your overall score.");
  }

  this.resetTurn = function() {
    this.prevWordTiles = this.wordTiles;
    this.prevWords = this.words;
    this.wordTiles = [];
    this.words = [];

    if (this.isFirstMove) {
      this.isFirstMove = false;
    }

    this.messagesArea.firstChild.textContent = 'You:' + this.totalScore;
  }
}