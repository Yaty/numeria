class Pro::PatientsController < Pro::BaseController
  before_action :set_patient, only: %i[ show update destroy link_code game_settings ]
  before_action :require_sudo, only: %i[ destroy ]

  def index
    @patients = Current.user.visible_profiles.order(:name)
    @patient = Profile.new(avatar: Profile::AVATARS.sample)
  end

  def create
    @patient = Current.user.profiles.new(params.expect(profile: [ :name, :avatar, :birth_year ]).merge(therapist: Current.user))
    if @patient.save
      redirect_to pro_patient_path(@patient), notice: "Patient créé."
    else
      @patients = Current.user.visible_profiles.order(:name)
      render :index, status: :unprocessable_entity
    end
  end

  def show
    @summary = @patient.attempts.summary
    @recent = @patient.attempts.order(created_at: :desc).limit(50)
    @by_level = @patient.attempts.group(:game_slug, :level, :mode)
                        .pluck(:game_slug, :level, :mode, Arel.sql("COUNT(*)"), Arel.sql("SUM(CASE WHEN correct THEN 1 ELSE 0 END)"))
  end

  def update
    if @patient.owned_by_therapist? && @patient.update(params.expect(profile: [ :name, :avatar, :birth_year ]))
      redirect_to pro_patient_path(@patient), notice: "Patient modifié."
    else
      redirect_to pro_patient_path(@patient), alert: "Modification impossible (seule la famille peut modifier un profil relié)."
    end
  end

  # Patient créé ici : supprimé. Profil d'une famille : on retire seulement la liaison.
  def destroy
    if @patient.owned_by_therapist?
      @patient.destroy!
      redirect_to pro_root_path, notice: "Patient supprimé.", status: :see_other
    else
      @patient.unlink!
      redirect_to pro_root_path, notice: "Liaison retirée : vous n’avez plus accès à ce profil.", status: :see_other
    end
  end

  def link_code
    return redirect_to pro_patient_path(@patient), alert: "Ce profil est déjà relié à une famille." unless @patient.owned_by_therapist?
    @patient.generate_link_code!
    redirect_to pro_patient_path(@patient), notice: "Code de liaison créé : à donner à la famille."
  end

  def game_settings
    GameSettings.apply(@patient, params)
    redirect_to pro_patient_path(@patient), notice: "Réglages enregistrés."
  end

  private
    def set_patient
      @patient = Current.user.visible_profiles.find(params[:id])
    end
end
