window.onload = () ->
  App.game = App.cable.subscriptions.create { channel: "GameChannel", gameid: document.getElementById("messages").dataset["gameid"] },
    connected: ->
      # Called when the subscription has been initiated by the server

    disconnected: ->
      # Called when the subscription has been terminated by the server

    received: (data) ->
      switch data.action
        when "game_init"
          [playerId, rack, gameId, challengable] = data.msg.split(" ")

          App.gamePlay = new Game()
          App.gamePlay.init(playerId, gameId, rack.split(""), true, challengable == "true")
          @printMessage("Waiting for opponent...")

        when "game_start"
          [opponentId, rack, game_id, challengable, playerId] = data.msg.split(' ')

          if App.gamePlay && App.gamePlay.playerId == playerId && !App.gamePlay.opponentId
            App.gamePlay.setOpponent(opponentId)
            @printMessage("Game has started! You play first.")
          else if !App.gamePlay
            App.gamePlay = new Game()
            App.gamePlay.init(opponentId, game_id, rack.split(''), false, challengable == "true", playerId)
            @printMessage("Game has started! You play second.")

        when "make_move"
          [tile, letter, playerId] = data.msg.split(" ")

          if App.gamePlay.playerId == playerId
            App.gamePlay.placeTile(tile, letter)

        when "switch_turn"
          [rack, remaining, passes, rackEmpty, playerId] = data.msg.split(" ")

          if App.gamePlay.playerId == playerId
            App.gamePlay.switchTurn(rack, remaining, 0, rackEmpty)
          else
            App.gamePlay.switchTurn("", remaining, passes, rackEmpty)

        when "remove_tile"
          [tileId, playerId] = data.msg.split(" ")

          if App.gamePlay.playerId == playerId
            App.gamePlay.removeTile(tileId)

        when "pass_letters"
          [letters, playerId] = data.msg.split(" ")

          if App.gamePlay.playerId == playerId
            App.gamePlay.passLetters(letters)

        when "process_valid_words"
          [word, playerId] = data.msg.split(" ")

          if App.gamePlay.playerId == playerId
            App.gamePlay.processValidWords()

        when "process_invalid_words"
          [word, playerId] = data.msg.split(" ")

          if App.gamePlay.playerId == playerId
            App.gamePlay.processInvalidWords(word)

        when "challenge"
          [last, playerId] = data.msg.split(" ")

          if App.gamePlay.playerId == playerId
            App.gamePlay.challenge(last)

        when "deliver_score"
          [score, playerId, theEnd] = data.msg.split(" ")

          if App.gamePlay.playerId == playerId
            App.gamePlay.updateScore(score)

            if theEnd == "true"
              App.gamePlay.theEnd()

        when "yield"
          App.gamePlay.theEnd()

        when "finish_game"
          App.gamePlay.finishGame(data.msg);
          
    printMessage: (message) ->
      $("#messages").html("<p>#{message}</p>")

    make_move: (gameId, move) ->
      @perform 'make_move', data: { gameId, move }

    switch_turn: (gameId, amount, passes) ->
      @perform 'switch_turn', data: { gameId, amount, passes }

    remove_tile: (gameId, id) ->
      @perform 'remove_tile', data: { gameId, id }

    pass_letters: (gameId, letters) ->
      @perform 'pass_letters', data: { gameId, letters }

    validate_words: (gameId, word) ->
      @perform 'validate_words', data: { gameId, word }

    challenge: (gameId, last) ->
      @perform 'challenge', data: { gameId, last }

    return_back_letters: (gameId, letters) ->
      @perform 'return_back_letters', data: { gameId, letters }

    deliver_score: (gameId, score, theEnd) ->
      @perform 'deliver_score', data: { gameId, score, theEnd }

    yield: (gameId) ->
      @perform 'yield', data: gameId

    finalize_game: (gameId, passEnding) ->
      @perform 'finalize_game', data: { gameId, passEnding }

    register_scores: (gameId, score) ->
      @perform 'register_scores', data: { gameId, score }
