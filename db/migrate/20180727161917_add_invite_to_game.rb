class AddInviteToGame < ActiveRecord::Migration[5.1]
  def change
    add_column :games, :invite, :integer
  end
end
