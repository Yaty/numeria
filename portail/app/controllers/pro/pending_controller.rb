class Pro::PendingController < ApplicationController
  layout "pro"
  before_action { head :not_found unless Current.user.pro? }

  def show
    redirect_to pro_root_path if Current.user.verified_pro?
  end
end
