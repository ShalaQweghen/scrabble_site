# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  before_action :toggle_online, only: [:destroy]

  # GET /resource/sign_in
  # def new
  #   super
  # end

  # POST /resource/sign_in
  def create
    super do |resource|
      current_user.toggle!(:online)
      
      cookies.signed[:user_id] = current_user.id
    end
  end

  # DELETE /resource/sign_out
  # def destroy
  #   super
  # end

  protected

  # If you have extra params to permit, append them to the sanitizer.
  # def configure_sign_in_params
  #   devise_parameter_sanitizer.permit(:sign_in, keys: [:attribute])
  # end

  def toggle_online
    current_user.toggle!(:online)
  end
end
