class Admin::BaseController < ApplicationController
  before_action :require_admin
  before_action :require_sudo
end
