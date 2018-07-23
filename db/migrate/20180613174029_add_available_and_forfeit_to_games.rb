class AddAvailableAndForfeitToGames < ActiveRecord::Migration[5.1]
  def change
    add_column :games, :available, :boolean, default: true
    add_column :games, :forfeited, :boolean, default: false
    add_column :games, :forfeited_by, :bigint
  end
end
