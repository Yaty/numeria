class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("MAIL_FROM", "contact@example.com")
  layout "mailer"
end
