# Jeux retirés du catalogue (rimes, son caché, homophones, intrus, contraires) et
# train des syllabes remplacé par le tambour des sons : leurs états et leurs
# exercices envoyés n'ont plus de jeu. L'historique des essais est gardé.
class RetirerJeuxSupprimes < ActiveRecord::Migration[8.1]
  SLUGS = %w[rimes son-cache homophones intrus contraires syllabes].freeze

  def up
    assignments = select_values("SELECT id FROM assignments WHERE game_slug IN (#{quoted})")
    if assignments.any?
      execute "UPDATE attempts SET assignment_id = NULL WHERE assignment_id IN (#{assignments.join(',')})"
      execute "DELETE FROM assignments WHERE id IN (#{assignments.join(',')})"
    end
    execute "DELETE FROM game_states WHERE game_slug IN (#{quoted})"
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end

  private

  def quoted = SLUGS.map { connection.quote(_1) }.join(",")
end
