class PagesController < ApplicationController
  allow_unauthenticated_access

  def home
    return redirect_to home_path_for(Current.user) if authenticated?
    @categories = Game.by_category
  end

  def legal
    @page = params[:page]
    head :not_found unless %w[mentions-legales cgv confidentialite].include?(@page)
  end
end
