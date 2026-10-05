# Re-saisie du mot de passe avant les actions sensibles (espace parent, suppression…).
class SudosController < ApplicationController
  rate_limit to: 10, within: 3.minutes, only: :create

  def new
  end

  def create
    if Current.user.authenticate(params[:password].to_s)
      Current.session.update!(sudo_at: Time.current)
      redirect_to session.delete(:return_to_after_sudo) || home_path_for(Current.user)
    else
      redirect_to new_sudo_path, alert: "Mot de passe incorrect."
    end
  end
end
