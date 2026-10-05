require "test_helper"

# Garde-fous des comptes : appareils, expiration, partage, cloisonnement.
class SafeguardsTest < ActionDispatch::IntegrationTest
  test "un orthophoniste a 2 appareils au plus : la 3e connexion ferme la plus ancienne" do
    pro = users(:pro)
    3.times do |i|
      reset!
      log_in(pro, ip: "10.0.0.#{i}")
      assert_redirected_to pro_root_path
    end
    assert_equal 2, pro.sessions.count
    assert_equal 1, pro.login_events.where(kind: "evince").count
  end

  test "une famille a 3 appareils au plus" do
    famille = users(:famille)
    4.times { reset!; log_in(famille) }
    assert_equal 3, famille.sessions.count
  end

  test "la session d'un orthophoniste expire après 12 h" do
    log_in(users(:pro))
    get pro_root_path
    assert_response :success
    travel 13.hours do
      get pro_root_path
      assert_redirected_to new_session_path
    end
  end

  test "trop d'adresses IP en 24 h suspendent un compte orthophoniste" do
    pro = users(:pro)
    (Portail::SHARING_MAX_IPS + 1).times do |i|
      reset!
      log_in(pro, ip: "192.168.1.#{i}")
    end
    assert pro.reload.suspended?
    assert_equal "suspendu", pro.pro_status
    assert_empty pro.sessions
    reset!
    log_in(pro, ip: "192.168.1.1")
    assert_redirected_to new_session_path
    assert_match "suspendu", flash[:alert]
  end

  test "une famille n'est pas suspendue pour plusieurs adresses (maison, école…)" do
    famille = users(:famille)
    8.times { |i| reset!; log_in(famille, ip: "172.16.0.#{i}") }
    assert_not famille.reload.suspended?
  end

  test "un orthophoniste ne voit pas les patients d'un autre" do
    sign_in_as users(:pro)
    get pro_patient_path(profiles(:patient_autre))
    assert_response :not_found
    get catalogue_path(profiles(:patient_autre))
    assert_response :not_found
    post api_game_attempts_path(profile_id: profiles(:patient_autre).id, slug: "intrus"), params: { attempts: [ { correct: true } ] }, as: :json
    assert_response :not_found
  end

  test "une famille ne voit pas les profils d'une autre famille" do
    sign_in_as users(:famille_expiree)
    users(:famille_expiree).update!(paid_until: 1.month.from_now)
    get catalogue_path(profiles(:lea))
    assert_response :not_found
  end

  test "une famille ne voit pas l'espace orthophoniste ni l'administration" do
    sign_in_as users(:famille)
    get pro_root_path
    assert_response :not_found
    get admin_root_path
    assert_response :not_found
  end

  test "un orthophoniste en attente de vérification ne peut pas jouer" do
    sign_in_as users(:pro_attente)
    get pro_root_path
    assert_redirected_to pro_pending_path
    get jouer_path
    assert_redirected_to pro_pending_path
  end

  test "sans abonnement, une famille est envoyée vers la page d'abonnement" do
    sign_in_as users(:famille_expiree)
    get jouer_path
    assert_redirected_to abonnement_path
  end

  test "les pages personnelles ne sont ni indexées ni mises en cache" do
    sign_in_as users(:pro)
    get pro_root_path
    assert_equal "noindex, nofollow", response.headers["X-Robots-Tag"]
    assert_equal "no-store", response.headers["Cache-Control"]
  end

  test "l'espace parent demande le mot de passe après 15 minutes" do
    log_in(users(:famille))
    get parent_path
    assert_response :success
    travel 20.minutes do
      get parent_path
      assert_redirected_to new_sudo_path
      post sudo_path, params: { password: "mauvais" }
      assert_redirected_to new_sudo_path
      post sudo_path, params: { password: PASSWORD }
      assert_redirected_to parent_path
    end
  end

  test "un orthophoniste peut déconnecter un autre de ses appareils" do
    pro = users(:pro)
    other = pro.sessions.create!(ip_address: "9.9.9.9")
    log_in(pro)
    delete pro_device_path(other)
    assert_not Session.exists?(other.id)
  end
end
