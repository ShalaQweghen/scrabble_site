class RemoveHashSlugsFromGames < ActiveRecord::Migration[5.1]
  def change
    remove_column :games, :hash_slug, :string
  end
end
