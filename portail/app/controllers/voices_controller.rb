# Choix de la voix de lecture du compte : utilisée sur tous les appareils du
# compte et, pour un orthophoniste, dans les exercices envoyés.
class VoicesController < ApplicationController
  before_action :require_sudo, if: -> { Current.user.famille? }
  layout -> { Current.user.pro? ? "pro" : "application" }

  def edit
    @voice = Current.user.voice || User::VOICES.keys.first
  end

  def update
    if Current.user.update(voice: params[:voice].to_s)
      respond_to do |format|
        format.json { head :no_content }
        format.html { redirect_to voix_path, notice: "Voix enregistrée." }
      end
    else
      head :unprocessable_entity
    end
  end
end
