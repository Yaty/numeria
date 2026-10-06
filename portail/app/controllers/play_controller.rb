# Côté enfant : choisir son profil, choisir un jeu, jouer.
class PlayController < ApplicationController
  before_action :require_player
  before_action :set_profile, except: :index

  def index
    @profiles = Current.user.visible_profiles.order(:name)
    return unless @profiles.empty?
    case Current.user.role
    when "pro" then redirect_to pro_root_path, notice: "Créez d’abord un patient."
    when "famille" then redirect_to parent_path, notice: "Créez d’abord un profil."
    else redirect_to admin_root_path
    end
  end

  def catalogue
    @categories = Game.by_category
  end

  def game
    @game = Game.find(params[:slug])
    gs = @profile.state_for(@game.slug)
    @config = {
      slug: @game.slug,
      profile: { id: @profile.id, name: @profile.name, avatar: @profile.avatar, age: @profile.age },
      mode: Current.user.pro? ? "seance" : "maison",
      adult: Current.user.pro? || Current.user.admin? || Current.session.sudo?,
      state: gs.state,
      settings: gs.settings || {},
      apiBase: "/api/profils/#{@profile.id}/jeux/#{@game.slug}",
      exitUrl: catalogue_path(@profile),
      voice: Current.user.voice
    }
    render layout: "jeu"
  end

  private
    def set_profile
      @profile = Current.user.visible_profiles.find(params[:profile_id])
    end
end
