# Repère un compte orthophoniste probablement partagé : trop d'adresses IP
# distinctes ou trop de connexions sur 24 h glissantes.
class SharingDetector
  def initialize(user)
    @user = user
  end

  def sharing?
    distinct_ips > Portail::SHARING_MAX_IPS || logins > Portail::SHARING_MAX_LOGINS
  end

  def distinct_ips = recent_logins.distinct.count(:ip_address)

  def logins = recent_logins.count

  private
    def recent_logins = @user.login_events.recent.where(kind: "connexion")
end
