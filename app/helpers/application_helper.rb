module ApplicationHelper
  def bootstrap_class_for(flash_type)
    { success: "alert-success", error: "alert-danger", alert: "alert-warning", notice: "alert-info" }[flash_type] || flash_type.to_s
  end

  def render_flash_messages
    content = ""

    flash.each do |msg_type, message|
      content += content_tag(:div, class: "alert #{bootstrap_class_for(msg_type.to_sym)} fade-in center") do 
        (message + content_tag(:button, 'x', class: "close small-text", data: { dismiss: 'alert' })).html_safe
      end
    end

    content.html_safe
  end

  def login_helper
    if current_user
      (content_tag(:li, class: "nav-item") do
        link_to "Create", new_game_path, class: "nav-link"
      end) + 
      (content_tag(:li, class: "nav-item") do
        link_to "Join", games_path, class: "nav-link"
      end) +
      (content_tag(:li, class: "nav-item") do
        link_to "Account", user_path(current_user), class: "nav-link"
      end) + 
      (content_tag(:li, class: "nav-item") do
        link_to "Logout", destroy_user_session_path, method: :delete, class: "nav-link"
      end)
    else
      (content_tag(:li, class: "nav-item") do
        link_to "Register", new_user_registration_path, class: "nav-link"
      end) + 
      (content_tag(:li, class: "nav-item") do
        link_to "Login", new_user_session_path, class: "nav-link"
      end)
    end
  end

  def game_table(game, user_id)
    if game.host_id == user_id
      kind = "hosted"
      outcome = game.host_score > game.part_score ? "won" : "lost"
    else
      kind = "participated"
      outcome = game.part_score > game.host_score ? "won" : "lost"
    end

    content_tag(:div, class: "played-game #{kind} #{outcome}") do
      content_tag(:table, class: "table table-sm table-bordered") do
        content_tag(:tr) do
          content_tag(:th, "Score", scope: "row") +
          content_tag(:td, kind == "hosted" ? game.host_score : game.part_score)
        end + 
        content_tag(:tr) do
          content_tag(:th, "Opponent", scope: "row") +
          content_tag(:td) do
            link_to kind == "hosted" ? game.participant.name : game.host.name, user_path(kind == "hosted" ? game.participant_id : game.host_id)
          end
        end +
        content_tag(:tr) do
          content_tag(:th, "Opponent Score", scope: "row") +
          content_tag(:td, kind == "hosted" ? game.part_score : game.host_score)
        end + 
        content_tag(:tr) do
          content_tag(:th, "Challenge Mode", scope: "row") +
          content_tag(:td, game.challengable ? "ON" : "OFF")
        end +
        content_tag(:tr) do
          content_tag(:th, "Time Limit", scope: "row") +
          content_tag(:td, game.time_limit > 0 ? "#{game.time_limit / 60}m #{game.time_limit % 60}s" : "None")
        end +
        content_tag(:tr) do
          content_tag(:th, "Points Limit", scope: "row") +
          content_tag(:td, game.points_limit)
        end
      end
    end
  end
end
