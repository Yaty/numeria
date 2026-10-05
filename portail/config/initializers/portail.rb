# Réglages du portail (surchargeables par variables d'environnement).
module Portail
  NAME = ENV.fetch("PORTAIL_NOM", "Ludortho")
  # Abonnement famille : 6 €/an
  PRICE_CENTS = ENV.fetch("PRIX_CENTIMES", 600).to_i
  STRIPE_PRICE_ID = ENV["STRIPE_PRICE_ID"] # sinon prix créé à la volée (price_data)
  MAX_PROFILES = 4

  # Garde-fous des comptes
  MAX_SESSIONS = { "famille" => 3, "pro" => 2, "admin" => 2 }.freeze
  PRO_SESSION_TTL = 12.hours
  SUDO_TTL = 15.minutes
  # Détection de partage d'un compte orthophoniste (sur 24 h glissantes)
  SHARING_MAX_IPS = ENV.fetch("PARTAGE_MAX_IP", 4).to_i
  SHARING_MAX_LOGINS = ENV.fetch("PARTAGE_MAX_CONNEXIONS", 12).to_i
  LINK_CODE_TTL = 7.days

  def self.stripe_configured?
    Stripe.api_key.present?
  end
end

Stripe.api_key = ENV["STRIPE_SECRET_KEY"] || Rails.application.credentials.dig(:stripe, :secret_key)
