class GameChannel < ApplicationCable::Channel
  def subscribed
    stream_from "player_#{uuid}"
    Match.create(uuid)
  end

  def unsubscribed
    Match.remove(uuid)
  end

  def make_move(data)
    Game.make_move(uuid, data)
  end

  def switch_turn(data)
    Game.switch_turn(uuid, data)
  end

  def remove_tile(data)
    Game.remove_tile(uuid, data)
  end

  def pass_letters(data)
    Game.pass_letters(uuid, data)
  end

  def validate_words(data)
    Game.validate_words(uuid, data)
  end

  def challenge(data)
    Game.challenge(uuid, data)
  end

  def return_back_letters(data)
    Game.return_back_letters(uuid, data)
  end

  def deliver_score(data)
    Game.deliver_score(uuid, data)
  end

  def yield
    Game.yield(uuid)
  end

  def finalize_game(data)
    Game.finalize_game(uuid, data)
  end
end
