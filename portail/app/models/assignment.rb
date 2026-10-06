# Exercice envoyé par l'orthophoniste : un lien vers UN jeu, à un niveau donné,
# jouable sans compte jusqu'à son expiration (ou sa révocation).
class Assignment < ApplicationRecord
  VALIDITY_DAYS = [ 7, 14, 30 ].freeze

  belongs_to :profile
  belongs_to :created_by, class_name: "User"
  has_many :attempts, dependent: :nullify

  has_secure_token :token, length: 32

  validates :game_slug, inclusion: { in: ->(_) { Game.slugs } }
  validates :level, inclusion: { in: [ 1, 2, 3 ] }, allow_nil: true
  validates :message, length: { maximum: 280 }
  validates :expires_at, presence: true

  scope :active, -> { where(revoked_at: nil).where("expires_at > ?", Time.current) }

  def game = Game.find(game_slug)

  # Utilisable : non révoqué, non expiré, orthophoniste toujours vérifié et
  # toujours en charge de ce patient.
  def usable?
    revoked_at.nil? && expires_at.future? && created_by.verified_pro? && !created_by.suspended? &&
      profile.therapist_id == created_by_id
  end

  def revoke! = update!(revoked_at: Time.current)

  def summary
    n = attempts.count
    ok = attempts.where(correct: true).count
    { total: n, rate: n.zero? ? nil : (100.0 * ok / n).round }
  end
end
