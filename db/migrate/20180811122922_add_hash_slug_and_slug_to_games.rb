class AddHashSlugAndSlugToGames < ActiveRecord::Migration[5.1]
  def change
    add_column :games, :hash_slug, :string
    add_column :games, :slug, :string

    add_index :games, :slug, unique: true
    add_index :games, :hash_slug
  end
end
