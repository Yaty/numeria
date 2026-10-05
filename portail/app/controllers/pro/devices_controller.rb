# Appareils connectés et journal des connexions de l'orthophoniste.
class Pro::DevicesController < Pro::BaseController
  def index
    @sessions = Current.user.sessions.order(created_at: :desc)
    @events = Current.user.login_events.order(created_at: :desc).limit(30)
  end

  def destroy
    Current.user.sessions.where.not(id: Current.session.id).find(params[:id]).destroy
    redirect_to pro_devices_path, notice: "Appareil déconnecté.", status: :see_other
  end
end
