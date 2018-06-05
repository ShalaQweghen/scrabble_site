class Game < ApplicationRecord
  def self.start(player1, player2)
    bag = Bag.create_bag
    game_id = SecureRandom.uuid
    first, second = [player1, player2]

    REDIS.set("opponent_for:#{first}", second)
    REDIS.set("opponent_for:#{second}", first)

    rack1, bag = Bag.complete_rack(7, bag)
    rack2, bag = Bag.complete_rack(7, bag)

    REDIS.set("game_bag_#{game_id}", bag)

    ActionCable.server.broadcast "player_#{first}", {action: "game_start", msg: "first player_#{second} " + rack1 + " " + game_id}
    ActionCable.server.broadcast "player_#{second}", {action: "game_start", msg: "second player_#{first} " + rack2 + " " + game_id}
  end

  def self.make_move(uuid, move)
    opponent = opponent_for(uuid)

    ActionCable.server.broadcast "player_#{opponent}", {action: "make_move", msg: move['data']}
  end

  def self.switch_turn(uuid, params)
    opponent = opponent_for(uuid)
    bag = REDIS.get("game_bag_#{params["data"]["gameId"]}")

    rack, bag = Bag.complete_rack(params["data"]["amount"], bag)

    REDIS.set("game_bag_#{params["data"]["gameId"]}", bag)

    ActionCable.server.broadcast "player_#{uuid}", {action: "switch_turn", msg: rack}
    ActionCable.server.broadcast "player_#{opponent}", {action: "switch_turn", msg: ""}
  end

  def self.remove_tile(uuid, id)
    opponent = opponent_for(uuid)
    ActionCable.server.broadcast "player_#{opponent}", {action: "remove_tile", msg: id['data']}
  end

  def self.pass_letters(uuid, params)
    bag = REDIS.get("game_bag_#{params["data"]["gameId"]}")
    bag = Bag.put_back(bag, params["data"]["letters"])

    rack, bag = Bag.complete_rack(params["data"]["letters"].length, bag)

    REDIS.set("game_bag_#{params["data"]["gameId"]}", bag)

    ActionCable.server.broadcast "player_#{uuid}", {action: "pass_letters", msg: rack}
  end

  def self.validate_words(uuid, words_data)
    is_validated = true

    words_data["data"].split(" ").each do |word| 
      if is_validated && !DICT.include?(word)
        ActionCable.server.broadcast "player_#{uuid}", {action: "process_invalid_words", msg: word}
        is_validated = false
      end
    end

    if is_validated
      ActionCable.server.broadcast "player_#{uuid}", {action: "process_valid_words", msg: ""}
    end
  end

  def self.challenge(uuid)
    opponent = opponent_for(uuid)
    ActionCable.server.broadcast "player_#{opponent}", {action: "challenge", msg: nil}
  end

  def self.return_back_letters(uuid, letters_data)
    bag = REDIS.get("game_bag_#{letters_data["data"]["gameId"]}")
    bag = Bag.put_back(bag, letters_data["data"]["letters"])
    REDIS.set("game_bag_#{letters_data["data"]["gameId"]}", bag)
  end

  def self.opponent_for(uuid)
    REDIS.get("opponent_for:#{uuid}")
  end
end