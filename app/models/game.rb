class Game < ApplicationRecord
  belongs_to :host, class_name: "User"
  belongs_to :participant, class_name: "User", optional: true
  
  def self.init(game)
    bag = Bag.create_bag

    rack, bag = Bag.complete_rack(7, bag)

    REDIS.set("game_bag_#{game.id}", bag)

    ActionCable.server.broadcast "game-#{game.id}", { action: "game_init", msg: "#{game.host.id} #{rack} #{game.challengable} #{game.time_limit} #{game.points_limit}" }
  end

  def self.start(game)
    if game.available
      game.toggle!(:available)
    end

    bag = REDIS.get("game_bag_#{game.id}")
    rack, bag = Bag.complete_rack(7, bag)

    REDIS.set("opponent_for:#{game.host.id}", game.participant.id)
    REDIS.set("opponent_for:#{game.participant.id}", game.host.id)
    REDIS.set("game_bag_#{game.id}", bag)

    ActionCable.server.broadcast "game-#{game.id}", { action: "game_start", msg: "#{game.participant.id} #{rack} #{game.challengable} #{game.time_limit} #{game.points_limit} #{game.host.id}" }
  end

  def self.make_move(user, game_id, move)
    opponent = opponent_for(user)

    ActionCable.server.broadcast "game-#{game_id}", { action: "make_move", msg: "#{move['data']} #{opponent}" }
  end

  def self.switch_turn(user, game_id, params)
    bag = REDIS.get("game_bag_#{game_id}")

    rack, bag = Bag.complete_rack(params["data"]["amount"], bag)

    REDIS.set("game_bag_#{game_id}", bag)

    ActionCable.server.broadcast "game-#{game_id}", { action: "switch_turn", msg: "#{rack} #{bag.length} #{params["data"]["passes"]} #{rack.empty?} #{user}" }
  end

  def self.remove_tile(user, game_id, id)
    opponent = opponent_for(user)

    ActionCable.server.broadcast "game-#{game_id}", { action: "remove_tile", msg: "#{id['data']} #{opponent}" }
  end

  def self.pass_letters(user, game_id, letters)
    bag = REDIS.get("game_bag_#{game_id}")
    bag = Bag.put_back(bag, letters["data"])

    rack, bag = Bag.complete_rack(letters["data"].length, bag)

    REDIS.set("game_bag_#{game_id}", bag)

    ActionCable.server.broadcast "game-#{game_id}", { action: "pass_letters", msg: "#{rack} #{user}" }
  end

  def self.validate_words(user, game_id, words)
    is_validated = true

    words["data"].split(" ").each do |word| 
      if is_validated && !DICT.include?(word)
        ActionCable.server.broadcast "game-#{game_id}", { action: "process_invalid_words", msg: "#{word} #{user}" }
        is_validated = false
      end
    end

    if is_validated
      ActionCable.server.broadcast "game-#{game_id}", { action: "process_valid_words", msg: ". #{user}" }
    end
  end

  def self.challenge(user, game_id, last_move)
    opponent = opponent_for(user)

    ActionCable.server.broadcast "game-#{game_id}", { action: "challenge", msg: "#{last_move["data"]} #{opponent}" }
  end

  def self.return_back_letters(user, game_id, letters)
    bag = REDIS.get("game_bag_#{game_id}")
    bag = Bag.put_back(bag, letters["data"])

    REDIS.set("game_bag_#{game_id}", bag)
  end

  def self.deliver_score(user, game_id, score_data)
    opponent = opponent_for(user)

    ActionCable.server.broadcast "game-#{game_id}", { action: "deliver_score", msg: "#{score_data["data"]["score"]} #{opponent} #{score_data["data"]["theEnd"]}" }
  end

  def self.finalize_game(game_id, ending_data)
    ActionCable.server.broadcast "game-#{game_id}", { action: "finish_game", msg: "#{ending_data["data"]["passEnding"]} #{ending_data["data"]["pointsLimit"]} #{ending_data["data"]["timeLimit"]}" }
  end

  def self.register_scores(user, game, data)
    if game.host_score.nil? || game.part_score.nil?
      if game.host.id == user
        game.update!(host_score: data["data"]["score"])
        game.host.update!(score: game.host.score + data["data"]["score"])

        if data["data"]["winner"]
          game.host.increment!(:wins)
        elsif data["data"]["winner"].nil?
          game.host.increment!(:ties)
        else
          game.host.increment!(:losses)
        end
      else
        game.update!(part_score: data["data"]["score"])
        game.participant.update!(score: game.participant.score + data["data"]["score"])

        if data["data"]["winner"]
          game.participant.increment!(:wins)
        elsif data["data"]["winner"].nil?
          game.participant.increment!(:ties)
        else
          game.participant.increment!(:losses)
        end
      end
    end
  end

  def self.forfeit(user, game, score)
    opponent = opponent_for(user)

    game.toggle!(:forfeited)
    game.update!(forfeited_by: user)

    if game.host.id == user
      game.update!(host_score: score["data"])
      game.host.update!(score: game.host.score - 50)
      game.host.increment!(:losses)
    else
      game.update!(part_score: score["data"])
      game.participant.update!(score: game.participant.score - 50)
      game.participant.increment!(:losses)
    end

     ActionCable.server.broadcast "game-#{game.id}", { action: "forfeit", msg: "#{opponent}" }
  end

  def self.opponent_for(user)
    REDIS.get("opponent_for:#{user}")
  end
end