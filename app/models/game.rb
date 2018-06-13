class Game < ApplicationRecord
  belongs_to :host, class_name: "User"
  belongs_to :participant, class_name: "User", optional: true
  
  def self.init(game)
    bag = Bag.create_bag

    rack, bag = Bag.complete_rack(7, bag)

    REDIS.set("game_bag_#{game.id}", bag)

    ActionCable.server.broadcast "game-#{game.id}", { action: "game_init", msg: "#{game.host.id} #{rack} #{game.id} #{game.challengable}" }
  end

  def self.start(game)
    bag = REDIS.get("game_bag_#{game.id}")
    rack, bag = Bag.complete_rack(7, bag)

    REDIS.set("opponent_for:#{game.host.id}", game.participant.id)
    REDIS.set("opponent_for:#{game.participant.id}", game.host.id)
    REDIS.set("game_bag_#{game.id}", bag)

    ActionCable.server.broadcast "game-#{game.id}", { action: "game_start", msg: "#{game.participant.id} #{rack} #{game.id} #{game.challengable} #{game.host.id}" }
  end

  def self.make_move(user, move)
    opponent = opponent_for(user)

    ActionCable.server.broadcast "game-#{move['data']['gameId']}", { action: "make_move", msg: "#{move['data']['move']} #{opponent}" }
  end

  def self.switch_turn(user, params)
    opponent = opponent_for(user)
    game_id = params['data']['gameId']

    bag = REDIS.get("game_bag_#{game_id}")

    rack, bag = Bag.complete_rack(params["data"]["amount"], bag)

    REDIS.set("game_bag_#{game_id}", bag)

    ActionCable.server.broadcast "game-#{game_id}", { action: "switch_turn", msg: "#{rack} #{bag.length} #{params["data"]["passes"]} #{rack.empty?} #{user}" }
  end

  def self.remove_tile(user, id)
    opponent = opponent_for(user)
    ActionCable.server.broadcast "game-#{id['data']['gameId']}", { action: "remove_tile", msg: "#{id['data']['id']} #{opponent}" }
  end

  def self.pass_letters(user, params)
    bag = REDIS.get("game_bag_#{params["data"]["gameId"]}")
    bag = Bag.put_back(bag, params["data"]["letters"])

    rack, bag = Bag.complete_rack(params["data"]["letters"].length, bag)

    REDIS.set("game_bag_#{params["data"]["gameId"]}", bag)

    ActionCable.server.broadcast "game-#{params["data"]["gameId"]}", { action: "pass_letters", msg: "#{rack} #{user}" }
  end

  def self.validate_words(user, words_data)
    is_validated = true

    words_data["data"]["word"].split(" ").each do |word| 
      if is_validated && !DICT.include?(word)
        ActionCable.server.broadcast "game-#{words_data["data"]["gameId"]}", { action: "process_invalid_words", msg: "#{word} #{user}" }
        is_validated = false
      end
    end

    if is_validated
      ActionCable.server.broadcast "game-#{words_data["data"]["gameId"]}", { action: "process_valid_words", msg: ". #{user}" }
    end
  end

  def self.challenge(user, data)
    opponent = opponent_for(user)
    ActionCable.server.broadcast "game-#{data["data"]["gameId"]}", { action: "challenge", msg: "#{data["data"]["last"]} #{opponent}" }
  end

  def self.return_back_letters(user, letters_data)
    bag = REDIS.get("game_bag_#{letters_data["data"]["gameId"]}")
    bag = Bag.put_back(bag, letters_data["data"]["letters"])
    REDIS.set("game_bag_#{letters_data["data"]["gameId"]}", bag)
  end

  def self.deliver_score(user, score_data)
    opponent = opponent_for(user)

    ActionCable.server.broadcast "game-#{score_data["data"]["gameId"]}", { action: "deliver_score", msg: "#{score_data["data"]["score"]} #{opponent} #{score_data["data"]["theEnd"]}" }
  end

  def self.yield(data)
    ActionCable.server.broadcast "game-#{data["data"]}", { action: "yield", msg: nil }
  end

  def self.finalize_game(ending_data)
    ActionCable.server.broadcast "game-#{ending_data["data"]["gameId"]}", { action: "finish_game", msg: ending_data["data"]["passEnding"] }
  end

  def self.opponent_for(user)
    REDIS.get("opponent_for:#{user}")
  end

  def self.register_scores(user, data)
    game = Game.find(data["data"]["gameId"])

    if game.host.id == user
      game.update!(host_score: data["data"]["score"])
    else
      game.update!(part_score: data["data"]["score"])
    end
  end
end