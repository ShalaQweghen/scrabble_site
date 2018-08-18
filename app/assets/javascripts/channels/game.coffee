window.onload = () ->
  App.game = App.cable.subscriptions.create { channel: "GameChannel", gameid: document.getElementById("messages-area").dataset["gameid"] },
    connected: ->
      # Called when the subscription has been initiated by the server

    disconnected: ->
      # Called when the subscription has been ended by the server

    received: (data) ->
      switch data.action
        when "game_init"
          [playerId, playerName, rack, challengable, timeLimit, pointsLimit] = data.msg.split(" ")

          App.gamePlay = Game()
          App.gamePlay.init(playerId, rack.split(""), true, challengable == "true", timeLimit, pointsLimit)
          @printMessage("Waiting for opponent...")

        when "game_start"
          [opponentId, opponentName, rack, challengable, timeLimit, pointsLimit, playerId, playerName] = data.msg.split(' ')

          if App.gamePlay && App.gamePlay.getPlayerId() == playerId && !App.gamePlay.getOpponentId()
            App.gamePlay.setOpponent(opponentId, opponentName)
            @printMessage("Game has started! You play first.")
          else if !App.gamePlay
            App.gamePlay = Game()
            App.gamePlay.init(opponentId, rack.split(''), false, challengable == "true", timeLimit, pointsLimit, playerId, playerName)
            @printMessage("Game has started! You play second.")

        when "make_move"
          [tile, letter, playerId] = data.msg.split(" ")

          if App.gamePlay.getPlayerId() == playerId
            App.gamePlay.placeTile(tile, letter)

        when "switch_turn"
          [rack, remaining, passes, rackEmpty, playerId] = data.msg.split(" ")

          if App.gamePlay.getPlayerId() == playerId
            App.gamePlay.switchTurn(rack, remaining, 0, rackEmpty)
          else
            App.gamePlay.switchTurn("", remaining, passes, rackEmpty)

        when "remove_tile"
          [tileId, playerId] = data.msg.split(" ")

          if App.gamePlay.getPlayerId() == playerId
            App.gamePlay.removeTile(tileId)

        when "pass_letters"
          [letters, playerId] = data.msg.split(" ")

          if App.gamePlay.getPlayerId() == playerId
            App.gamePlay.passLetters(letters)

        when "process_valid_words"
          [word, playerId] = data.msg.split(" ")

          if App.gamePlay.getPlayerId() == playerId
            App.gamePlay.processValidWords()

        when "process_invalid_words"
          [word, playerId] = data.msg.split(" ")

          if App.gamePlay.getPlayerId() == playerId
            App.gamePlay.processInvalidWords(word)

          if App.gamePlay.getPlayerId() != playerId
            @printMessage("Your turn...")

        when "challenge"
          [last, playerId] = data.msg.split(" ")

          if App.gamePlay.getPlayerId() == playerId
            App.gamePlay.challenge(last == "true")

        when "deliver_score"
          [score, playerId, theEnd] = data.msg.split(" ")

          if App.gamePlay.getPlayerId() == playerId
            App.gamePlay.updateScore(score)

          if theEnd == "true"
            App.gamePlay.theEnd()

        when "finish_game"
          [passEnding, pointsLimit, timeLimit] = data.msg.split(" ")

          App.gamePlay.finishGame(passEnding == "true", pointsLimit == "true", timeLimit == "true");

        when "forfeit"
          if App.gamePlay.getPlayerId() == data.msg
            App.gamePlay.cancelGame()

        when "transmit_chat"
          [playerId, message] = data.msg.split(" ")

          if App.gamePlay.getPlayerId() == playerId
            App.gamePlay.writeToChat(message)
          
    printMessage: (message) ->
      document.getElementById("message").textContent = message

    make_move: (move) ->
      @perform 'make_move', data: move

    switch_turn: (amount, passes) ->
      @perform 'switch_turn', data: { amount, passes }

    remove_tile: (id) ->
      @perform 'remove_tile', data: id

    pass_letters: (letters) ->
      @perform 'pass_letters', data: letters

    validate_words: (words) ->
      @perform 'validate_words', data: words

    challenge: (lastMove) ->
      @perform 'challenge', data: lastMove

    return_back_letters: (letters) ->
      @perform 'return_back_letters', data: letters

    deliver_score: (score, theEnd) ->
      @perform 'deliver_score', data: { score, theEnd }

    finalize_game: (passEnding, pointsLimit, timeLimit) ->
      @perform 'finalize_game', data: { passEnding, pointsLimit, timeLimit }

    register_scores: (score, winner) ->
      @perform 'register_scores', data: { score, winner }

    forfeit: (score) ->
      @perform 'forfeit', data: score

    transmitChat: (message) ->
      @perform 'transmit_chat', data: message
