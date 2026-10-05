class Attempt < ApplicationRecord
  MODES = %w[seance maison].freeze
  belongs_to :profile
  belongs_to :played_by, class_name: "User", optional: true
  validates :game_slug, inclusion: { in: ->(_) { Game.slugs } }
  validates :mode, inclusion: { in: MODES }

  # Statistiques par jeu : nombre d'essais, réussite, dernier niveau, dernière date.
  def self.summary
    group(:game_slug).pluck(
      :game_slug,
      Arel.sql("COUNT(*)"),
      Arel.sql("SUM(CASE WHEN correct THEN 1 ELSE 0 END)"),
      Arel.sql("MAX(created_at)")
    ).map { |slug, n, ok, last| { slug:, total: n, correct: ok, rate: n.zero? ? 0 : (100.0 * ok / n).round, last_at: last } }
  end
end
