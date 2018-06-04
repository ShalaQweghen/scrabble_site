App.game = App.cable.subscriptions.create "GameChannel",
  connected: ->
    @printMessage("Waiting for opponent...")

  disconnected: ->
    # Called when the subscription has been terminated by the server

  received: (data) ->
    switch data.action
      when "game_start"
        [toGo, opponent, bag, game_id] = data.msg.split(' ')
        App.gamePlay = new Game()
        App.gamePlay.init(game_id, bag.split(''), opponent, toGo == "first")
        @printMessage("Game has started! You play #{toGo}")
      when "make_move"
        [tile, letter] = data.msg.split(" ")
        App.gamePlay.placeTile(tile, letter)
      when "switch_turn"
        App.gamePlay.switchTurn(data.msg)
      when "remove_tile"
        App.gamePlay.removeTile(data.msg)
      when "pass_letters"
        App.gamePlay.passLetters(data.msg)
      when "process_valid_words"
        App.gamePlay.processValidWords()
      when "process_invalid_words"
        App.gamePlay.processInvalidWords(data.msg)
        
  printMessage: (message) ->
    $("#messages").append("<p>#{message}</p>")

  make_move: (move) ->
    @perform 'make_move', data: move

  switch_turn: (gameId, amount) ->
    @perform 'switch_turn', data: { gameId, amount }

  remove_tile: (id) ->
    @perform 'remove_tile', data: id

  pass_letters: (gameId, letters) ->
    @perform 'pass_letters', data: { gameId, letters }

  validate_words: (word) ->
    @perform 'validate_words', data: word