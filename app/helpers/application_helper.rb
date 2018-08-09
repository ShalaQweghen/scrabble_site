module ApplicationHelper
  def render_leader_board
    users = User.order(score: :desc, name: :asc)

    content_tag(:ol) do
      content = ""

      users.each do |user|
        content += (content_tag(:li) do
          if user.online
            content_tag(:span, nil, class: "online mr-2", title: "Online")
          else
            content_tag(:span, nil, class: "offline mr-2", title: "Offline")
          end + 

          (link_to user.name, user_path(user.id)) + " -> #{user.score} points"
        end)
      end

      content.html_safe
    end
  end

  def bootstrap_class_for(flash_type)
    { success: "alert-success", error: "alert-danger", alert: "alert-warning", warning: "alert-warning", notice: "alert-info" }[flash_type] || flash_type.to_s
  end

  def render_flash_messages
    content = ""

    flash.each do |msg_type, message|
      content += content_tag(:div, class: "alert #{bootstrap_class_for(msg_type.to_sym)} fade-in text-center mb-3") do 
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
end
