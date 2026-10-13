require "test_helper"

class GameTest < ActiveSupport::TestCase
  test "chaque fiche du catalogue a son jeu dans src/games, et inversement" do
    code = Dir[Rails.root.join("../src/games/*.ts")].map { |f| File.basename(f, ".ts") }
    assert_equal code.sort, Game.slugs.sort
  end

  test "chaque jeu appartient à un domaine connu et a de 2 à 5 niveaux" do
    categories = Game.categories.map(&:slug)
    Game.all.each do |g|
      assert_includes categories, g.category, g.slug
      assert_includes 2..5, g.levels.size, g.slug
      assert g.objectives.any?, g.slug
    end
  end
end
