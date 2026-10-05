# Comptes de démonstration (développement uniquement).
return unless Rails.env.development?

pw = "motdepasse-demo"
admin = User.find_or_create_by!(email_address: "admin@demo.test") { |u| u.assign_attributes(name: "Admin", role: "admin", password: pw) }
famille = User.find_or_create_by!(email_address: "famille@demo.test") { |u| u.assign_attributes(name: "Camille", role: "famille", password: pw, paid_until: 1.year.from_now) }
pro = User.find_or_create_by!(email_address: "ortho@demo.test") { |u| u.assign_attributes(name: "Erell Démo", role: "pro", rpps: "10000000008", pro_status: "verifie", password: pw) }
User.find_or_create_by!(email_address: "attente@demo.test") { |u| u.assign_attributes(name: "Ortho en attente", role: "pro", rpps: "10000000016", password: pw) }
famille.profiles.find_or_create_by!(name: "Léa") { |p| p.assign_attributes(avatar: "🦊", birth_year: Date.current.year - 7, therapist: pro, linked_at: Time.current) }
famille.profiles.find_or_create_by!(name: "Tom") { |p| p.avatar = "🐻" }
pro.profiles.find_or_create_by!(name: "Patient A") { |p| p.assign_attributes(avatar: "🐸", therapist: pro) }
puts "Comptes de démo : #{[ admin, famille, pro ].map(&:email_address).join(', ')} — mot de passe : #{pw}"
