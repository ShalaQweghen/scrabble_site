class UsersController < ApplicationController
  before_action :authenticate_user!

  def index
    render json: User.where(online: true)
  end

  def show
    @user = User.find(params[:id])
  end
end

