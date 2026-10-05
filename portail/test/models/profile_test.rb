require "test_helper"

class ProfileTest < ActiveSupport::TestCase
  test "une famille a 4 profils au maximum" do
    famille = users(:famille)
    2.times { |i| famille.profiles.create!(name: "Enfant #{i}", avatar: "🐼") }
    extra = famille.profiles.create(name: "Cinquième", avatar: "🐼")
    assert_not extra.persisted?
  end

  test "liaison par code : le profil famille récupère l'orthophoniste et l'historique de séance" do
    patient = profiles(:patient)
    patient.attempts.create!(game_slug: "intrus", correct: true, mode: "seance", level: "1", item: "x")
    patient.game_states.create!(game_slug: "intrus", state: { "level" => 2 }, settings: { "level" => 2 })
    code = patient.generate_link_code!

    lea = profiles(:lea)
    assert Profile.link!(lea, code.downcase)
    lea.reload
    assert_equal users(:pro), lea.therapist
    assert_equal 1, lea.attempts.count
    assert_equal({ "level" => 2 }, lea.game_states.find_by(game_slug: "intrus").settings)
    assert_not Profile.exists?(patient.id)
    assert lea.linked_to_therapist?
  end

  test "un code expiré ou inconnu est refusé" do
    patient = profiles(:patient)
    code = patient.generate_link_code!
    patient.update!(link_code_expires_at: 1.minute.ago)
    assert_nil Profile.link!(profiles(:lea), code)
    assert_nil Profile.link!(profiles(:lea), "ZZZZZZZZ")
  end
end
