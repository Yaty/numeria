class LoginEvent < ApplicationRecord
  KINDS = %w[connexion echec deconnexion evince expire suspendu].freeze
  belongs_to :user, optional: true
  validates :kind, inclusion: { in: KINDS }

  scope :recent, -> { where(created_at: 24.hours.ago..) }
end
