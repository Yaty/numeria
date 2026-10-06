require "test_helper"

class VoicesTest < ActionDispatch::IntegrationTest
  test "l'orthophoniste choisit sa voix ; elle sert en séance et dans les exercices envoyés" do
    sign_in_as users(:pro)
    get voix_path
    assert_response :success
    patch voix_path, params: { voice: "fr_FR-tom-medium" }, as: :json
    assert_response :no_content
    assert_equal "fr_FR-tom-medium", users(:pro).reload.voice

    get jeu_path(profiles(:patient), "rimes")
    assert_equal "fr_FR-tom-medium", JSON.parse(css_select("#jeu").first["data-config"])["voice"]

    post pro_patient_assignments_path(profiles(:patient)), params: { slug: "rimes" }
    token = profiles(:patient).assignments.last.token
    reset!
    get exercice_jeu_path(token)
    assert_equal "fr_FR-tom-medium", JSON.parse(css_select("#jeu").first["data-config"])["voice"]
  end

  test "seules les voix neuronales sont acceptées" do
    sign_in_as users(:pro)
    patch voix_path, params: { voice: "system:Google français" }, as: :json
    assert_response :unprocessable_entity
    assert_nil users(:pro).reload.voice
  end
end
