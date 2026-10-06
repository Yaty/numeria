require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "un orthophoniste doit donner un numéro RPPS valide (11 chiffres)" do
    user = User.new(name: "X", email_address: "x@example.com", password: "motdepasse-long", role: "pro", rpps: "123")
    assert_not user.valid?
    user.rpps = "123456789" # ancien format ADELI : refusé
    assert_not user.valid?
    user.rpps = "10 0000 0000 8"
    assert user.valid?, user.errors.full_messages.to_sentence
    assert_equal "en_attente", user.pro_status
  end

  test "clé de Luhn du RPPS" do
    assert User.new(rpps: "10000000017").rpps_checksum_ok?
    assert_not User.new(rpps: "10000000018").rpps_checksum_ok?
    assert_not User.new(rpps: "123456789").rpps_checksum_ok?
  end

  test "mot de passe de 10 caractères minimum" do
    assert_not User.new(name: "X", email_address: "y@example.com", password: "court").valid?
  end

  test "accès aux jeux selon le type de compte" do
    assert users(:famille).can_play?
    assert_not users(:famille_expiree).can_play?
    assert users(:pro).can_play?
    assert_not users(:pro_attente).can_play?
    assert users(:admin).can_play?
  end

  test "un compte suspendu ne joue plus et ses sessions sont fermées" do
    pro = users(:pro)
    pro.sessions.create!
    pro.suspend!("test")
    assert_not pro.can_play?
    assert_equal "suspendu", pro.pro_status
    assert_empty pro.sessions.reload
    pro.reinstate!
    assert pro.can_play?
  end

  test "profils visibles : les siens et ceux des patients liés" do
    profiles(:lea).update!(therapist: users(:pro))
    visible = users(:pro).visible_profiles
    assert_includes visible, profiles(:lea)
    assert_includes visible, profiles(:patient)
    assert_not_includes visible, profiles(:tom)
    assert_not_includes visible, profiles(:patient_autre)
  end

  test "un orthophoniste non vérifié ne voit pas les profils liés" do
    profiles(:lea).update!(therapist: users(:pro_attente))
    assert_not_includes users(:pro_attente).visible_profiles, profiles(:lea)
  end
end
