# Sauvegarde des jeux (JSON) : état, réglages, essais.
class Api::GamesController < ApplicationController
  before_action :require_player
  before_action :set_state

  MAX_STATE_BYTES = 512.kilobytes
  MAX_BATCH = 50

  def state
    payload = params.require(:state).to_unsafe_h
    return head :content_too_large if payload.to_json.bytesize > MAX_STATE_BYTES
    @game_state.update!(state: payload)
    head :no_content
  end

  def settings
    adult = Current.user.pro? || Current.user.admin? || Current.session.sudo?
    return head :forbidden unless adult
    @game_state.update!(settings: params.require(:settings).to_unsafe_h)
    head :no_content
  end

  def attempts
    mode = Current.user.pro? ? "seance" : "maison"
    rows = Array(params[:attempts]).first(MAX_BATCH).map do |a|
      a = a.permit(:level, :item, :correct, :ms, :detail)
      { profile_id: @profile.id, played_by_id: Current.user.id, game_slug: @game.slug, mode:,
        level: a[:level].to_s.truncate(20), item: a[:item].to_s.truncate(120),
        correct: ActiveModel::Type::Boolean.new.cast(a[:correct]) || false,
        ms: a[:ms].presence&.to_i, detail: a[:detail].to_s.truncate(200).presence, created_at: Time.current }
    end
    Attempt.insert_all(rows) if rows.any?
    head :no_content
  end

  private
    def set_state
      @profile = Current.user.visible_profiles.find(params[:profile_id])
      @game = Game.find(params[:slug])
      @game_state = @profile.state_for(@game.slug)
    end
end
