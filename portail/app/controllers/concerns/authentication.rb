module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :require_authentication
    helper_method :authenticated?, :current_user
  end

  class_methods do
    def allow_unauthenticated_access(**options)
      skip_before_action :require_authentication, **options
    end
  end

  private
    def authenticated?
      resume_session
    end

    def current_user = Current.user

    def require_authentication
      resume_session || request_authentication
    end

    def resume_session
      Current.session ||= find_session_by_cookie
    end

    def find_session_by_cookie
      return unless (id = cookies.signed[:session_id])
      session_record = Session.find_by(id: id)
      return unless session_record
      if session_record.expired? || session_record.user.suspended?
        LoginEvent.create!(user: session_record.user, kind: "expire", ip_address: request.remote_ip, user_agent: request.user_agent)
        session_record.destroy
        cookies.delete(:session_id)
        return
      end
      session_record.update_column(:last_seen_at, Time.current) if session_record.last_seen_at.nil? || session_record.last_seen_at < 5.minutes.ago
      session_record
    end

    def request_authentication
      session[:return_to_after_authenticating] = request.url if request.get?
      respond_to do |format|
        format.html { redirect_to new_session_path }
        format.json { head :unauthorized }
      end
    end

    def after_authentication_url
      session.delete(:return_to_after_authenticating) || root_url
    end

    # Ouvre une session et applique les garde-fous :
    # nombre d'appareils limité (la plus ancienne session est fermée) et
    # détection de partage pour les comptes orthophonistes.
    def start_new_session_for(user)
      user.login_events.create!(kind: "connexion", ip_address: request.remote_ip, user_agent: request.user_agent)
      if user.pro? && SharingDetector.new(user).sharing?
        user.suspend!("Partage suspecté : connexions depuis trop d’adresses ou trop fréquentes en 24 h")
        return nil
      end
      new_session = user.sessions.create!(user_agent: request.user_agent, ip_address: request.remote_ip, last_seen_at: Time.current, sudo_at: Time.current)
      user.sessions.where.not(id: new_session.id).order(created_at: :desc).offset(user.max_sessions - 1).each do |old|
        user.login_events.create!(kind: "evince", ip_address: old.ip_address, user_agent: old.user_agent)
        old.destroy
      end
      Current.session = new_session
      cookie = { value: new_session.id, httponly: true, same_site: :lax, secure: Rails.env.production? }
      if user.pro?
        cookies.signed[:session_id] = cookie.merge(expires: Portail::PRO_SESSION_TTL.from_now)
      else
        cookies.signed.permanent[:session_id] = cookie
      end
      new_session
    end

    def terminate_session
      Current.user&.login_events&.create!(kind: "deconnexion", ip_address: request.remote_ip, user_agent: request.user_agent)
      Current.session&.destroy
      cookies.delete(:session_id)
    end

    # Actions sensibles : mot de passe ressaisi depuis moins de 15 min.
    def require_sudo
      return if Current.session.sudo?
      session[:return_to_after_sudo] = request.url if request.get?
      redirect_to new_sudo_path
    end
end
