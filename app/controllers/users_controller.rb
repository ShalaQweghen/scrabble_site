class UsersController < ApplicationController
  before_action :authenticate_user!, :clear_warning

  def index
    @users = User.all
  end

  def show
    @user = User.find(params[:id])
  end
end

