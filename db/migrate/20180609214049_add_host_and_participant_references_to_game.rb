class AddHostAndParticipantReferencesToGame < ActiveRecord::Migration[5.1]
  def change
    add_reference :games, :host
    add_reference :games, :participant

    add_foreign_key :games, :users, column: :host_id, primary_key: :id
    add_foreign_key :games, :users, column: :participant_id, primary_key: :id
  end
end
