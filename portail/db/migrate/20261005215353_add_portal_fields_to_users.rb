class AddPortalFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    change_table :users do |t|
      t.string :name, null: false, default: ""
      t.string :role, null: false, default: "famille"
      # orthophonistes : en_attente → verifie | refuse ; suspendu en cas de partage détecté
      t.string :pro_status
      t.string :rpps
      t.string :suspended_reason
      t.datetime :suspended_at
      t.datetime :paid_until
      t.string :stripe_customer_id
      t.string :stripe_subscription_id
      t.string :subscription_status
    end
    add_index :users, :role
    add_index :users, :stripe_customer_id, unique: true
    add_index :users, :rpps, unique: true

    change_table :sessions do |t|
      t.datetime :last_seen_at
      t.datetime :sudo_at
    end

    create_table :login_events do |t|
      t.references :user, foreign_key: true
      t.string :kind, null: false
      t.string :ip_address
      t.string :user_agent
      t.string :email_attempted
      t.datetime :created_at, null: false
    end
    add_index :login_events, [ :user_id, :created_at ]

    create_table :profiles do |t|
      t.references :user, null: false, foreign_key: true
      t.references :therapist, foreign_key: { to_table: :users }
      t.string :name, null: false
      t.string :avatar, null: false, default: "🦊"
      t.integer :birth_year
      t.string :link_code
      t.datetime :link_code_expires_at
      t.datetime :linked_at
      t.timestamps
    end
    add_index :profiles, :link_code, unique: true

    create_table :game_states do |t|
      t.references :profile, null: false, foreign_key: true
      t.string :game_slug, null: false
      t.json :state
      t.json :settings, null: false, default: {}
      t.timestamps
    end
    add_index :game_states, [ :profile_id, :game_slug ], unique: true

    create_table :attempts do |t|
      t.references :profile, null: false, foreign_key: true
      t.references :played_by, foreign_key: { to_table: :users }
      t.string :game_slug, null: false
      t.string :level
      t.string :item
      t.boolean :correct, null: false
      t.integer :ms
      t.string :detail
      t.string :mode, null: false
      t.datetime :created_at, null: false
    end
    add_index :attempts, [ :profile_id, :game_slug, :created_at ]
  end
end
