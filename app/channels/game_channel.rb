class GameChannel < ApplicationCable::Channel
  def subscribed
    stream_from "game-#{params['gameid']}"

    @game_id = params['gameid']
    @game = Game.friendly.find(@game_id)

    if @game.participant
      Game.start(@game)
    else
      Game.init(@game)
    end
  end

  def unsubscribed
    @game = @game.reload

    if @game.participant_id.nil?
      @game.delete
    elsif @game.participant_id && @game.part_score.nil? && @game.host_score.nil?
      Game.forfeit(current_user, @game, { "data" => 0 })
    end
  end

  def make_move(data)
    Game.make_move(current_user, @game_id, data)
  end

  def switch_turn(data)
    Game.switch_turn(current_user, @game_id, data)
  end

  def remove_tile(data)
    Game.remove_tile(current_user, @game_id, data)
  end

  def pass_letters(data)
    Game.pass_letters(current_user, @game_id, data)
  end

  def validate_words(data)
    Game.validate_words(current_user, @game_id, data)
  end

  def challenge(data)
    Game.challenge(current_user, @game_id, data)
  end

  def return_back_letters(data)
    Game.return_back_letters(current_user, @game_id, data)
  end

  def deliver_score(data)
    Game.deliver_score(current_user, @game_id, data)
  end

  def finalize_game(data)
    Game.finalize_game(@game_id, data)
  end

  def register_scores(data)
    Game.register_scores(current_user, @game, data)
  end

  def forfeit(data)
    Game.forfeit(current_user, @game, data)
  end

  def transmit_chat(data)
    Game.transmit_chat(current_user, @game_id, data)
  end
end
