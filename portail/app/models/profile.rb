class Profile < ApplicationRecord
  AVATARS = %w[🦊 🐻 🐼 🐸 🦁 🐯 🐨 🐰 🐙 🦄 🐢 🐧 🦖 🐝 🐳 🦉].freeze

  belongs_to :user
  belongs_to :therapist, class_name: "User", optional: true
  has_many :game_states, dependent: :destroy
  has_many :attempts, dependent: :delete_all

  validates :name, presence: true, length: { maximum: 40 }
  validates :avatar, inclusion: { in: AVATARS }
  validates :birth_year, numericality: { only_integer: true, in: 2000..2030 }, allow_nil: true
  validate :family_profile_limit, on: :create

  def age
    birth_year && (Date.current.year - birth_year)
  end

  # Profil d'un patient créé par l'orthophoniste (sans compte famille).
  def owned_by_therapist? = therapist_id.present? && therapist_id == user_id

  def linked_to_therapist? = therapist_id.present? && !owned_by_therapist?

  # Code que l'orthophoniste donne à la famille pour relier ce profil.
  def generate_link_code!
    loop do
      code = Array.new(8) { "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".chars.sample(random: SecureRandom) }.join
      next if Profile.exists?(link_code: code)
      update!(link_code: code, link_code_expires_at: Portail::LINK_CODE_TTL.from_now)
      return code
    end
  end

  # Relie un profil famille au profil-patient de l'orthophoniste : la famille garde son
  # profil, l'orthophoniste y est associé, et l'historique fait en séance est rattaché.
  def self.link!(family_profile, code)
    code = code.to_s.upcase.gsub(/[^A-Z0-9]/, "")
    patient = find_by(link_code: code)
    return nil if patient.nil? || patient.link_code_expires_at.nil? || patient.link_code_expires_at.past?
    therapist = patient.therapist
    return nil unless therapist&.verified_pro?
    transaction do
      family_profile.update!(therapist: therapist, linked_at: Time.current)
      patient.attempts.update_all(profile_id: family_profile.id)
      patient.game_states.each do |gs|
        existing = family_profile.game_states.find_by(game_slug: gs.game_slug)
        if existing
          existing.update!(settings: gs.settings.merge(existing.settings))
          gs.destroy!
        else
          gs.update!(profile: family_profile)
        end
      end
      patient.reload.destroy!
    end
    family_profile
  end

  def unlink!
    update!(therapist: nil, linked_at: nil)
  end

  def state_for(slug)
    game_states.find_or_initialize_by(game_slug: slug)
  end

  private
    def family_profile_limit
      return unless user&.famille?
      errors.add(:base, "#{Portail::MAX_PROFILES} profils au maximum par famille") if user.profiles.count >= Portail::MAX_PROFILES
    end
end
