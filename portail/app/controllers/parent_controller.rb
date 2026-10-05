# Espace parent (mot de passe ressaisi) : profils, liaison orthophoniste, résultats.
class ParentController < ApplicationController
  before_action :require_famille
  before_action :require_sudo
  before_action :set_profile, only: %i[ show update destroy link unlink game_settings ]

  def index
    @profiles = Current.user.profiles.order(:name)
    @profile = Profile.new(avatar: Profile::AVATARS.sample)
  end

  def create
    @profile = Current.user.profiles.new(profile_params)
    if @profile.save
      redirect_to parent_path, notice: "Profil de #{@profile.name} créé."
    else
      @profiles = Current.user.profiles.order(:name)
      render :index, status: :unprocessable_entity
    end
  end

  def show
    @summary = @profile.attempts.summary
    @recent = @profile.attempts.order(created_at: :desc).limit(30)
  end

  def update
    if @profile.update(profile_params)
      redirect_to parent_profile_path(@profile), notice: "Profil modifié."
    else
      redirect_to parent_profile_path(@profile), alert: @profile.errors.full_messages.to_sentence
    end
  end

  def destroy
    @profile.destroy!
    redirect_to parent_path, notice: "Profil supprimé.", status: :see_other
  end

  def link
    if Profile.link!(@profile, params[:code])
      redirect_to parent_profile_path(@profile), notice: "#{@profile.name} est maintenant relié(e) à son orthophoniste."
    else
      redirect_to parent_profile_path(@profile), alert: "Code invalide ou expiré. Demandez un nouveau code à l’orthophoniste."
    end
  end

  def unlink
    @profile.unlink!
    redirect_to parent_profile_path(@profile), notice: "Liaison supprimée : l’orthophoniste n’a plus accès à ce profil.", status: :see_other
  end

  def game_settings
    GameSettings.apply(@profile, params)
    redirect_to parent_profile_path(@profile), notice: "Réglages enregistrés."
  end

  private
    def set_profile
      @profile = Current.user.profiles.find(params[:id])
    end

    def profile_params
      params.expect(profile: [ :name, :avatar, :birth_year ])
    end
end
