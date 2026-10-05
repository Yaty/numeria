class ApplicationController < ActionController::Base
  include Authentication
  allow_browser versions: :modern
  stale_when_importmap_changes

  after_action :private_headers, if: -> { Current.user.present? }

  private
    # Pages personnelles : jamais indexées ni gardées en cache.
    def private_headers
      response.headers["X-Robots-Tag"] = "noindex, nofollow"
      response.headers["Cache-Control"] = "no-store"
    end

    def require_role(*roles)
      head :not_found unless roles.include?(Current.user.role)
    end

    def require_famille = require_role("famille")
    def require_admin = require_role("admin")

    def require_verified_pro
      return head(:not_found) unless Current.user.pro?
      redirect_to pro_pending_path unless Current.user.verified_pro?
    end

    # Accès aux jeux : abonnement (famille), vérification (orthophoniste).
    def require_player
      return if Current.user.can_play?
      if Current.user.pro?
        redirect_to pro_pending_path
      else
        redirect_to abonnement_path, alert: "Un abonnement est nécessaire pour jouer."
      end
    end

    def home_path_for(user)
      case user.role
      when "admin" then admin_root_path
      when "pro" then user.verified_pro? ? pro_root_path : pro_pending_path
      else user.subscribed? ? jouer_path : abonnement_path
      end
    end
    helper_method :home_path_for
end
