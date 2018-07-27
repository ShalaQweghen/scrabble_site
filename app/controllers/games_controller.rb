class GamesController < ApplicationController
  before_action :authenticate_user!

  def index
    @games = Game.all
  end

  def show
    flash.now[:warning] = "Warning: Leaving this page before the game is over will result in a forfeit, which will deduct 50 points from your overall score!"

    @game = Game.find(params[:id])
  end

  def new
    @game = Game.new
  end

  def create
    @game = Game.new(game_params)
 
    if @game.save
      redirect_to game_path(@game)
    else
      render :new
    end
  end

  def update
    game = Game.find(params[:game][:game_id])
    game.update!(participant: current_user)
    game.toggle!(:available)

    redirect_to game_path(game, refresh: true)
  end

  def destroy
    @game = Game.find(params[:id]).destroy
    
    redirect_to root_path
  end

  private
    def game_params
      params.require(:game).permit(:host_id, :challengable, :time_limit, :points_limit, :invite)
    end
end
