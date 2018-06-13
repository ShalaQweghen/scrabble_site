class GamesController < ApplicationController
  before_action :authenticate_user!

  def index
    @games = Game.all
  end

  def show
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
    
    redirect_to game_path(game)
  end

  private
    def game_params
      params.require(:game).permit(:host_id, :challengable, :time_limit, :points_limit)
    end
end
