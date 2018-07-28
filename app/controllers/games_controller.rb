class GamesController < ApplicationController
  before_action :authenticate_user!

  def index
    @games = Game.all
  end

  def show
    @game = Game.find(params[:id])

    if !@game.available && @game.host_id == current_user.id
      redirect_to root_path
    elsif !@game.available && @game.participant_id != current_user.id
      redirect_to root_path
    else
      flash.now[:warning] = "Warning: Leaving this page before the game is over will result in a forfeit, which will deduct 50 points from your overall score!"
    end
  end

  def new
    @game = Game.new
  end

  def create
    @game = Game.new(game_params)
 
    if @game.save
      if !game_params[:invite].empty?
        InviteBroadcastJob.perform_later "invite", { user_id: game_params[:invite] }
      end

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

    if params[:declined]
      InviteBroadcastJob.perform_later "decline", { user_id: @game.host_id, game_id: @game.id, invite_id: @game.invite }

      redirect_to games_path
    else
      redirect_to root_path
    end

  end

  private
    def game_params
      params.require(:game).permit(:host_id, :challengable, :time_limit, :points_limit, :invite)
    end
end
