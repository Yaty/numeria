# Côté enfant : choisir son profil, choisir un jeu, jouer.
class PlayController < ApplicationController
  before_action :require_player
  before_action :set_profile, except: :index

  def index
    @profiles = Current.user.visible_profiles.order(:name)
    redirect_to(Current.user.pro? ? pro_root_path : parent_path, notice: "Créez d’abord un profil.") if @profiles.empty?
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
      exitUrl: catalogue_path(@profile)
    }
    render layout: "jeu"
  end

  private
    def set_profile
      @profile = Current.user.visible_profiles.find(params[:profile_id])
    end
end
