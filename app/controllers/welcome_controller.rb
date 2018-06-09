class WelcomeController < ApplicationController
  def index
    @games = Game.all
  end

  def new_game
    host = SecureRandom.uuid

    @game = Game.new(challengable: !params[:challenge].nil?)
 
    if @game.save
      redirect_to game_path(gameid: @game.id)
    else
      render :index
    end
  end

  def join_game
    redirect_to game_path(gameid: params[:game_id], join: "1")
  end

  def game
  end
end