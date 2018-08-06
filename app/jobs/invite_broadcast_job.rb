class InviteBroadcastJob < ApplicationJob
  queue_as :default

  def perform(activity, params)
    if activity == "invite"
      ActionCable.server.broadcast "activity_channel_#{params[:user_id]}", { action: "show_invite" }
    elsif activity == "decline"
      ActionCable.server.broadcast "activity_channel_#{params[:user_id]}", { action: "show_decline", msg: "#{params[:game_id]} #{params[:invitee_id]}" }
    end
  end
end
