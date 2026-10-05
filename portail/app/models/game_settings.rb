# Niveau imposé par l'adulte pour chaque jeu (formulaire de la fiche d'un profil).
module GameSettings
  def self.apply(profile, params)
    game = Game.find(params[:slug])
    level = params[:level].to_s
    gs = profile.state_for(game.slug)
    settings = (gs.settings || {}).dup
    if %w[1 2 3].include?(level)
      settings["level"] = level.to_i
    else
      settings.delete("level")
    end
    gs.update!(settings:)
  end
end
