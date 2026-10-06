# Changer son mot de passe en étant connecté (l'ancien est demandé) ;
# les autres appareils sont déconnectés.
class AccountPasswordsController < ApplicationController
  rate_limit to: 10, within: 3.minutes, only: :update

  def edit
  end

  def update
    user = Current.user
    unless user.authenticate(params[:current_password].to_s)
      return redirect_to mot_de_passe_path, alert: "Mot de passe actuel incorrect."
    end
    if user.update(params.permit(:password, :password_confirmation))
      user.sessions.where.not(id: Current.session.id).destroy_all
      redirect_to home_path_for(user), notice: "Mot de passe modifié. Vos autres appareils ont été déconnectés."
    else
      redirect_to mot_de_passe_path, alert: user.errors.full_messages.to_sentence
    end
  end
end
