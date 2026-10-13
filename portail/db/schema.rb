# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_13_120000) do
  create_table "assignments", force: :cascade do |t|
    t.integer "profile_id", null: false
    t.integer "created_by_id", null: false
    t.string "game_slug", null: false
    t.integer "level"
    t.string "message"
    t.string "token", null: false
    t.datetime "expires_at", null: false
    t.datetime "revoked_at"
    t.datetime "opened_at"
    t.datetime "last_played_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_assignments_on_created_by_id"
    t.index ["profile_id"], name: "index_assignments_on_profile_id"
    t.index ["token"], name: "index_assignments_on_token", unique: true
  end

  create_table "attempts", force: :cascade do |t|
    t.integer "profile_id", null: false
    t.integer "played_by_id"
    t.string "game_slug", null: false
    t.string "level"
    t.string "item"
    t.boolean "correct", null: false
    t.integer "ms"
    t.string "detail"
    t.string "mode", null: false
    t.datetime "created_at", null: false
    t.integer "assignment_id"
    t.index ["assignment_id"], name: "index_attempts_on_assignment_id"
    t.index ["played_by_id"], name: "index_attempts_on_played_by_id"
    t.index ["profile_id", "game_slug", "created_at"], name: "index_attempts_on_profile_id_and_game_slug_and_created_at"
    t.index ["profile_id"], name: "index_attempts_on_profile_id"
  end

  create_table "game_states", force: :cascade do |t|
    t.integer "profile_id", null: false
    t.string "game_slug", null: false
    t.json "state"
    t.json "settings", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["profile_id", "game_slug"], name: "index_game_states_on_profile_id_and_game_slug", unique: true
    t.index ["profile_id"], name: "index_game_states_on_profile_id"
  end

  create_table "login_events", force: :cascade do |t|
    t.integer "user_id"
    t.string "kind", null: false
    t.string "ip_address"
    t.string "user_agent"
    t.string "email_attempted"
    t.datetime "created_at", null: false
    t.index ["user_id", "created_at"], name: "index_login_events_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_login_events_on_user_id"
  end

  create_table "profiles", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "therapist_id"
    t.string "name", null: false
    t.string "avatar", default: "🦊", null: false
    t.integer "birth_year"
    t.string "link_code"
    t.datetime "link_code_expires_at"
    t.datetime "linked_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["link_code"], name: "index_profiles_on_link_code", unique: true
    t.index ["therapist_id"], name: "index_profiles_on_therapist_id"
    t.index ["user_id"], name: "index_profiles_on_user_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "last_seen_at"
    t.datetime "sudo_at"
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email_address", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "name", default: "", null: false
    t.string "role", default: "famille", null: false
    t.string "pro_status"
    t.string "rpps"
    t.string "suspended_reason"
    t.datetime "suspended_at"
    t.datetime "paid_until"
    t.string "stripe_customer_id"
    t.string "stripe_subscription_id"
    t.string "subscription_status"
    t.string "voice"
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
    t.index ["role"], name: "index_users_on_role"
    t.index ["rpps"], name: "index_users_on_rpps", unique: true
    t.index ["stripe_customer_id"], name: "index_users_on_stripe_customer_id", unique: true
  end

  add_foreign_key "assignments", "profiles"
  add_foreign_key "assignments", "users", column: "created_by_id"
  add_foreign_key "attempts", "assignments", on_delete: :nullify
  add_foreign_key "attempts", "profiles"
  add_foreign_key "attempts", "users", column: "played_by_id"
  add_foreign_key "game_states", "profiles"
  add_foreign_key "login_events", "users"
  add_foreign_key "profiles", "users"
  add_foreign_key "profiles", "users", column: "therapist_id"
  add_foreign_key "sessions", "users"
end
