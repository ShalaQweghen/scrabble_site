class AddAvailableToGames < ActiveRecord::Migration[5.1]
  def change
    add_column :games, :available, :boolean
  end
end
