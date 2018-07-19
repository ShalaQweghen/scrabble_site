class GameChannel < ApplicationCable::Channel
  def subscribed
    stream_from "game-#{params['gameid']}"

    game = Game.find(params['gameid'])

    if game.participant
      Game.start(game)
    else
      Game.init(game)
    end
  end

  def make_move(data)
    Game.make_move(current_user, data)
  end

  def switch_turn(data)
    Game.switch_turn(current_user, data)
  end

  def remove_tile(data)
    Game.remove_tile(current_user, data)
  end

  def pass_letters(data)
    Game.pass_letters(current_user, data)
  end

  def validate_words(data)
    Game.validate_words(current_user, data)
  end

  def challenge(data)
    Game.challenge(current_user, data)
  end

  def return_back_letters(data)
    Game.return_back_letters(current_user, data)
  end

  def deliver_score(data)
    Game.deliver_score(current_user, data)
  end

  def finalize_game(data)
    Game.finalize_game(data)
  end

  def register_scores(data)
    Game.register_scores(current_user, data)
  end
end
