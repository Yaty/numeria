class User < ApplicationRecord
  ROLES = %w[famille pro admin].freeze
  # Voix neuronales proposées (src/ui/speech.ts : NEURAL_VOICES)
  VOICES = {
    "fr_FR-siwis-medium" => "Siwis — voix de femme (recommandée)",
    "fr_FR-tom-medium" => "Tom — voix d’homme",
    "fr_FR-upmc-medium" => "UPMC — voix de femme"
  }.freeze
  PRO_STATUSES = %w[en_attente verifie refuse suspendu].freeze

  has_secure_password
  has_many :sessions, dependent: :destroy
  has_many :login_events, dependent: :delete_all
  has_many :profiles, dependent: :destroy
  has_many :patients, class_name: "Profile", foreign_key: :therapist_id, dependent: :nullify, inverse_of: :therapist

  normalizes :email_address, with: ->(e) { e.strip.downcase }
  normalizes :rpps, with: ->(n) { n.gsub(/\D/, "") }

  validates :email_address, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 10 }, allow_nil: true
  validates :name, presence: true, length: { maximum: 80 }
  validates :role, inclusion: { in: ROLES }
  validates :voice, inclusion: { in: VOICES.keys }, allow_nil: true
  validates :pro_status, inclusion: { in: PRO_STATUSES }, if: :pro?
  validates :rpps, presence: true, uniqueness: true, format: { with: /\A\d{11}\z/, message: "doit comporter 11 chiffres" }, if: :pro?

  before_validation { self.pro_status ||= "en_attente" if pro? }

  scope :pros, -> { where(role: "pro") }

  def famille? = role == "famille"
  def pro? = role == "pro"
  def admin? = role == "admin"

  def verified_pro? = pro? && pro_status == "verifie"
  def suspended? = suspended_at.present?

  def subscribed?
    paid_until.present? && paid_until.future?
  end

  # Peut jouer : famille abonnée, orthophoniste vérifié, admin.
  def can_play?
    return false if suspended?
    admin? || verified_pro? || (famille? && subscribed?)
  end

  def max_sessions = Portail::MAX_SESSIONS.fetch(role, 2)

  # Clé de Luhn du numéro RPPS (aide à la vérification manuelle, pas bloquant).
  def rpps_checksum_ok?
    return false unless rpps.to_s.match?(/\A\d{11}\z/)
    sum = rpps.reverse.chars.each_with_index.sum do |c, i|
      d = c.to_i * (i.odd? ? 2 : 1)
      d > 9 ? d - 9 : d
    end
    (sum % 10).zero?
  end

  def suspend!(reason)
    transaction do
      update!(suspended_at: Time.current, suspended_reason: reason, pro_status: pro? ? "suspendu" : pro_status)
      sessions.destroy_all
      login_events.create!(kind: "suspendu", user_agent: reason.truncate(250))
    end
  end

  def reinstate!
    update!(suspended_at: nil, suspended_reason: nil, pro_status: pro? ? "verifie" : pro_status)
  end

  # Profils visibles : les siens, et (orthophoniste vérifié) ceux de ses patients liés.
  def visible_profiles
    return Profile.where(user_id: id) unless verified_pro?
    Profile.where(user_id: id).or(Profile.where(therapist_id: id))
  end
end
