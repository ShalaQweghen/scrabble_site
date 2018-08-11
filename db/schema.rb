# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20180811122922) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "friendly_id_slugs", id: :serial, force: :cascade do |t|
    t.string "slug", null: false
    t.integer "sluggable_id", null: false
    t.string "sluggable_type", limit: 50
    t.string "scope"
    t.datetime "created_at"
    t.index ["slug", "sluggable_type", "scope"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type_and_scope", unique: true
    t.index ["slug", "sluggable_type"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type"
    t.index ["sluggable_id"], name: "index_friendly_id_slugs_on_sluggable_id"
    t.index ["sluggable_type"], name: "index_friendly_id_slugs_on_sluggable_type"
  end

  create_table "games", force: :cascade do |t|
    t.boolean "challengable"
    t.integer "time_limit"
    t.integer "points_limit"
    t.integer "host_score"
    t.integer "part_score"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "host_id"
    t.bigint "participant_id"
    t.boolean "available", default: true
    t.boolean "forfeited", default: false
    t.bigint "forfeited_by"
    t.bigint "invitee"
    t.string "hash_slug"
    t.string "slug"
    t.index ["hash_slug"], name: "index_games_on_hash_slug"
    t.index ["host_id"], name: "index_games_on_host_id"
    t.index ["participant_id"], name: "index_games_on_participant_id"
    t.index ["slug"], name: "index_games_on_slug", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.integer "score", default: 0
    t.string "name", null: false
    t.boolean "online", default: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.inet "current_sign_in_ip"
    t.inet "last_sign_in_ip"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "wins", default: 0
    t.integer "losses", default: 0
    t.integer "ties", default: 0
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["name"], name: "index_users_on_name", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "games", "users", column: "host_id"
  add_foreign_key "games", "users", column: "participant_id"
end
