# Lien d'exercice ouvert par l'enfant, sans compte : un seul jeu, un niveau.
class AssignmentsController < ApplicationController
  allow_unauthenticated_access
  skip_after_action :private_headers
  after_action :link_headers
  before_action :set_assignment
  rate_limit to: 60, within: 1.minute, only: %i[ state attempts ]

  def show
    @assignment.update_column(:opened_at, Time.current) if @assignment.opened_at.nil?
  end

  def play
    @game = @assignment.game
    @profile = @assignment.profile
    gs = @profile.state_for(@game.slug)
    settings = gs.settings || {}
    settings = settings.merge("level" => @assignment.level) if @assignment.level
    @back_url = exercice_path(@assignment.token)
    @config = {
      slug: @game.slug,
      profile: { id: @profile.id, name: @profile.name, avatar: @profile.avatar, age: @profile.age },
      mode: "maison", adult: false, state: gs.state, settings:,
      apiBase: "/e/#{@assignment.token}", exitUrl: @back_url
    }
    render "play/game", layout: "jeu"
  end

  def state
    payload = params.require(:state).to_unsafe_h
    return head :content_too_large if payload.to_json.bytesize > Api::GamesController::MAX_STATE_BYTES
    @assignment.profile.state_for(@assignment.game_slug).update!(state: payload)
    head :no_content
  end

  def attempts
    rows = Array(params[:attempts]).first(Api::GamesController::MAX_BATCH).map do |a|
      a = a.permit(:level, :item, :correct, :ms, :detail)
      { profile_id: @assignment.profile_id, assignment_id: @assignment.id, game_slug: @assignment.game_slug, mode: "maison",
        level: a[:level].to_s.truncate(20), item: a[:item].to_s.truncate(120),
        correct: ActiveModel::Type::Boolean.new.cast(a[:correct]) || false,
        ms: a[:ms].presence&.to_i, detail: a[:detail].to_s.truncate(200).presence, created_at: Time.current }
    end
    if rows.any?
      Attempt.insert_all(rows)
      @assignment.update_column(:last_played_at, Time.current)
    end
    head :no_content
  end

  private
    def set_assignment
      @assignment = Assignment.find_by(token: params[:token].to_s)
      return if @assignment&.usable?
      respond_to do |format|
        format.html { render :expired, status: :gone }
        format.json { head :gone }
      end
    end

    # Le lien contient un jeton : jamais indexé, jamais transmis en Referer.
    def link_headers
      response.headers["X-Robots-Tag"] = "noindex, nofollow"
      response.headers["Cache-Control"] = "no-store"
      response.headers["Referrer-Policy"] = "no-referrer"
    end
end
