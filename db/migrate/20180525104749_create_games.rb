class CreateGames < ActiveRecord::Migration[5.1]
  def change
    create_table :games do |t|
      t.boolean :challengable
      t.integer :time_limit
      t.integer :points_limit
      t.integer :host_score
      t.integer :part_score
      
      t.timestamps
    end
  end
end
