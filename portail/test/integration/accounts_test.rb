require "test_helper"

class AccountsTest < ActionDispatch::IntegrationTest
  test "inscription famille puis page d'abonnement" do
    post inscription_path, params: { accept_terms: "1", user: { role: "famille", name: "Sam", email_address: "sam@example.com", password: "motdepasse-sam", password_confirmation: "motdepasse-sam" } }
    assert_redirected_to abonnement_path
    assert_equal "famille", User.find_by(email_address: "sam@example.com").role
  end

  test "on ne peut pas s'inscrire administrateur" do
    post inscription_path, params: { accept_terms: "1", user: { role: "admin", name: "Malin", email_address: "malin@example.com", password: "motdepasse-malin", password_confirmation: "motdepasse-malin" } }
    assert_equal "famille", User.find_by(email_address: "malin@example.com").role
  end

  test "inscription orthophoniste : en attente de vérification" do
    post inscription_path, params: { accept_terms: "1", user: { role: "pro", name: "Ortho", email_address: "o@example.com", rpps: "10000000017", password: "motdepasse-ortho", password_confirmation: "motdepasse-ortho" } }
    assert_redirected_to pro_pending_path
    assert_equal "en_attente", User.find_by(email_address: "o@example.com").pro_status
  end

  test "l'admin valide un orthophoniste" do
    sign_in_as users(:admin)
    post verify_admin_user_path(users(:pro_attente))
    assert users(:pro_attente).reload.verified_pro?
  end

  test "parcours de liaison : code donné par l'orthophoniste, saisi par le parent" do
    sign_in_as users(:pro)
    post link_code_pro_patient_path(profiles(:patient))
    code = profiles(:patient).reload.link_code
    assert code.present?

    sign_in_as users(:famille)
    post parent_profile_link_path(profiles(:lea)), params: { code: }
    assert_redirected_to parent_profile_path(profiles(:lea))
    assert_equal users(:pro), profiles(:lea).reload.therapist

    delete parent_profile_link_path(profiles(:lea))
    assert_nil profiles(:lea).reload.therapist
  end

  test "le parent impose un niveau à un jeu" do
    sign_in_as users(:famille)
    post parent_profile_settings_path(profiles(:lea)), params: { slug: "tambour", level: "3" }
    assert_equal 3, profiles(:lea).game_states.find_by(game_slug: "tambour").settings["level"]
    post parent_profile_settings_path(profiles(:lea)), params: { slug: "tambour", level: "4" }
    assert_nil profiles(:lea).game_states.find_by(game_slug: "tambour").settings["level"] # 3 niveaux seulement
    post parent_profile_settings_path(profiles(:lea)), params: { slug: "ligne-numerique", level: "5" }
    assert_equal 5, profiles(:lea).game_states.find_by(game_slug: "ligne-numerique").settings["level"]
    post parent_profile_settings_path(profiles(:lea)), params: { slug: "tambour", level: "auto" }
    assert_nil profiles(:lea).game_states.find_by(game_slug: "tambour").settings["level"]
  end

  test "la page d'un jeu transmet la configuration au bundle" do
    sign_in_as users(:famille)
    get jeu_path(profiles(:lea), "tambour")
    assert_response :success
    config = JSON.parse(css_select("#jeu").first["data-config"])
    assert_equal "tambour", config["slug"]
    assert_equal "maison", config["mode"]
    assert_equal "Léa", config["profile"]["name"]
  end
end
