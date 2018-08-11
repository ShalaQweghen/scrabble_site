class UsersController < ApplicationController
  before_action :authenticate_user!

  def index
    render json: User.where(online: true).select { |user| user.id != current_user.id }
  end

  def show
    @user = User.friendly.find(params[:id])
  end
end

