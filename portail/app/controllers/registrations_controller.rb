class RegistrationsController < ApplicationController
  allow_unauthenticated_access
  rate_limit to: 5, within: 1.hour, only: :create, with: -> { redirect_to root_path, alert: "Trop d’inscriptions depuis cette adresse. Réessayez plus tard." }

  def new
    @user = User.new(role: params[:pro] ? "pro" : "famille")
  end

  def create
    @user = User.new(params.expect(user: [ :name, :email_address, :password, :password_confirmation, :rpps, :role ]))
    @user.role = "famille" unless %w[famille pro].include?(@user.role)
    unless params[:accept_terms] == "1"
      @user.errors.add(:base, "Merci d’accepter les conditions d’utilisation.")
      return render :new, status: :unprocessable_entity
    end
    if @user.save
      start_new_session_for(@user)
      redirect_to home_path_for(@user), notice: @user.pro? ? "Compte créé. Nous vérifions votre numéro professionnel." : "Compte créé !"
    else
      render :new, status: :unprocessable_entity
    end
  end
end
