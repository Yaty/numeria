# La course aux familles passe de 3 à 2 niveaux (le niveau 3 est fusionné dans le 2).
class FamillesDeuxNiveaux < ActiveRecord::Migration[8.1]
  def up
    execute "UPDATE assignments SET level = 2 WHERE game_slug = 'familles' AND level > 2"
    execute <<~SQL
      UPDATE game_states SET settings = json_set(settings, '$.level', 2)
      WHERE game_slug = 'familles' AND json_extract(settings, '$.level') > 2
    SQL
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
