class Pro::BaseController < ApplicationController
  layout "pro"
  before_action :require_verified_pro
end
