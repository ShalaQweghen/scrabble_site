let Game = () => {
  let playerId,
      opponentId, 
      opponentName, 
      timeLimit, 
      pointsLimit,
      tileClicked, 
      draggedTile,
      wildTile,
      wildTile2, 
      rackTiles, 
      wordTiles, 
      word, 
      words,
      isFirstMove, 
      myTurn, 
      started, 
      passedLetters, 
      passes, 
      passingEnd,
      challengable, 
      canChallenge, 
      isChallenged, 
      challenging,
      drawnTiles, 
      prevTurnTiles, 
      prevTurnScore, 
      deductedPoints,
      prevWordTiles, 
      prevWords, 
      finalChallengeAlreadyDone,
      aboutToEnd, 
      totalScore, 
      opponentScore, 
      letterPoints,
      doubleLetterBonus, 
      tripleLetterBonus,
      doubleWordBonus, 
      tripleWordBonus, 
      messagesArea, 
      chatArea,
      tickTock;

  /********************************************************************
  /* START -> Methods that get called from channel script Game.coffee *
  /********************************************************************/

  let init = (pId, letters, firstToGo, chllngable, tLimit, ptsLimit, opId=null, opName=null) => {
    // Make sure this method is called only at the beginning
    if (!playerId) {
      playerId = pId;
      opponentId = opId;
      opponentName = opName ? opName.replace("-", " ") : opName;

      timeLimit = Number(tLimit);
      pointsLimit = Number(ptsLimit);

      tileClicked = '';
      draggedTile = null;
      wildTile = null;
      wildTile2 = null;

      rackTiles = [];

      wordTiles = [];
      word = '';
      words = [];

      isFirstMove = firstToGo;
      myTurn = firstToGo;
      started = !!opponentId;

      passedLetters = [];
      passes = 0;
      passingEnd = false;

      challengable = chllngable;
      canChallenge = true;
      isChallenged = false;
      challenging = false;
      drawnTiles = [];
      prevTurnScore = 0;
      deductedPoints = 0;
      prevWordTiles = [];
      prevWords = [];
      finalChallengeAlreadyDone = false;

      aboutToEnd = false;

      totalScore = 0;
      opponentScore = 0;

      letterPoints = {};
      'LSUNRTOAIE'.split('').forEach(l => letterPoints[l] = 1);
      'GD'.split('').forEach(l => letterPoints[l] = 2);
      'BCMP'.split('').forEach(l => letterPoints[l] = 3);
      'FHVWY'.split('').forEach(l => letterPoints[l] = 4);
      'JX'.split('').forEach(l => letterPoints[l] = 8);
      'QZ'.split('').forEach(l => letterPoints[l] = 10);
      letterPoints['K'] = 5;

      doubleLetterBonus = 'a4 a12 c7 c9 d1 d8 d15 g3 g7 g9 g13 h4 h12 o4 o12 m7 m9 l1 l8 l15 i3 i7 i9 i13'.split(' ');
      tripleLetterBonus = 'b6 b10 n6 n10 f2 f6 f10 f14 j2 j6 j10 j14'.split(' ');
      doubleWordBonus = 'h8 b2 c3 d4 e5 b14 c13 d12 e11 n2 m3 l4 k5 n14 m13 l12 k11'.split(' ');
      tripleWordBonus = 'a1 a8 a15 h15 o15 h1 o8 o1'.split(' ');

      prepareBoard();
      prepareRack();
      addButtonHandlers();
      prepareInfoArea();
      prepareChat();
      populateRack(letters);

      if (timeLimit && opponentId) {
        startCountdown();
      }
    }
  }

  let setOpponent = (opId, opName) => {
    if (!opponentId) {
      opponentId = opId;
      opponentName = opName.replace("-", " ");
      messagesArea.children[2].textContent = opponentName + ": 0";
      started = true;

      if (timeLimit) {
        startCountdown();
      }
    }
  }

  let writeToChat = message => {
    // If this is the very first message to be written, no need for a new line.
    // • was for preventing to break code because of space between words.
    if (chatArea.value == "") {
      chatArea.value = opponentName + ": " + message.replace(/[•]/g, ' ');
    } else {
      chatArea.value += '\n' + opponentName + ": " + message.replace(/[•]/g, ' ');;
    }
  }

  let placeTile = (id, letter) => {
    // If the letter to be placed is wild tile, '*' is appended to the letter
    letter = letter.split("");

    let tile = document.getElementById(id);
    tile.draggable = false;
    tile.innerHTML = '<span></span><sub></sub>';
    setLetter(tile, letter[0] == "." ? " " : letter[0]);
    
    // If the letter to be placed is wild tile, length is two
    if (letter.length > 1) {
      tile.lastChild.textContent = 0;
    } else {
      tile.lastChild.textContent = letterPoints[letter[0]];
    }

    determineTileBackground(tile);
  }

  let removeTile = id => {
    let tile = document.getElementById(id);
    tile.innerHTML = "";
    tile.draggable = true;
    determineTileBackground(tile);
  }

  let processValidWords = () => {
    if (aboutToEnd) {
      // It was the last word to be challenged.
      App.game.deliver_score(totalScore, true);
    } else if (isChallenged) {
      // The word was challenged and proved to be valid. Turn passes. No letters to be drawn.
      App.game.switch_turn(0, passes);
    } else if (word) {
      // Good old valid word.
      totalScore += calcPoints();
      deactivateWordTiles();
      resetTurn();

      App.game.deliver_score(totalScore, false);
      App.game.switch_turn(7 - rackTiles.filter(node => node.innerHTML).length, passes);

      passes = 0;
    } else {
      App.game.printMessage("Tile placement is not valid!");
    }
  }

  let processInvalidWords = word => {
    if (isChallenged) {
      aboutToEnd = false;
      isChallenged = false;
      totalScore -= prevTurnScore;

      activateWordTiles();
      replaceRackTiles();

      messagesArea.firstChild.textContent = "You: " + totalScore;

      App.game.printMessage("You have been challenged! '" + word + "' is not a valid word!");
      App.game.deliver_score(totalScore, false);
    } else {
      App.game.printMessage("'" + word + "' is not a valid word!");
    }

    words = [];
  }

  let challenge = last => {
    aboutToEnd = last;
    isChallenged = true;

    let wordsAsString = prevWords.map(word => word.map(tile => getLetter(tile)).join("")).join(" ");

    App.game.validate_words(wordsAsString);
  }

  let passLetters = letters => {
    passes += 1;

    letters = letters.replace(/\./g, ' ').split("")

    for (let i = 0; i < letters.length; i++) {
      let rackTile = rackTiles.find(tile => tile.textContent[0] === passedLetters[i]);
      setLetter(rackTile, letters[i]);

      if (letter != " ") {
        rackTile.lastChild.textContent = letterPoints[letters[i]];
      }
    }

    App.game.switch_turn(0, passes);
  }

  let switchTurn = (letters, letRemaining, numPasses, gameOver) => {
    myTurn = !myTurn;
    finalChallengeAlreadyDone = false;

    if (myTurn) {
      wildTile = null;
    }

    if (pointsLimit && (opponentScore >= pointsLimit || totalScore >= pointsLimit)) {
      App.game.finalize_game(false, true, false);
    } else {
      if (myTurn) {
        drawnTiles = [];
      }

      if (passes >= 3 && Number(numPasses) >= 3) {
        App.game.finalize_game(true, false, false);
      } else if (gameOver == "true" && rackTiles.every(tile => !tile.innerHTML)) {
        App.game.finalize_game(false, false, false);
      } else {
        if (letters) {
          populateRack(letters.split(""));
        }

        messagesArea.children[6].textContent = 'Letters in Bag: ' + letRemaining;

        canChallenge = true;

        if (isChallenged) {
          isChallenged = false;
          App.game.printMessage("A challenge against you failed! Your turn...");
        } else if (myTurn) {
          App.game.printMessage("Your turn...");
        } else if (challenging) {
          challenging = false;
          App.game.printMessage("Challenge failed! Opponent's turn...");
        } else {
          App.game.printMessage("Opponent's turn...");
        }
      }
    }
  }

  let updateScore = score => {
    if (challenging) {
      challenging = false;
      App.game.printMessage("Challenge successful! Your turn...");
    }

    pElems = messagesArea.children;

    pElems[0].textContent = 'You: ' + totalScore;
    pElems[2].textContent = opponentName + ': ' + score;
    opponentScore = score;
  }

  let cancelGame = () => {
    App.game.printMessage("The game has been forfeited by the opponent. You are the winner.");
    deactivateBoardAndButtons();
    App.game.register_scores(totalScore, true);
  }

  let finishGame = (passEnding, ptsLimit, tLimit) => {
    // This is to prevent duplicate execution
    if (!finalChallengeAlreadyDone) {
      if (passEnding) {
        deductPoints(ptsLimit);
      } else if (challengable && !tLimit) {
        if (myTurn) {
          showDialogue("The game is about to end. Would you like to challenge the last word?", null, true, true, ptsLimit);
        } else {
          App.game.printMessage("Waiting to see if your opponent will challenge your last word...");
        }
      } else {
        deductPoints(ptsLimit);
      }

      finalChallengeAlreadyDone = true;
    }
  }

  let theEnd = () => {
    myTurn = false;
    started = false;

    deactivateBoardAndButtons();

    let winner = null;

    if (pointsLimit && (pointsLimit <= totalScore || pointsLimit <= opponentScore)) {
      if (opponentScore >= pointsLimit) {
        winner = false;
        App.game.printMessage("Points Limit has been reached! Your opponent has won the game by " + opponentScore + " points!");
      } else if (totalScore >= pointsLimit) {
        winner = true;
        App.game.printMessage("Points Limit has been reached! You have won the game by " + totalScore + " points!");
      }
    } else if (totalScore > opponentScore) {
      winner = true;
      App.game.printMessage("Game is over! After " + deductedPoints + " points deducted for remaining letters on your racks, you won with " + totalScore + " points!");
    } else if (totalScore < opponentScore) {
      winner = false;
      App.game.printMessage("Game is over! After " + deductedPoints + " points deducted for remaining letters on your racks, your opponent won with " + opponentScore + " points!");
    } else {
      App.game.printMessage("Game is over! After " + deductedPoints + " points deducted for remaining letters on your racks, it is a tie with " + totalScore + " points!");
    }

    App.game.register_scores(totalScore, winner);
  }

  let getPlayerId = () => {
    return playerId;
  }

  let getOpponentId = () => {
    return opponentId;
  }

  /******************************************
  /* START -> Methods to be exposed outside *
  /******************************************/

  let publicAPI = {init, 
                   setOpponent, 
                   writeToChat, 
                   placeTile,
                   removeTile,
                   processValidWords,
                   processInvalidWords,
                   challenge,
                   passLetters,
                   switchTurn,
                   updateScore,
                   cancelGame,
                   finishGame,
                   theEnd,
                   getOpponentId,
                   getPlayerId}

  /************************************************************
  /* START -> Methods to get the game layout and events ready *
  /************************************************************/

  let prepareBoard = () => {
    let board = document.getElementById('board');

    for (let i = 1; i <= 15; i++) {
      for (let j = 97; j <= 111; j++) {
        let tile = document.createElement('div');
        tile.id = String.fromCharCode(j) + i;
        tile.className = 'tile';
        determineTileBackground(tile);

        tile.addEventListener('contextmenu', event => {
          let target = event.target;

          // Because of event capturing, this is necessary
          if (["SPAN", 'SUB'].includes(event.target.nodeName)) {
            target = event.target.parentNode;
          }

          if (target.innerHTML && target.draggable && opponentId) {
            // Prevent context menu to pop up
            event.preventDefault();

            // Find the first empty spot in rack
            let rackTile = rackTiles.filter((tile) => tile.innerHTML === '')[0];

            resetPlacedWildTile(target);

            rackTile.innerHTML = target.innerHTML;
            target.innerHTML = '';

            determineTileBackground(rackTile);
            determineTileBackground(target);
          }
        });

        addDefaultHandlers(tile);
        board.appendChild(tile);
      }
    }
  }

  let prepareRack = () => {
    let rack = document.getElementById('rack');

    for (let i = 0; i < 7; i++) {
      let rackTile = document.createElement('div');
      rackTile.className = 'rack-tile';
      addDefaultHandlers(rackTile);
      rackTiles.push(rackTile);
      rack.appendChild(rackTile);
    }
  }

  let addButtonHandlers = () => {
    let submitButton = document.getElementById('submit');
    submitButton.addEventListener('click', event => {
      if (myTurn && opponentId) {
        setWildTileAndSubmit();
      }
    });

    let passButton = document.getElementById('pass');
    passButton.addEventListener('click', event => {
      if (myTurn && opponentId) {
        showDialogue("Enter letters to change: ", null);
      }
    });

    if (challengable) {
      let challengeButton = document.getElementById("challenge");
      challengeButton.addEventListener('click', event => {
        if (myTurn && !isFirstMove && canChallenge && opponentId) {
          removeTilesFromBoard();

          challenging = true;
          canChallenge = false;
          App.game.challenge(false);
        }
      })
    }

    let shuffleButton = document.getElementById('shuffle');
    shuffleButton.addEventListener('click', event => {
      let tiles = [];

      // Get tiles from tile nodes
      for (let i = 0; i < rackTiles.length; i++) {
        tiles.push(rackTiles[i].innerHTML)
      }

      // Durstenfeld shuffle algorithm to randomize letters.
      for (let i = tiles.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }

      // Place letter values to tile nodes
      for (let i = 0; i < rackTiles.length; i++) {
        rackTiles[i].innerHTML = tiles[i];
        determineTileBackground(rackTiles[i]);
      }
    });

    let forfeitButton = document.getElementById('forfeit');
    forfeitButton.addEventListener('click', event => {
      if (started) {
        showDialogue("Are you sure to forfeit the game? 50 points will be deducted from your overall score.", null, true);
      }
    });
  }

  let prepareInfoArea = () => {
    messagesArea = document.getElementById('messages-area');

    messagesArea.innerHTML = '<p class="float-left">You: 0</p><span id="clock"></span><p class="float-right">' + (opponentName || 'Opponent') + ': 0</p><hr class="clear"><p id="message" class="mt-4"></p><hr><p class="my-0">Letters in Bag: 86</p>';

    if (pointsLimit > 0) {
      messagesArea.innerHTML += "<p class='my-0'>Points Limit is set to " + pointsLimit + ".</p>";
    }
  }

  let prepareChat = () => {
    chatArea = document.getElementById("chat");

    chatInput = document.getElementById("chat-input");

    chatInput.addEventListener("keypress", event => {
      if (event.key == "Enter") {
        if (opponentId) {
          if (chatArea.value == "") {
            chatArea.value = "Me: " + chatInput.value;
          } else {
            chatArea.value += '\n' + "Me: " + chatInput.value;
          }

          App.game.transmitChat(chatInput.value.replace(/[ ]/g, '•'));
        }
        
        chatInput.value = ""; 
      }
    });
  }

  let startCountdown = () => {
    tickTock = setInterval(() => {
      let minutes = Math.floor(timeLimit / 60);
      let seconds = Math.floor(timeLimit % 60);

      timeLimit -= 1;

      document.getElementById("clock").innerHTML = minutes + "m " + seconds + "s ";

      if (timeLimit < 0) {
        document.getElementById("clock").innerHTML = "TIME'S UP";

        App.game.finalize_game(false, false, true);

        clearInterval(tickTock);
      }
    }, 1000);
  }

  let addDefaultHandlers = elem => {
    elem.draggable = true;

    elem.addEventListener('dragstart', event => {
      if (event.target.innerHTML) {
        event.dataTransfer.setData('text/html', event.target.innerHTML);
        draggedTile = event.target;

        if (event.target.className != "rack-tile" && myTurn && opponentId) {
          App.game.remove_tile(event.target.id);
        }
      }
    });

    elem.addEventListener('dragend', event => {
      determineTileBackground(event.target);
      draggedTile = null;
    });

    elem.addEventListener('click', event => {
      let target = event.target;

      // Because of event capturing, this is necessary
      if (["SPAN", 'SUB'].includes(event.target.nodeName)) {
        target = event.target.parentNode;
      }

      if (target.draggable && (myTurn || target.className == "rack-tile") && opponentId) {
        if (target.innerHTML !== '') {
          // Both board tile and clicked tile are occupied
          // This is the click to place the letter with swapping
          if (tileClicked !== '') {
            [target.innerHTML, tileClicked] = [tileClicked, target.innerHTML];
            addTileToWord(target)

            if (target.className != "rack-tile" && myTurn) {
              let letter = getLetter(target);

              App.game.remove_tile(target.id);
              App.game.make_move(target.id + " " + (letter == " " ? "." : letter));
            }
          } 
          // This is the click to grab the letter
          else {
            resetPlacedWildTile(target);

            tileClicked = target.innerHTML;
            target.innerHTML = '';

            determineTileBackground(target);

            if (target.className != "rack-tile" && myTurn) {
              App.game.remove_tile(target.id);
            }
          }
        } else {
          // This is the click to place the letter without swapping
          if (tileClicked !== '') {
            target.innerHTML = tileClicked;
            tileClicked = '';
            determineTileBackground(target);
            addTileToWord(target);

            if (target.className != "rack-tile" && myTurn) {
              let letter = getLetter(target);

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
      if (["SPAN", 'SUB'].includes(event.target.nodeName)) {
        target = event.target.parentNode;
      }

      if (draggedTile && target.draggable && (myTurn || target.className == 'rack-tile')  && opponentId) {
        draggedTile.innerHTML = target.innerHTML;

        target.innerHTML = event.dataTransfer.getData('text/html');

        resetPlacedWildTile(target);
        determineTileBackground(target);
        addTileToWord(target);

        if (target.className != 'rack-tile') {
          let letter = getLetter(target);

          App.game.make_move(target.id + " " + (letter == " " ? "." : letter));
        }

        event.preventDefault();
      }
    });
  }

  /******************************************************
  /* START -> Methods to check tile and word conditions *
  /******************************************************/

  // See if the tiles placed are only sideways or only downwards
  let isConsecutive = ids => {
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
  let hasNoGaps = () => {
    let inBetweenTiles = getInBetweenTiles();

    return !inBetweenTiles.length || inBetweenTiles.every(id => document.getElementById(id).innerHTML);
  }

  // See if a word is adjacent to another word
  let isAdjacent = () => {
    let wordTilesIds = wordTiles.map(tile => tile.id);

    let isOccupiedRight = tile => {
      if (extractLetter(tile) == "o") {
        return false;
      } else {
        let id = String.fromCharCode(tile.id.charCodeAt(0) + 1) + tile.id.slice(1);
        return !wordTilesIds.includes(id) && document.getElementById(id).innerHTML;
      }
    }

    let isOccupiedLeft = tile => {
      if (extractLetter(tile) == "a") {
        return false;
      } else {
        let id = String.fromCharCode(tile.id.charCodeAt(0) - 1) + tile.id.slice(1);
        return !wordTilesIds.includes(id) && document.getElementById(id).innerHTML;
      }
    }
    
    let isOccupiedUp = tile => {
      let numberPart = extractNumber(tile);

      if (numberPart == 1) {
        return false;
      } else {
        let id = tile.id[0] + (numberPart - 1);
        return !wordTilesIds.includes(id) && document.getElementById(id).innerHTML;
      }
    }

    let isOccupiedDown = tile => {
      let numberPart = extractNumber(tile);

      if (numberPart == 15) {
        return false;
      } else {
        let id = tile.id[0] + (numberPart + 1);
        return !wordTilesIds.includes(id) && document.getElementById(id).innerHTML;
      }
    }

    return wordTiles.some(tile => tile.id === 'h8' || ((isOccupiedUp(tile) || isOccupiedDown(tile) || isOccupiedLeft(tile) || isOccupiedRight(tile)) && hasNoGaps()));
  }

  let isValidPlacement = () => {
    return ((wordTiles.some(tile => tile.id === 'h8') && wordTiles.length > 1) || isContinuation()) && ((isValidToRight() && !isValidDownwards()) || (isValidDownwards() && !isValidToRight()) || wordTiles.length === 1);
  }

  let isContinuation = () => {
    let placedIds = wordTiles.map(tile => tile.id);

    // By collecting tiles and filtering out the tiles placed by the player, we can see if it is a continuation.
    down = wordTiles.some(tile => collectWordTiles(extractNumber(tile), extractLetter(tile), true).filter(id => !placedIds.includes(id)).length);
    side = wordTiles.some(tile => collectWordTiles(extractLetter(tile), extractNumber(tile), false).filter(id => !placedIds.includes(id)).length);

    return down || side;
  }

  let isValidToRight = () => {
    let checkLetter = extractLetter(wordTiles[0]);
    let checkNumber = extractNumber(wordTiles[0]);

    // If the word is towards right, the number parts of the ids are the same
    let isValid = tile => {
      return extractLetter(tile) !== checkLetter && extractNumber(tile) === checkNumber;
    }

    return wordTiles.slice(1).every(isValid);
  }

  let isValidDownwards = () => {
    let checkLetter = extractLetter(wordTiles[0]);
    let checkNumber = extractNumber(wordTiles[0]);

    // If the word is towards right, the letter parts of the ids are the same
    let isValid = tile => {
      return extractLetter(tile) === checkLetter && extractNumber(tile) !== checkNumber;
    }

    return wordTiles.slice(1).every(isValid);
  }

  let isDownwards = () => {
    return wordTiles.length > 1 && extractLetter(wordTiles[0]) === extractLetter(wordTiles[1]);
  }

  /***********************************
  /* START -> Methods to build words *
  /***********************************/

  let setWildTileAndSubmit = () => {
    cleanWordTiles();

    let wild = wordTiles.filter(tile => getLetter(tile) === " ");

    if (wild.length) {
      showDialogue("Enter a letter: ", wild);
    } else {
      submit();
    }
  }

  let submit = () => {
    if (isValidPlacement()) {
      word = produceWord();

      if (challengable) {
        processValidWords();
      } else {
        let wordsAsString = words.map(word => word.map(tile => getLetter(tile)).join("")).join(" ");
        App.game.validate_words(wordsAsString);
      }

    } else {
      App.game.printMessage("Tile placement is not valid!");
    }
  }

  let addTileToWord = tile => {
    if (tile.className !== 'rack-tile') {
      wordTiles.push(tile)
    }
  }

  let cleanWordTiles = () => {
    let cleaned = []

    // Remove duplicate and empty tile nodes
    for (let i = 0; i < wordTiles.length; i++) {
      if (!cleaned.includes(wordTiles[i]) && wordTiles[i].innerHTML !== '') {
        cleaned.push(wordTiles[i])
      }
    }

    cleaned.sort(sortById);

    wordTiles = cleaned;
  }

  let produceWord = () => {
    if (isDownwards()) {
      return isAdjacent() && produceDownwards();
    } else {
      return isAdjacent() && produceSideways();
    }
  }

  let produceDownwards = () => {
    let pre = extractLetter(wordTiles[0]);

    // A small arrow function argument to 'sort' method because it sorts according to unicode values
    // a - b because sort needs -1, 0, 1 to perform sorting
    let sortedIds = wordTiles.map(tile => extractNumber(tile)).sort((a, b) => a - b);

    let gatheredIds = collectWordTiles(sortedIds[0], pre, true);

    // If the node with the last id in sortedIds isn't in the list gatheredIds, an illegal move was made
    if (gatheredIds.indexOf(pre + sortedIds[sortedIds.length - 1]) === -1) {
      return false;
    }

    // Because isConsecutive expects numbers as ids for downwards words
    sortedIds = gatheredIds.map(id => extractNumber(id));

    for (let i = 0; i < wordTiles.length; i++) {
      let word = collectWordSideways(wordTiles[i]);

      if (word) {
        words.push(word);
      }
    }

    // Necessary for calculating points for adding the final main word
    words.push([]);

    // Construct the ids again with letter value
    let fullIds = sortedIds.map(id => pre + id.toString());

    // Get the letter values for the word in the sorted order
    let sortedWord = [];
    for (let i = 0; i < fullIds.length; i++) {
      let node = document.getElementById(fullIds[i]);

      words[words.length - 1].push(node);

      sortedWord.push(getLetter(node));
    }

    return isConsecutive(sortedIds) && sortedWord.join('');
  }

  let produceSideways = () => {
    let post = extractNumber(wordTiles[0]);

    // Unicode sort is ok because numeric parts are the same for the rows
    let sortedIds = wordTiles.map(tile => tile.id).sort();

    let gatheredIds = collectWordTiles(sortedIds[0][0], post);

    // If the node with the last id in sortedIds isn't in the list gatheredIds, an illegal move was made
    if (gatheredIds.indexOf(sortedIds[sortedIds.length - 1]) === -1) {
      return false;
    }

    for (let i = 0; i < wordTiles.length; i++) {
      let word = collectWordDownwards(wordTiles[i]);

      if (word) {
        words.push(word);
      }
    }

    // Get the letter values for the word in the sorted order
    let sortedWord = [];

    // If only one tile is placed, main word is a gathered word
    if (gatheredIds.length > 1) {
      // Necessary for calculating points for adding the final main word
      words.push([]);

      for (let i = 0; i < gatheredIds.length; i++) {
        let node = document.getElementById(gatheredIds[i]);
        
        words[words.length - 1].push(node);

        sortedWord.push(getLetter(node));
      }
    } else {
      sortedWord = words[words.length - 1]
    }

    return isConsecutive(gatheredIds) && sortedWord.join('');
  }

  let showDialogue = (message, wT, confirm=false, finish=false, ptsLimit=false) => {
    let outerDiv = document.getElementById("outer-div");
    let p = document.getElementById("dialogue-text");
    let input = document.getElementById("dialogue-input");
    let cancelButton = document.getElementById("dialogue-cancel");
    let submitButton = document.getElementById("dialogue-submit");

    let dSubmit = event => {
      if (confirm) {
        if (finish) {
          App.game.challenge(true);
        } else {
          forfeit();
        }

        outerDiv.classList.add("d-none");

        submitButton.removeEventListener("click", dSubmit);
      } else {
        let wildTileValue = input.value.toUpperCase().replace(/[^A-Z]/, '');
        let lettersToPass = input.value.toUpperCase().replace(/[^A-Z ]/, '');

        if (wT && wildTileValue.length === 1) {
          outerDiv.classList.add("d-none")

          setLetter(wT[0], wildTileValue);
          wT[0].lastChild.textContent = 0;

          wildTile = wildTileValue;

          App.game.make_move(wT[0].id + " " + wildTileValue + "*")

          input.value = "";

          if (wT.length > 1) {
            submitButton.removeEventListener("click", dSubmit);

            wildTile2 = wildTile;

            showDialogue("Enter a letter: ", wT.slice(1, 2));
          } else {
            submit();

            submitButton.removeEventListener("click", dSubmit);
          }
        } else if (!wT) {
          outerDiv.classList.add("d-none")

          input.value = "";

          pass(lettersToPass.split(""));

          submitButton.removeEventListener("click", dSubmit);
        }
      }
    }

    p.textContent = message;

    if (confirm) {
      input.classList.remove("d-block");
      input.classList.add("d-none");

      if (finish) {
        submitButton.textContent = "Challenge";
        cancelButton.textContent = "End";
      } else {
        submitButton.textContent = "Forfeit";
        cancelButton.textContent = "Cancel";
      }
    } else {
      input.classList.add("d-block");
      input.classList.remove("d-none");
      submitButton.textContent = "Submit";
      cancelButton.textContent = "Cancel";
    }

    outerDiv.classList.remove("d-none");

    cancelButton.addEventListener("click", event => {
      if (confirm && finish) {
        deductPoints(ptsLimit);
      } else if (!confirm) {
        input.value = "";
      }

      outerDiv.classList.add("d-none");
    });

    submitButton.addEventListener("click", dSubmit);
  }

  let pass = lettersToPass => {
    let lettersOnRack = rackTiles.map(rackTile => rackTile.textContent[0]);

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
      passedLetters = lettersToPass;

      removeTilesFromBoard();

      App.game.pass_letters(lettersToPass);
    }
  }

  let collectWordTiles = (start, affix, downwards=false) => {
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

  let collectWordSideways = tile => {
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

  let collectWordDownwards = tile => {
    let word = [tile];

    let collectUpwards = tile => {
      let id = tile.id[0] + (extractNumber(tile) - 1);
      let node = document.getElementById(id);

      while (node && node.innerHTML) {
        word.unshift(node)
        id = id[0] + (Number(id.slice(1)) - 1);
        node = document.getElementById(id);
      }
    }

    let collectDownwards = tile => {
      let id = tile.id[0] + (extractNumber(tile) + 1);
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

  let getInBetweenTiles = () => {
    let sortedWordTiles = wordTiles.sort(sortById);
    let onBoard = [];

    if (determineDirection() === "D") {
      let idLetter = extractLetter(sortedWordTiles[0]);
      let idNumbers = sortedWordTiles.map(tile => extractNumber(tile));

      for(let i = 0; i < idNumbers.length; i++) {
        let calculatedIdNumber = idNumbers[i] + 1;

        if (idNumbers[i + 1] && calculatedIdNumber != idNumbers[i + 1] && calculatedIdNumber < 15) {
          onBoard.push(idLetter + String(calculatedIdNumber));

          let lastIdNumber = extractNumber(onBoard[onBoard.length - 1]);

          while(idNumbers[i + 1] != lastIdNumber + 1 && lastIdNumber + 1 < 15) {
            lastIdNumber = lastIdNumber + 1;
            onBoard.push(idLetter + String(lastIdNumber));
          }
        }
      }
    } else {
      let idLetters = sortedWordTiles.map(tile => extractLetter(tile));
      let idNumber = extractNumber(sortedWordTiles[0]);

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

  let determineDirection = () => {
    let idLetters = wordTiles.map(tile => tile.id[0]);
    let checkLetter = idLetters[0];

    if (idLetters.slice(1).every(idLetter => idLetter === checkLetter)) {
      return "D";
    } else {
      return "R";
    }
  }

  let extractLetter = tile => {
    // First index of the id is a letter
    return tile.id[0];
  }

  let extractNumber = tileOrId => {
    let id = tileOrId.id || tileOrId;

    // Get indeces except the first one (that is, the numeric part)
    return Number(id.split('').slice(1).join(''));
  }

  // This function is only used with 'sort' Array method.
  let sortById = (t1, t2) => {
    let t1Letter = extractLetter(t1);
    let t1Number = extractNumber(t1);
    let t2Letter = extractLetter(t2);
    let t2Number = extractNumber(t2);

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

  let determineTileBackground = tile => {
    if (tile.innerHTML) {
      tile.style.backgroundColor = '#BE975B';
    } else if (tripleWordBonus.includes(tile.id)) {
      tile.style.backgroundColor = '#ff3300';
    } else if (doubleWordBonus.includes(tile.id)) {
      tile.style.backgroundColor = '#ff99cc';
    } else if (tripleLetterBonus.includes(tile.id)) {
      tile.style.backgroundColor = '#3366ff';
    } else if (doubleLetterBonus.includes(tile.id)) {
      tile.style.backgroundColor = '#b3c6ff';
    } else if (tile.className === 'rack-tile') {
      tile.style.backgroundColor = '#cccccc';
    } else {
      tile.style.backgroundColor = '#ffd6cc';
    }
  }

  let removeTilesFromBoard = () => {
    for (let i = 0; i < rackTiles.length; i++) {
      if (!rackTiles[i].innerHTML && wordTiles.length) {
        let tileOnBoard = wordTiles.pop();

        rackTiles[i].innerHTML = tileOnBoard.innerHTML;
        tileOnBoard.innerHTML = "";
        determineTileBackground(rackTiles[i]);
        determineTileBackground(tileOnBoard);

        App.game.remove_tile(tileOnBoard.id);
      }
    }
  }

  let activateWordTiles = () => {
    for (let i = 0; i < prevWordTiles.length; i++) {
      prevWordTiles[i].draggable = true;
    }
  }

  let deactivateWordTiles = () => {
    for (let i = 0; i < wordTiles.length; i++) {
      wordTiles[i].draggable = false;
    }
  }

  let deactivateBoardAndButtons = () => {
    let tiles = document.getElementById("board").children;

    for (let i = 0; i < tiles.length; i++) {
      tiles[i].draggable = false;
    }

    for (let i = 0; i < rackTiles.length; i++) {
      rackTiles[i].draggable = false;
    }

    started = false;

    if (timeLimit > 1) {
      clearInterval(tickTock);
    }
  }

  let replaceRackTiles = () => {
    let replaceTile = (presentTile, prevTile) => {
      presentTile.innerHTML = prevTile.innerHTML;
      prevTile.innerHTML = "";
      determineTileBackground(presentTile);
      determineTileBackground(prevTile);

      App.game.remove_tile(prevTile.id);
    }

    // This method is called after a challenge is successful to return drawn letters to bag
    if (rackTiles.every(rackTile => !rackTile.innerHTML)) {
      // If rack is completely empty, just put the placed tiles back on
      for (let i = 0; i < prevWordTiles.length; i++) {
        if (getLetter(prevWordTiles[i]) == wildTile) {
          setLetter(prevWordTiles[i], " ");
        }

        replaceTile(rackTiles[i], prevWordTiles[i]);
      }
    } else {
      // If not completely empty, then should check if replacing the correct letter
      for (let i = 0; i < drawnTiles.length; i++) {
        for (let j = 0; j < rackTiles.length; j++) {
          if (drawnTiles[i] === getLetter(rackTiles[j])) {
            let tile = prevWordTiles.pop();

            if (getLetter(tile) == wildTile) {
              setLetter(tile, " ");
            }

            replaceTile(rackTiles[j], tile);

            break;
          }
        }
      }
    }

    App.game.return_back_letters(drawnTiles);
  }  

  let populateRack = tiles => {
    drawnTiles = tiles.slice();

    for (let i = 0; i < rackTiles.length; i++) {
      if (!rackTiles[i].innerHTML) {
        let tile = tiles.pop()
        
        if (tile) {
          rackTiles[i].innerHTML = '<span></span><sub></sub>';
          setLetter(rackTiles[i], tile == "." ? " " : tile);

          if (tile != ".") {
            rackTiles[i].lastChild.textContent = letterPoints[tile];
          }

          determineTileBackground(rackTiles[i]);
        }
      }
    }
  }

  let resetPlacedWildTile = tile => {
    if ([wildTile, wildTile2].includes(getLetter(tile))) {
      if (wildTile == getLetter(tile)) {
        wildTile = null;
      } else {
        wildTile2 = null;
      }

      setLetter(tile, " ");
      tile.lastChild.textContent = "";
    }
  }

  let getLetter = tile => {
    return tile.getElementsByTagName("SPAN")[0].textContent;
  }

  let setLetter = (tile, value) => {
    tile.getElementsByTagName("SPAN")[0].textContent = value;
  }

  /**************************************************
  /* START -> Methods to determine points and score *
  /**************************************************/

  let calcPoints = () => {
    let calcWordPoints = word => {
      let points = 0;

      word.forEach(tile => points += calcLetterBonus(tile));
      word.forEach(tile => points *= calcWordBonus(tile));

      return points;
    }

    // Additional 60 points if all the tiles in the rack are used
    let points = rackTiles.every(tile => !tile.innerHTML) && wordTiles.length == 7 ? 60 : 0;

    words.forEach(word => points += calcWordPoints(word));

    prevTurnScore = points;

    return points;
  }

  let calcLetterBonus = tile => {
    if (tile.lastChild.textContent != '0') {
      // Make sure the tile wasn't placed previously. Draggable means it is just placed.
      if (tile.draggable) {
        if (doubleLetterBonus.includes(tile.id)) {
          return letterPoints[getLetter(tile)] * 2;
        } else if (tripleLetterBonus.includes(tile.id)) {
          return letterPoints[getLetter(tile)] * 3;
        } else {
          return letterPoints[getLetter(tile)];
        }
      } else {
        return letterPoints[getLetter(tile)];
      }
    } else {
      return 0;
    }
  }

  let calcWordBonus = tile => {
    // Make sure the tile wasn't placed previously. Draggable means it is just placed. 
    if (tile.draggable) {
      if (tripleWordBonus.includes(tile.id)) {
        return 3;
      } else if (doubleWordBonus.includes(tile.id)) {
        return 2;
      } else {
        return 1;
      }
    } else {
      return 1;
    }
  }

  let deductPoints = ptsLimit => {
    if (!ptsLimit) {
      for (let i = 0; i < rackTiles.length; i++) {
        if (rackTiles[i].innerHTML) {
          pointsToBeDeducted = letterPoints[getLetter(rackTiles[i])];
          deductedPoints += pointsToBeDeducted;
          totalScore -= pointsToBeDeducted;
        }
      }
    }

    App.game.printMessage('You: ' + totalScore);
    App.game.deliver_score(totalScore, true);
  }

  let forfeit = () => {
    App.game.forfeit(totalScore);
    deactivateBoardAndButtons();
    App.game.printMessage("You have forfeited the game. 50 points has been deducted from your overall score.");
  }

  let resetTurn = () => {
    prevWordTiles = wordTiles.slice();
    prevWords = words.slice();
    wordTiles = [];
    words = [];

    if (isFirstMove) {
      isFirstMove = false;
    }

    messagesArea.firstChild.textContent = 'You: ' + totalScore;
  }

  return publicAPI;
}