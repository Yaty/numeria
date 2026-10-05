# Fiche d'un jeu (config/games.yml). Le code du jeu est dans src/games/<slug>.ts.
class Game
  Category = Data.define(:slug, :name, :emoji, :description)

  attr_reader :slug, :title, :emoji, :category, :ages, :description, :objectives, :levels

  def initialize(attrs)
    @slug = attrs.fetch("slug")
    @title = attrs.fetch("title")
    @emoji = attrs.fetch("emoji")
    @category = attrs.fetch("category")
    @ages = attrs.fetch("ages")
    @description = attrs.fetch("description")
    @objectives = attrs.fetch("objectives", [])
    @levels = attrs.fetch("levels", [])
  end

  def to_param = slug

  class << self
    def data
      @data = nil if Rails.env.development?
      @data ||= YAML.load_file(Rails.root.join("config/games.yml"))
    end

    def categories
      data.fetch("categories").map { |c| Category.new(**c.symbolize_keys) }
    end

    def all
      data.fetch("games").map { |g| new(g) }
    end

    def find(slug)
      all.find { |g| g.slug == slug } or raise ActiveRecord::RecordNotFound, "Jeu inconnu : #{slug}"
    end

    def slugs = all.map(&:slug)

    def by_category
      games = all
      categories.map { |c| [ c, games.select { |g| g.category == c.slug } ] }.reject { |_, gs| gs.empty? }
    end
  end

  def category_info = self.class.categories.find { |c| c.slug == category }
end
