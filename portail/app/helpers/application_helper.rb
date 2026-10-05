module ApplicationHelper
  # Balises du bundle des jeux compilé par Vite (public/jeux/.vite/manifest.json).
  def jeux_bundle_tags
    manifest = jeux_manifest
    entry = manifest && manifest["src/portal/main.ts"]
    return tag.script("console.error('Bundle des jeux absent : lancez npm run build:portail')") unless entry
    css = Array(entry["css"]).map { |f| stylesheet_link_tag("/jeux/#{f}") }
    safe_join(css + [ javascript_include_tag("/jeux/#{entry['file']}", type: "module") ])
  end

  def jeux_manifest
    path = Rails.root.join("public/jeux/.vite/manifest.json")
    return unless File.exist?(path)
    return JSON.parse(File.read(path)) if Rails.env.local?
    @@jeux_manifest ||= JSON.parse(File.read(path))
  end

  # Filigrane nominatif de l'espace orthophoniste (dissuade les captures partagées).
  def watermark_style(user)
    text = ERB::Util.html_escape("#{user.name} · #{user.email_address}")
    svg = %(<svg xmlns="http://www.w3.org/2000/svg" width="420" height="220"><text x="10" y="120" transform="rotate(-20 210 110)" font-family="sans-serif" font-size="15" fill="rgba(29,39,66,0.07)">#{text}</text></svg>)
    "background-image:url(\"data:image/svg+xml;base64,#{Base64.strict_encode64(svg)}\")"
  end

  def rate_badge(rate)
    klass = rate >= 80 ? "good" : rate >= 50 ? "mid" : "low"
    tag.span("#{rate} %", class: "rate #{klass}")
  end

  def game_title(slug)
    Game.all.find { |g| g.slug == slug }&.title || slug
  end
end
