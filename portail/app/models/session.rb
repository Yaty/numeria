class Session < ApplicationRecord
  belongs_to :user

  def expired?
    user.pro? && created_at < Portail::PRO_SESSION_TTL.ago
  end

  def sudo?
    sudo_at.present? && sudo_at > Portail::SUDO_TTL.ago
  end

  def device_label
    ua = user_agent.to_s
    browser = ua[/(Firefox|Edg|Chrome|Safari)/, 1]&.sub("Edg", "Edge") || "Navigateur"
    os = ua[/(Windows|Android|iPhone|iPad|Mac OS X|Linux)/, 1]&.sub("Mac OS X", "Mac") || "appareil inconnu"
    "#{browser} sur #{os}"
  end
end
