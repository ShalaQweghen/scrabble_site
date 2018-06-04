class Match < ApplicationRecord
  def self.create(uuid)
    if opponent = REDIS.spop("matches")
      Game.start(uuid, opponent)
    else
      REDIS.sadd("matches", uuid)
    end
  end

  def self.remove(uuid)
    REDIS.srem("matches", uuid)
  end

  def self.clear_all
    REDIS.del("matches")
  end
end
