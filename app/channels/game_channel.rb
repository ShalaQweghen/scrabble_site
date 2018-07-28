class GameChannel < ApplicationCable::Channel
  attr_accessor :game, :game_id

  def subscribed
    stream_from "game-#{params['gameid']}"

    self.game_id = params['gameid']
    self.game = Game.find(self.game_id)

    if self.game.participant
      Game.start(self.game)
    else
      Game.init(self.game)
    end
  end

  def unsubscribed
    if self.game.participant_id.nil?
      self.game.delete
    elsif self.game.participant_id && self.game.part_score.nil? && self.game.host_score.nil?
      Game.forfeit(current_user, self.game, { "score" => 0 })
    end

    if self.game.available
      self.game.toggle!(:available)
    end
  end

  def make_move(data)
    Game.make_move(current_user, self.game_id, data)
  end

  def switch_turn(data)
    Game.switch_turn(current_user, self.game_id, data)
  end

  def remove_tile(data)
    Game.remove_tile(current_user, self.game_id, data)
  end

  def pass_letters(data)
    Game.pass_letters(current_user, self.game_id, data)
  end

  def validate_words(data)
    Game.validate_words(current_user, self.game_id, data)
  end

  def challenge(data)
    Game.challenge(current_user, self.game_id, data)
  end

  def return_back_letters(data)
    Game.return_back_letters(current_user, self.game_id, data)
  end

  def deliver_score(data)
    Game.deliver_score(current_user, self.game_id, data)
  end

  def finalize_game(data)
    Game.finalize_game(self.game_id, data)
  end

  def register_scores(data)
    Game.register_scores(current_user, self.game, data)
  end

  def forfeit(data)
    Game.forfeit(current_user, self.game, data)
  end
end
