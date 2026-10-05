namespace :portail do
  desc "Crée (ou met à jour) un compte administrateur : EMAIL=… PASSWORD=… NAME=…"
  task admin: :environment do
    user = User.find_or_initialize_by(email_address: ENV.fetch("EMAIL").strip.downcase)
    user.update!(role: "admin", name: ENV.fetch("NAME", "Administration"), password: ENV.fetch("PASSWORD"))
    puts "Administrateur prêt : #{user.email_address}"
  end
end
