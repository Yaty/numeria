require "test_helper"

class GamesApiTest < ActionDispatch::IntegrationTest
  test "les essais d'une famille sont enregistrés « maison »" do
    sign_in_as users(:famille)
    post api_game_attempts_path(profile_id: profiles(:lea).id, slug: "tambour"),
         params: { attempts: [ { level: 1, item: "a", correct: true, ms: 1200 }, { level: 1, item: "b", correct: false, detail: "chat" } ] }, as: :json
    assert_response :no_content
    attempts = profiles(:lea).attempts.order(:id)
    assert_equal [ true, false ], attempts.map(&:correct)
    assert_equal %w[maison maison], attempts.map(&:mode)
    assert_equal "chat", attempts.last.detail
  end

  test "en séance, les essais sont marqués « seance »" do
    profiles(:lea).update!(therapist: users(:pro))
    sign_in_as users(:pro)
    post api_game_attempts_path(profile_id: profiles(:lea).id, slug: "tambour"), params: { attempts: [ { correct: true } ] }, as: :json
    assert_equal "seance", profiles(:lea).attempts.last.mode
  end

  test "l'état du jeu est sauvegardé" do
    sign_in_as users(:famille)
    post api_game_state_path(profile_id: profiles(:lea).id, slug: "tambour"), params: { state: { level: 2, recent: [ "x" ] } }, as: :json
    assert_response :no_content
    assert_equal 2, profiles(:lea).game_states.find_by(game_slug: "tambour").state["level"]
  end

  test "un jeu inconnu est refusé" do
    sign_in_as users(:famille)
    post api_game_state_path(profile_id: profiles(:lea).id, slug: "inconnu"), params: { state: {} }, as: :json
    assert_response :not_found
  end

  test "un enfant (sans mot de passe récent) ne change pas les réglages" do
    log_in(users(:famille))
    travel 20.minutes do
      post api_game_settings_path(profile_id: profiles(:lea).id, slug: "tambour"), params: { settings: { level: 3 } }, as: :json
      assert_response :forbidden
    end
  end

  test "sans connexion, l'API répond 401" do
    post api_game_state_path(profile_id: profiles(:lea).id, slug: "tambour"), params: { state: {} }, as: :json
    assert_response :unauthorized
  end
end
