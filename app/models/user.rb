class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable

  has_many :hosted_games, class_name: "Game", foreign_key: "host_id"
  has_many :participated_games, class_name: "Game", foreign_key: "participant_id"

  def invited?
    !Game.where(invite: id, available: true).empty?
  end
end
