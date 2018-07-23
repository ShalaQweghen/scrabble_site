module UsersHelper
  def render_game_info_table(game, user_id)
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