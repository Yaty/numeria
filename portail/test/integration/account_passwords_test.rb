require "test_helper"

class AccountPasswordsTest < ActionDispatch::IntegrationTest
  test "changer son mot de passe déconnecte les autres appareils" do
    pro = users(:pro)
    other = pro.sessions.create!
    log_in(pro)
    patch mot_de_passe_path, params: { current_password: "mauvais", password: "nouveau-mdp-123", password_confirmation: "nouveau-mdp-123" }
    assert_redirected_to mot_de_passe_path
    patch mot_de_passe_path, params: { current_password: PASSWORD, password: "nouveau-mdp-123", password_confirmation: "nouveau-mdp-123" }
    assert_redirected_to pro_root_path
    assert pro.reload.authenticate("nouveau-mdp-123")
    assert_not Session.exists?(other.id)
  end

  test "un admin sans profil qui va sur /jouer revient à l'administration" do
    sign_in_as users(:admin)
    get jouer_path
    assert_redirected_to admin_root_path
  end
end
