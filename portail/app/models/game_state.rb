class GameState < ApplicationRecord
  belongs_to :profile
  validates :game_slug, inclusion: { in: ->(_) { Game.slugs } }
end
