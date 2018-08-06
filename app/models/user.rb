class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable, :confirmable

  has_many :hosted_games, class_name: "Game", foreign_key: "host_id"
  has_many :participated_games, class_name: "Game", foreign_key: "participant_id"

  def invited?
    !Game.where(invitee: id, available: true).empty?
  end
end
