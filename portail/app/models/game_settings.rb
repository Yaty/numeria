# Niveau imposé par l'adulte pour chaque jeu (formulaire de la fiche d'un profil).
module GameSettings
  def self.apply(profile, params)
    game = Game.find(params[:slug])
    level = game.level_from(params[:level])
    gs = profile.state_for(game.slug)
    settings = (gs.settings || {}).dup
    if level
      settings["level"] = level
    else
      settings.delete("level")
    end
    gs.update!(settings:)
  end
end
