module UsersHelper
  def get_ranking(user)
    User.order(:name, score: :desc).index { |u| u.id == user.id } + 1
  end

  def set_outcome(game, user_id, p1_score, p2_score)
    if game.forfeited
      outcome =  game.forfeited_by == user_id ? "lost" : "won"
    else
      if p1_score > p2_score
        outcome = "won"
      elsif p1_score < p2_score
        outcome = "lost"
      else
        outcome = "tied"
      end
    end

    return outcome
  end
  
  def render_game_info_table(game, user_id)
    if game.host_id == user_id
      kind = "hosted"
      outcome = set_outcome(game, user_id, game.host_score, game.part_score)
    else
      kind = "participated"
      outcome = set_outcome(game, user_id, game.part_score, game.host_score)
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
          content_tag(:td, game.points_limit > 0 ? game.points_limit : "None")
        end
      end
    end
  end
end
