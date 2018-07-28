class WelcomeController < ApplicationController
  def index
    if params[:declined]
      flash[:warning] = "Your game invitation has been declined by #{User.find(params[:declined]).name}!"
    end
  end
end