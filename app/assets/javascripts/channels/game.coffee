App.game = App.cable.subscriptions.create { channel: "GameChannel", gameid: window.location.href.split(/[=&]/)[1], joining: window.location.href.split(/[=&]/)[3] },
  connected: ->
    # Called when the subscription has been initiated by the server

  disconnected: ->
    # Called when the subscription has been terminated by the server

  received: (data) ->
    switch data.action
      when "game_init"
        [rack, gameId, challengable] = data.msg.split(" ")
        App.gamePlay = new Game()
        App.gamePlay.init(gameId, rack.split(""), true, challengable == "true")
        @printMessage("Waiting for opponent...")
      when "game_start"
        if App.gamePlay
          App.gamePlay.setOpponent(data.msg)
          @printMessage("Game has started! You play first.")
        else
          [opponent, rack, game_id, challengable] = data.msg.split(' ')
          App.gamePlay = new Game()
          App.gamePlay.init(game_id, rack.split(''), false, challengable == "true", opponent)
          @printMessage("Game has started! You play second.")
      when "make_move"
        [tile, letter] = data.msg.split(" ")
        App.gamePlay.placeTile(tile, letter)
      when "switch_turn"
        params = data.msg.split(" ")

        if params.length == 4
          App.gamePlay.switchTurn(params[0], params[1], params[2], params[3])
        else
          App.gamePlay.switchTurn("", params[0], params[1], params[2])
      when "remove_tile"
        App.gamePlay.removeTile(data.msg)
      when "pass_letters"
        App.gamePlay.passLetters(data.msg)
      when "process_valid_words"
        App.gamePlay.processValidWords()
      when "process_invalid_words"
        App.gamePlay.processInvalidWords(data.msg)
      when "challenge"
        App.gamePlay.challenge(data.msg)
      when "deliver_score"
        App.gamePlay.updateScore(data.msg)
      when "yield"
        App.gamePlay.theEnd()
      when "finish_game"
        App.gamePlay.finishGame(data.msg);
        
  printMessage: (message) ->
    $("#messages").html("<p>#{message}</p>")

  make_move: (move) ->
    @perform 'make_move', data: move

  switch_turn: (gameId, amount, passes) ->
    @perform 'switch_turn', data: { gameId, amount, passes }

  remove_tile: (id) ->
    @perform 'remove_tile', data: id

  pass_letters: (gameId, letters) ->
    @perform 'pass_letters', data: { gameId, letters }

  validate_words: (word) ->
    @perform 'validate_words', data: word

  challenge: (last) ->
    @perform 'challenge', data: last

  return_back_letters: (gameId, letters) ->
    @perform 'return_back_letters', data: { gameId, letters }

  deliver_score: (score) ->
    @perform 'deliver_score', data: score

  yield: ->
    @perform 'yield'

  finalize_game: (passEnding) ->
    @perform 'finalize_game', data: passEnding