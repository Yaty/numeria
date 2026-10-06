class CreateAssignments < ActiveRecord::Migration[8.1]
  def change
    create_table :assignments do |t|
      t.references :profile, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :game_slug, null: false
      t.integer :level
      t.string :message
      t.string :token, null: false
      t.datetime :expires_at, null: false
      t.datetime :revoked_at
      t.datetime :opened_at
      t.datetime :last_played_at
      t.timestamps
    end
    add_index :assignments, :token, unique: true
    add_reference :attempts, :assignment, foreign_key: { on_delete: :nullify }
  end
end
