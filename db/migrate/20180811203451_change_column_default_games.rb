class ChangeColumnDefaultGames < ActiveRecord::Migration[5.1]
  def up
    change_column :games, :host_score, :int, default: 0
    change_column :games, :part_score, :int, default: 0
  end

  def down
  end
end
