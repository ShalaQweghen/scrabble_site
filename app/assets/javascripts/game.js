let Game = function() {
  this.init = function(gameId, letters, opponent, firstToGo, challengable) {
    this.scoreBoard = document.getElementById("score");
    this.scoreBoard.innerHTML = '<p>Own Score: 0</p><p>Opponent Score: 0</p><br><p>Letters in Bag: 86</p>';

    this.gameId = gameId;
    this.opponent = opponent;

    this.letterClicked = '';
    this.dragged = null;
    this.opponentWord = "";

    this.drawnLetters = [];
    this.rackTiles = [];
    this.wildTile = '';
    this.wordTiles = [];
    this.prevWordTiles = [];

    this.word = '';
    this.words = [];
    this.prevWords = [];

    this.isFirstMove = firstToGo;
    this.myTurn = firstToGo;
    this.passedLetters = [];
    this.challengable = challengable;
    this.challenged = false;
    this.challenging = false;
    this.mayChallenge = true;
    this.aboutToFinish = false;

    this.turnScore = 0;
    this.totalScore = 0;
    this.prevTurnScore = 0;
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

    this.prepareBoard();
    this.prepareRack();
    this.prepareButtons();
    this.populateRack(letters);
  }

  this.prepareBoard = function() {
    let that = this;
    let board = document.getElementById('board');

    for (let i = 1; i <= 15; i++) {
      for (let j = 97; j <= 111; j++) {
        let div = document.createElement('div');
        div.id = String.fromCharCode(j) + i;
        div.className = 'tile';
        this.determineTileBackground(div);

        div.addEventListener('contextmenu', function(event) {
          // because of event capturing, this is necessary
          let node = event.target;
          if (['SPAN', 'SUB'].includes(event.target.nodeName)) {
            node = event.target.parentNode;
          }

          if (node.innerHTML && node.draggable) {
            // prevent context menu to pop up
            event.preventDefault();

            // find the first empty spot in rack
            let emptyRackTiles = that.rackTiles.filter((tile) => tile.innerHTML === '');
            let tile = emptyRackTiles[0];

            // adjust content and background
            tile.innerHTML = node.innerHTML;
            node.innerHTML = '';
            that.determineTileBackground(tile);
            that.determineTileBackground(node);
          }
        });

        this.addDefaultHandlers(div);
        board.appendChild(div);
      }
    }
  }

  this.prepareRack = function() {
    let rack = document.getElementById('rack');

    for (let i = 0; i < 7; i++) {
      let div = document.createElement('div');
      div.className = 'rack-tile';
      this.addDefaultHandlers(div);
      this.rackTiles.push(div);
      rack.appendChild(div);
    }
  }

  this.prepareButtons = function() {
    let that = this;

    let buttonsArea = document.getElementById("buttons");

    let sub = document.createElement('button');
    sub.textContent = "Submit";
    sub.addEventListener('click', function(event) {
      if (that.myTurn) {
        that.cleanWordTiles();

        if (that.isValidPlacement()) {
          that.word = that.produceWord();

          if (that.challengable) {
            that.processValidWords();
          } else {
            wordsAsString = that.words.map(word => word.map(tile => tile.getElementsByTagName("SPAN")[0].textContent).join("")).join(" ");
            App.game.validate_words(wordsAsString);
          }

        } else {
          App.game.printMessage("Tile placement is not valid!");
        }
      }
    });
    buttons.appendChild(sub);

    let pass = document.createElement('button');
    pass.textContent = "Pass";
    pass.addEventListener('click', function(event) {
      if (that.myTurn) {
        let letters = prompt("Enter letters to change: ").toUpperCase().replace(/[^A-Z]/g, '').split('');
        let lettersOnRack = that.rackTiles.map(tile => tile.textContent[0]);
        letters = letters.filter(letter => lettersOnRack.includes(letter));
        that.passedLetters = letters;

        App.game.pass_letters(that.gameId, letters);
      }
    });
    buttons.appendChild(pass);

    if (this.challengable) {
      let challenge = document.createElement("button");
      challenge.textContent = "Challenge";
      challenge.addEventListener('click', function() {
        if (that.myTurn && !that.isFirstMove && that.mayChallenge) {
          for (let i = 0; i < that.rackTiles.length; i++) {
            if (!that.rackTiles[i].innerHTML) {
              let tile = that.wordTiles.pop();

              that.rackTiles[i].innerHTML = tile.innerHTML;
              tile.innerHTML = "";
              that.determineTileBackground(that.rackTiles[i]);
              that.determineTileBackground(tile);

              App.game.remove_tile(tile.id);
            }
          }

          that.wordTiles = [];
          that.challenging = true;
          that.mayChallenge = false;
          App.game.challenge(false);
        }
      })

      buttons.appendChild(challenge);
    }

    let shuf = document.createElement('button');
    shuf.textContent = "Shuffle";
    shuf.addEventListener('click', function() {
      let tiles = [];

      // get tiles from tile nodes
      for (let i = 0; i < that.rackTiles.length; i++) {
        tiles.push(that.rackTiles[i].innerHTML)
      }

      shuffle(tiles);

      // place letter values to tile nodes
      for (let i = 0; i < that.rackTiles.length; i++) {
        that.rackTiles[i].innerHTML = tiles[i];
        that.determineTileBackground(that.rackTiles[i]);
      }
    });
    buttons.appendChild(shuf);
  }

  this.challenge = function(last) {
    this.aboutToFinish = last == "true";
    this.challenged = true;
    let wordsAsString = this.prevWords.map(word => word.map(tile => tile.getElementsByTagName("SPAN")[0].textContent).join("")).join(" ");
    App.game.validate_words(wordsAsString + " " + this.word);
  }

  this.processValidWords = function() {
    if (this.aboutToFinish) {
      this.theEnd();
    } else if (this.challenged) {
      App.game.switch_turn(this.gameId, 0);
    } else if (this.word) {

      this.totalScore += this.calcPoints();
      this.deactivateWordTiles();
      this.resetTurn();

      if (this.isFirstMove) {
        this.isFirstMove = false;
      }

      this.scoreBoard.firstChild.textContent = 'Own Score :' + this.totalScore;

      App.game.deliver_score(this.totalScore);
      App.game.switch_turn(this.gameId, 7 - this.rackTiles.filter(node => node.innerHTML).length);
    } else {
      App.game.printMessage("Tile placement is not valid!");
    }
  }

  this.processInvalidWords = function(word) {
    if (this.challenged) {
      this.aboutToFinish = false;
      this.challenged = false;
      this.totalScore -= this.prevTurnScore;

      this.activateWordTiles();
      this.replaceRackTiles();

      this.scoreBoard.firstChild.textContent = "Own Score :" + this.totalScore;

      App.game.printMessage("You have been challenged! '" + word + "' is not a valid word!");
      App.game.deliver_score(this.totalScore);
    } else {
      App.game.printMessage("'" + word + "' is not a valid word!");
    }
    this.words = [];
  }

  this.replaceRackTiles = function() {
    if (this.rackTiles.every(tile => !tile.innerHTML)) {
      for (let i = 0; i < this.prevWordTiles.length; i++) {
        this.rackTiles[i].innerHTML = this.prevWordTiles[i].innerHTML;
        this.prevWordTiles[i].innerHTML = "";
        this.determineTileBackground(this.rackTiles[i]);
        this.determineTileBackground(this.prevWordTiles[i]);

        App.game.remove_tile(this.prevWordTiles[i].id);
      }
    } else {
      for (let i = 0; i < this.drawnLetters.length; i++) {
        for (let j = 0; j < this.rackTiles.length; j++) {
          if (this.drawnLetters[i] === this.rackTiles[j].getElementsByTagName("SPAN")[0].textContent) {
            this.rackTiles[j].innerHTML = this.prevWordTiles[i].innerHTML;
            this.prevWordTiles[i].innerHTML = "";
            this.determineTileBackground(this.rackTiles[j]);
            this.determineTileBackground(this.prevWordTiles[i]);

            App.game.remove_tile(this.prevWordTiles[i].id);

            break;
          }
        }
      }
    }

    App.game.return_back_letters(this.gameId, this.drawnLetters);
  }

  this.populateRack = function(letters) {
    this.drawnLetters = letters.slice();

    for (let i = 0; i < this.rackTiles.length; i++) {
      if (!this.rackTiles[i].innerHTML) {
        let letter = letters.pop()
        
        if (letter) {
          this.rackTiles[i].innerHTML = '<span></span><sub></sub>';
          this.rackTiles[i].getElementsByTagName('span')[0].textContent = letter;
          this.rackTiles[i].lastChild.textContent = this.letterPoints[letter];
          this.determineTileBackground(this.rackTiles[i]);
        }
      }
    }
  }

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

  this.addDefaultHandlers = function(elem) {
    let that = this;

    elem.draggable = true;

    elem.addEventListener('dragstart', function(event) {
      if (event.target.innerHTML) {
        event.dataTransfer.setData('text/html', event.target.innerHTML);
        that.dragged = event.target;

        if (event.target.className != "rack-tile" && that.myTurn) {
          App.game.remove_tile(event.target.id);
        }
      }
    });

    elem.addEventListener('dragend', function(event) {
      that.determineTileBackground(event.target);
      that.dragged = null;
    });

    elem.addEventListener('click', function(event) {
      // because of event capturing, this is necessary
      let node = event.target;
      if (['SPAN', 'SUB'].includes(event.target.nodeName)) {
        node = event.target.parentNode;
      }

      if (node.draggable && (that.myTurn || node.className == "rack-tile")) {
        if (node.innerHTML !== '') {
          // both board tile and clicked tile are occupied
          // this is the click to place the letter with swapping
          if (that.letterClicked !== '') {
            // swap letters
            [node.innerHTML, that.letterClicked] = [that.letterClicked, node.innerHTML];
            that.addToWord(node)

            if (node.className != "rack-tile" && that.myTurn) {
              App.game.remove_tile(node.id);
              App.game.make_move(node.id + " " + node.getElementsByTagName("SPAN")[0].textContent);
            }
          } 
          // this is the click to grab the letter
          else {
            that.letterClicked = node.innerHTML;
            node.innerHTML = '';
            that.determineTileBackground(node);

            if (node.className != "rack-tile" && that.myTurn) {
              App.game.remove_tile(node.id);
            }
          }
        } else {
          // this is the click to place the letter without swapping
          if (that.letterClicked !== '') {
            node.innerHTML = that.letterClicked;
            that.letterClicked = '';
            that.determineTileBackground(node);
            that.addToWord(node);

            if (node.className != "rack-tile" && that.myTurn) {
              App.game.make_move(node.id + " " + node.getElementsByTagName("SPAN")[0].textContent);
            }
          }
        }
      }
    });

    elem.addEventListener('dragover', function(event) {
      event.preventDefault();

      return false;
    });

    elem.addEventListener('drop', function(event) {
      // because of event capturing, this is necessary
      let node = event.target;
      if (['SPAN', 'SUB'].includes(event.target.nodeName)) {
        node = event.target.parentNode;
      }

      if (that.dragged && node.draggable && (that.myTurn || node.className == 'rack-tile')) {
        that.dragged.innerHTML = node.innerHTML;
        node.innerHTML = event.dataTransfer.getData('text/html');

        that.determineTileBackground(node);
        that.addToWord(node);

        if (node.className != 'rack-tile') {
          App.game.make_move(node.id + " " + node.getElementsByTagName("SPAN")[0].textContent);
        }

        event.preventDefault();
      }
    });
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

  this.resetTurn = function() {
    this.prevWordTiles = this.wordTiles;
    this.prevWords = this.words;
    this.wordTiles = [];
    this.words = [];
  }

  this.addToWord = function(tile) {
    if (tile.className !== 'rack-tile') {
      this.wordTiles.push(tile)
    }
  }

  this.cleanWordTiles = function() {
    let cleaned = []

    // remove duplicate and empty tile nodes
    for (let i = 0; i < this.wordTiles.length; i++) {
      if (!cleaned.includes(this.wordTiles[i]) && this.wordTiles[i].innerHTML !== '') {
        cleaned.push(this.wordTiles[i])
      }
    }

    cleaned.sort(function(t1, t2) {
      if (t1.id < t2.id) {
        return -1;
      } else if (t1.id > t2.id) {
        return 1;
      } else {
        return 0;
      }
    });

    this.wordTiles = cleaned;
  }

  this.isConsecutive = function(ids) {
    for (let i = 0; i < ids.length; i++) {
      if (ids[i + 1]) {
        // word is towards right
        // ids are strings
        if (typeof ids[i] === 'string') {
          if (ids[i + 1].charCodeAt(0) - ids[i].charCodeAt(0) !== 1) {
            return false;
          }
        }
        // word is downwards
        // ids are numbers
        else {
          if (ids[i + 1] - ids[i] !== 1) {
            return false;
          }
        }
      }
    }

    return true;
  }

  this.collectWordSideways = function(tile) {
    let word = [tile];

    function collectToRight(tile) {
      let id = String.fromCharCode(tile.id.charCodeAt(0) + 1) + tile.id.slice(1);
      let node = document.getElementById(id);

      while (node && node.innerHTML) {
        word.push(node)
        id = String.fromCharCode(id.charCodeAt(0) + 1) + id.slice(1);
        node = document.getElementById(id);
      }
    }

    function collectToLeft(tile) {
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
    let that = this;
    let word = [tile];

    function collectUpwards(tile) {
      let id = tile.id[0] + (that.extractNumber(tile) - 1);
      let node = document.getElementById(id);

      while (node && node.innerHTML) {
        word.unshift(node)
        id = id[0] + (Number(id.slice(1)) - 1);
        node = document.getElementById(id);
      }
    }

    function collectDownwards(tile) {
      let id = tile.id[0] + (that.extractNumber(tile) + 1);
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

  this.determineDirection = function() {
    let idLetters = this.wordTiles.map(tile => tile.id[0]);
    let checkLetter = idLetters[0];

    if (idLetters.slice(1).every(il => il === checkLetter)) {
      return "D";
    } else {
      return "R";
    }
  }

  this.getInBetweenTiles = function() {
    let that = this;
    let onBoard = [];

    if (this.determineDirection() === "D") {
      let idLetter = this.extractLetter(this.wordTiles[0]);
      let idNumbers = this.wordTiles.map(tile => that.extractNumber(tile));

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
      let idLetters = this.wordTiles.map(tile => that.extractLetter(tile));
      let idNumber = this.extractNumber(this.wordTiles[0]);

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

  this.hasNoGaps = function() {
    let inBetweenTiles = this.getInBetweenTiles();

    return !inBetweenTiles.length || inBetweenTiles.every(id => document.getElementById(id).innerHTML);
  }

  this.isAdjacent = function() {
    let that = this;
    let wordTilesIds = this.wordTiles.map(tile => tile.id);

    function isOccupiedRight(tile) {
      if (that.extractLetter(tile) == "o") {
        return false;
      } else {
        let id = String.fromCharCode(tile.id.charCodeAt(0) + 1) + tile.id.slice(1);
        return !wordTilesIds.includes(id) && document.getElementById(id).innerHTML;
      }
    }

    function isOccupiedLeft(tile) {
      if (that.extractLetter(tile) == "a") {
        return false;
      } else {
        let id = String.fromCharCode(tile.id.charCodeAt(0) - 1) + tile.id.slice(1);
        return !wordTilesIds.includes(id) && document.getElementById(id).innerHTML;
      }
    }
    
    function isOccupiedUp(tile) {
      let numberPart = that.extractNumber(tile);

      if (numberPart == 1) {
        return false;
      } else {
        let id = tile.id[0] + (numberPart - 1);
        return !wordTilesIds.includes(id) && document.getElementById(id).innerHTML;
      }
    }

    function isOccupiedDown(tile) {
      let numberPart = that.extractNumber(tile);

      if (numberPart == 15) {
        return false;
      } else {
        let id = tile.id[0] + (numberPart + 1);
        return !wordTilesIds.includes(id) && document.getElementById(id).innerHTML;
      }
    }

    return this.wordTiles.some(tile => tile.id === 'h8' || ((isOccupiedUp(tile) || isOccupiedDown(tile) || isOccupiedLeft(tile) || isOccupiedRight(tile)) && that.hasNoGaps()));
  }

  this.produceWord = function() {
    if (this.isDownwards()) {
      return this.isAdjacent() && this.produceDownwards();
    } else {
      return this.isAdjacent() && this.produceSideways();
    }
  }

  this.extractLetter = function(tile) {
    // first index of the id is a letter
    return tile.id[0];
  }

  this.extractNumber = function(tileOrId) {
    // can 
    let id = tileOrId.id || tileOrId;

    // get indeces except the first one (that is, the numeric part)
    return Number(id.split('').slice(1).join(''));
  }

  this.isValidPlacement = function() {
    return ((this.wordTiles.some(tile => tile.id === 'h8') && this.wordTiles.length > 1) || this.isContinuation()) && ((this.isValidToRight() && !this.isValidDownwards()) || (this.isValidDownwards() && !this.isValidToRight()) || this.wordTiles.length === 1);
  }

  this.isValidToRight = function() {
    let that = this;
    let checkLetter = this.extractLetter(this.wordTiles[0]);
    let checkNumber = this.extractNumber(this.wordTiles[0]);

    function isValid(tile) {
      return that.extractLetter(tile) !== checkLetter && that.extractNumber(tile) === checkNumber;
    }

    return this.wordTiles.slice(1).every(isValid);
  }

  this.isValidDownwards = function() {
    let that = this;
    let checkLetter = this.extractLetter(this.wordTiles[0]);
    let checkNumber = this.extractNumber(this.wordTiles[0]);

    function isValid(tile) {
      return that.extractLetter(tile) === checkLetter && that.extractNumber(tile) !== checkNumber;
    }

    return this.wordTiles.slice(1).every(isValid);
  }

  this.isContinuation = function() {
    let that = this;

    let placedIds = this.wordTiles.map(tile => tile.id);

    down = this.wordTiles.some(tile => that.collectWordTiles(that.extractNumber(tile), that.extractLetter(tile), true).filter(id => !placedIds.includes(id)).length);
    side = this.wordTiles.some(tile => that.collectWordTiles(that.extractLetter(tile), that.extractNumber(tile), false).filter(id => !placedIds.includes(id)).length);

    return down || side;
  }

  this.isDownwards = function() {
    return this.wordTiles.length > 1 && this.extractLetter(this.wordTiles[0]) === this.extractLetter(this.wordTiles[1]);
  }

  this.collectWordTiles = function(start, affix, downwards=false) {
    let tiles = [];
    let node = null;

    if (downwards) {
      node = document.getElementById(affix + start);

      while (node && node.innerHTML) {
        tiles.push(node.id);
        start += 1;
        node = document.getElementById(affix + start);
      }

      start = start - (tiles.length + 1)

      node = document.getElementById(affix + start)

      while (node && node.innerHTML) {
        tiles.unshift(node.id);
        start -= 1;
        node = document.getElementById(affix + start);
      }

    } else {
      node = document.getElementById(start + affix);

      while (node && node.innerHTML) {
        tiles.push(node.id);
        start = String.fromCharCode(start.charCodeAt(0) + 1);
        node = document.getElementById(start + affix);
      }

      start = String.fromCharCode(tiles[0].charCodeAt(0) - 1);

      node = document.getElementById(start + affix);

      while (node && node.innerHTML) {
        tiles.unshift(node.id);
        start = String.fromCharCode(start.charCodeAt(0) - 1);
        node = document.getElementById(start + affix);
      }
    }

    return tiles;
  }

  this.produceDownwards = function() {
    let pre = this.extractLetter(this.wordTiles[0]);

    // sort the numeric parts of the ids
    // a little func arg to sort func cuz it sorts according to unicode values
    // a - b because sort needs -1, 0, 1 to perform sorting
    let sortedIds = this.wordTiles.map(tile => this.extractNumber(tile)).sort((a, b) => a - b);

    let gatheredIds = this.collectWordTiles(sortedIds[0], pre, true);

    // if the node with the last id in sortedIds isn't 
    // in the list gatheredIds, an illegal move was made
    if (gatheredIds.indexOf(pre + sortedIds[sortedIds.length - 1]) === -1) {
      return false;
    }

    // because this.isConsecutive expects numbers as ids for downwards this.words
    sortedIds = gatheredIds.map(id => this.extractNumber(id));

    for (let i = 0; i < this.wordTiles.length; i++) {
      let word = this.collectWordSideways(this.wordTiles[i]);

      if (word) {
        this.words.push(word);
      }
    }

    // necessary for calculating points
    // for adding the final main word
    this.words.push([]);

    // construct the ids again with letter value
    let fullIds = sortedIds.map(id => pre + id.toString());

    // get the letter values for the word in the sorted order
    let sortedWord = [];
    for (let i = 0; i < fullIds.length; i++) {
      let node = document.getElementById(fullIds[i]);

      this.words[this.words.length - 1].push(node);

      // set the wild tile if any
      if (node.getElementsByTagName('span')[0].textContent === ' ') {
        let toBeReplaced = this.askForWildTile();
        node.getElementsByTagName('span')[0].textContent = toBeReplaced;

        App.game.make_move(node.id + " " + toBeReplaced + "*");
      }

      sortedWord.push(node.getElementsByTagName('span')[0].textContent);
    }

    return this.isConsecutive(sortedIds) && sortedWord.join('');
  }

  this.produceSideways = function() {
    let post = this.extractNumber(this.wordTiles[0]);

    // unicode sort is ok cuz numeric parts are the same for the rows
    let sortedIds = this.wordTiles.map(tile => tile.id).sort();

    let gatheredIds = this.collectWordTiles(sortedIds[0][0], post);

    // if the node with the last id in sortedIds isn't 
    // in the list gatheredIds, an illegal move was made
    if (gatheredIds.indexOf(sortedIds[sortedIds.length - 1]) === -1) {
      return false;
    }

    for (let i = 0; i < this.wordTiles.length; i++) {
      let word = this.collectWordDownwards(this.wordTiles[i]);

      if (word) {
        this.words.push(word);
      }
    }

    // necessary for calculating points
    // for adding the final main word
    this.words.push([]);

    // get the letter values for the word in the sorted order
    let sortedWord = [];
    for (let i = 0; i < gatheredIds.length; i++) {
      let node = document.getElementById(gatheredIds[i]);
      
      this.words[this.words.length - 1].push(node);

      // set the wild tile if any
      if (node.getElementsByTagName('span')[0].textContent === ' ') {
        let toBeReplaced = this.askForWildTile();
        node.getElementsByTagName('span')[0].textContent = toBeReplaced;

        App.game.make_move(node.id + " " + toBeReplaced + "*");
      }

      sortedWord.push(node.getElementsByTagName('span')[0].textContent);
    }

    return this.isConsecutive(gatheredIds) && sortedWord.join('');
  }

  this.askForWildTile = function() {
    this.wildTile = prompt("Enter a letter: ").toUpperCase().replace(/[^A-Z]/, '');

    if (this.wildTile.length === 1) {
      return this.wildTile;
    } else {
      this.askForWildTile();
    }
  }

  this.calcPoints = function() {
    let that = this;

    function calcWordPoints(word) {
      let points = 0;

      word.forEach(tile => points += that.calcLetterBonus(tile));
      word.forEach(tile => points *= that.calcWordBonus(tile));

      return points;
    }

    let points = 0;
    this.words.forEach(word => points += calcWordPoints(word));

    this.prevTurnScore = points;

    return points;
  }

  this.calcLetterBonus = function(tile) {
    // make sure the tile wasn't placed previously
    // draggable means it is just placed 
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
  }

  this.calcWordBonus = function(tile) {
    // make sure the tile wasn't placed previously
    // draggable means it is just placed 
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

  this.passLetters = function(letters) {
    letters = letters.split("")

    for (let i = 0; i < this.passedLetters.length; i++) {
      let rackTile = this.rackTiles.find(tile => tile.textContent[0] === this.passedLetters[i]);
      rackTile.getElementsByTagName('span')[0].textContent = letters[i];
      rackTile.lastChild.textContent = this.letterPoints[letters[i]];
    }

    App.game.switch_turn(this.gameId, 0);
  }

  this.placeTile = function(id, letter) {
    // If the letter to be placed is wild tile, '*' is appended to the letter
    letter = letter.split("");

    let tile = document.getElementById(id);
    tile.draggable = false;
    tile.innerHTML = '<span></span><sub></sub>';
    tile.getElementsByTagName('span')[0].textContent = letter[0];
    
    // If the letter to be placed is wild tile, length is two
    if (letter.length > 1) {
      tile.lastChild.textContent = 0;
    } else {
      tile.lastChild.textContent = this.letterPoints[letter[0]];
    }

    this.determineTileBackground(tile);
  }

  this.removeTile = function(id) {
    let tile = document.getElementById(id);
    tile.innerHTML = "";
    tile.draggable = true;
    this.determineTileBackground(tile);
  }

  this.switchTurn = function(letters, letRemaining, gameOver) {
    this.myTurn = !this.myTurn;

    if (this.myTurn) {
      this.drawnLetters = [];
    }

    if (gameOver == "true" && this.rackTiles.every(tile => !tile.innerHTML)) {
      App.game.finalize_game();
    } else {
      if (letters) {
        this.populateRack(letters.split(""));
      }

      this.scoreBoard.lastChild.textContent = 'Letters in Bag: ' + letRemaining;

      this.mayChallenge = true;

      if (this.challenged) {
        this.challenged = false;
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

  this.updateScore = function(score) {
    if (this.challenging) {
      this.challenging = false;
      App.game.printMessage("Challenge successful! Your turn...");
    }

    pElems = this.scoreBoard.children;

    pElems[0].textContent = 'Own Score: ' + this.totalScore;
    pElems[1].textContent = 'Opponent Score: ' + score;
    this.opponentScore = score;
  }

  this.finishGame = function() {
    if (this.challengable) {
      if (this.myTurn) {
        if (confirm("There are no letters left in the bag. Would you like to challenge the last word?")) {
          App.game.challenge(true);
        } else {
          App.game.yield();
          this.theEnd();
        }
      } else {
        App.game.printMessage("Waiting to see if your oppenent will challenge your last word...");
      }
    } else {
      this.theEnd();
    }
  }

  this.theEnd = function() {
    this.myTurn = false;

    let tiles = document.getElementById("board").children;

    for (let i = 0; i < tiles.length; i++) {
      tiles[i].draggable = false;
    }

    for (let i = 0; i < this.rackTiles.length; i++) {
      this.rackTiles[i].draggable = false;
    }

    if (this.totalScore > this.opponentScore) {
      App.game.printMessage("Game is over! You won with " + this.totalScore + " points!");
    } else if (this.totalScore < this.opponentScore) {
      App.game.printMessage("Game is over! Your opponent won with " + this.opponentScore + " points!");
    } else {
      App.game.printMessage("Game is over! It is a tie with " + this.totalScore + " points!");
    }
  }
}

function shuffle(arr) {
  // Durstenfeld shuffle algorithm to randomize letters.
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
