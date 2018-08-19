class RemoveColumnDefaultGames < ActiveRecord::Migration[5.1]
  def up
    change_column :games, :host_score, :int, default: nil
    change_column :games, :part_score, :int, default: nil
  end

  def down
    change_column :games, :host_score, :int, default: 0
    change_column :games, :part_score, :int, default: 0
  end
end
