# Exercices envoyés à un patient (lien à transmettre à la famille).
class Pro::AssignmentsController < Pro::BaseController
  before_action :set_patient

  def create
    days = params[:days].to_i
    days = 14 unless Assignment::VALIDITY_DAYS.include?(days)
    level = params[:level].to_s
    assignment = @patient.assignments.new(
      created_by: Current.user, game_slug: params[:slug].to_s, message: params[:message].to_s.strip.presence,
      level: %w[1 2 3].include?(level) && params[:slug] != "numeria" ? level.to_i : nil,
      expires_at: days.days.from_now
    )
    if assignment.save
      redirect_to pro_patient_path(@patient, anchor: "exercices"), notice: "Lien créé : copiez-le ou envoyez-le à la famille."
    else
      redirect_to pro_patient_path(@patient, anchor: "exercices"), alert: assignment.errors.full_messages.to_sentence
    end
  end

  def destroy
    @patient.assignments.find(params[:id]).revoke!
    redirect_to pro_patient_path(@patient, anchor: "exercices"), notice: "Lien désactivé.", status: :see_other
  end

  private
    def set_patient
      @patient = Current.user.visible_profiles.find(params[:patient_id])
      head :not_found unless @patient.therapist_id == Current.user.id
    end
end
