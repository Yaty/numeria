class SessionsController < ApplicationController
  allow_unauthenticated_access only: %i[ new create ]
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_to new_session_path, alert: "Trop d’essais. Réessayez dans quelques minutes." }

  def new
    redirect_to home_path_for(Current.user) if authenticated?
  end

  def create
    user = User.authenticate_by(params.permit(:email_address, :password))
    unless user
      LoginEvent.create!(user: User.find_by(email_address: params[:email_address].to_s.strip.downcase), kind: "echec",
                         email_attempted: params[:email_address].to_s.truncate(120), ip_address: request.remote_ip, user_agent: request.user_agent)
      return redirect_to new_session_path, alert: "Adresse e-mail ou mot de passe incorrect."
    end
    if user.suspended?
      return redirect_to new_session_path, alert: "Ce compte est suspendu. Écrivez-nous pour le réactiver."
    end
    if start_new_session_for(user)
      redirect_to session.delete(:return_to_after_authenticating) || home_path_for(user)
    else
      redirect_to new_session_path, alert: "Ce compte vient d’être suspendu : il semble utilisé par plusieurs personnes. Écrivez-nous pour le réactiver."
    end
  end

  def destroy
    terminate_session
    redirect_to root_path, status: :see_other, notice: "À bientôt !"
  end
end
