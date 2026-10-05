module SessionTestHelper
  PASSWORD = "motdepasse-test"

  # Connexion réelle (passe par les garde-fous du contrôleur).
  def log_in(user, ip: "1.2.3.4", agent: "Mozilla/5.0 (X11; Linux) Chrome/140")
    post session_path, params: { email_address: user.email_address, password: PASSWORD },
                       headers: { "REMOTE_ADDR" => ip, "User-Agent" => agent }
  end

  def sign_in_as(user)
    Current.session = user.sessions.create!(sudo_at: Time.current)
    ActionDispatch::TestRequest.create.cookie_jar.tap do |cookie_jar|
      cookie_jar.signed[:session_id] = Current.session.id
      cookies["session_id"] = cookie_jar[:session_id]
    end
  end
end

ActiveSupport.on_load(:action_dispatch_integration_test) do
  include SessionTestHelper
end
