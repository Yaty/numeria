require "test_helper"

class AssignmentsTest < ActionDispatch::IntegrationTest
  setup do
    profiles(:lea).update!(therapist: users(:pro))
  end

  def create_link(profile = profiles(:patient), **params)
    sign_in_as users(:pro)
    post pro_patient_assignments_path(profile), params: { slug: "rimes", level: "2", days: "14", message: "Deux parties par jour" }.merge(params)
    profile.assignments.order(:id).last
  end

  test "l'orthophoniste crée un lien d'exercice pour un patient" do
    a = create_link
    assert_equal "rimes", a.game_slug
    assert_equal 2, a.level
    assert_in_delta 14.days.from_now, a.expires_at, 1.minute
    assert_equal 32, a.token.size
  end

  test "l'enfant ouvre le lien sans compte et joue au niveau imposé" do
    a = create_link
    reset!
    get exercice_path(a.token)
    assert_response :success
    assert_match "Rimes en folie", response.body
    assert_match "Deux parties par jour", response.body
    assert_equal "no-referrer", response.headers["Referrer-Policy"]
    get exercice_jeu_path(a.token)
    config = JSON.parse(css_select("#jeu").first["data-config"])
    assert_equal({ "level" => 2 }, config["settings"])
    assert_equal false, config["adult"]
    assert_equal "/e/#{a.token}", config["apiBase"]
  end

  test "les essais faits par le lien arrivent dans le dossier du patient" do
    a = create_link
    reset!
    post exercice_attempts_path(a.token), params: { attempts: [ { level: 2, item: "x", correct: true }, { level: 2, item: "y", correct: false } ] }, as: :json
    assert_response :no_content
    assert_equal 2, a.attempts.count
    assert_equal %w[maison], a.attempts.distinct.pluck(:mode)
    assert_equal({ total: 2, rate: 50 }, a.summary)
    assert a.reload.last_played_at
  end

  test "un lien désactivé, expiré ou au jeton inconnu ne marche plus" do
    a = create_link
    delete pro_patient_assignment_path(profiles(:patient), a)
    reset!
    get exercice_path(a.token)
    assert_response :gone
    post exercice_attempts_path(a.token), params: { attempts: [ { correct: true } ] }, as: :json
    assert_response :gone

    b = create_link
    b.update!(expires_at: 1.minute.ago)
    get exercice_jeu_path(b.token)
    assert_response :gone
    get exercice_path("inconnu")
    assert_response :gone
  end

  test "le lien s'arrête si l'orthophoniste est suspendu ou ne suit plus l'enfant" do
    a = create_link(profiles(:lea))
    users(:pro).suspend!("test")
    get exercice_path(a.token)
    assert_response :gone

    users(:pro).reinstate!
    get exercice_path(a.token)
    assert_response :success
    profiles(:lea).unlink!
    get exercice_path(a.token)
    assert_response :gone
  end

  test "un orthophoniste ne crée pas de lien pour le patient d'un autre" do
    sign_in_as users(:pro)
    post pro_patient_assignments_path(profiles(:patient_autre)), params: { slug: "rimes" }
    assert_response :not_found
    assert_empty profiles(:patient_autre).assignments
  end

  test "Numéria : pas de niveau imposé (réglages propres au jeu)" do
    a = create_link(slug: "numeria", level: "3")
    assert_nil a.level
  end

  test "un jeu inconnu est refusé" do
    assert_nil create_link(slug: "inconnu")
  end
end
