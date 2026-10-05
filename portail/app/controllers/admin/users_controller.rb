class Admin::UsersController < Admin::BaseController
  def index
    @pending = User.pros.where(pro_status: "en_attente").order(:created_at)
    @suspended = User.where.not(suspended_at: nil).order(suspended_at: :desc)
    @users = User.order(created_at: :desc)
    @users = @users.where("email_address LIKE ? OR name LIKE ?", "%#{params[:q]}%", "%#{params[:q]}%") if params[:q].present?
    @users = @users.limit(100)
  end

  def show
    @user = User.find(params[:id])
    @events = @user.login_events.order(created_at: :desc).limit(50)
    @detector = SharingDetector.new(@user)
  end

  def verify
    user = User.pros.find(params[:id])
    user.update!(pro_status: "verifie")
    redirect_to admin_root_path, notice: "#{user.name} est vérifié(e)."
  end

  def reject
    user = User.pros.find(params[:id])
    user.update!(pro_status: "refuse")
    user.sessions.destroy_all
    redirect_to admin_root_path, notice: "#{user.name} : inscription refusée."
  end

  def suspend
    user = User.find(params[:id])
    user.suspend!(params[:reason].presence || "Suspendu par l’administration")
    redirect_to admin_user_path(user), notice: "Compte suspendu."
  end

  def reinstate
    user = User.find(params[:id])
    user.reinstate!
    redirect_to admin_user_path(user), notice: "Compte réactivé."
  end

  # Activation manuelle (paiement hors Stripe, geste commercial…).
  def grant
    user = User.find(params[:id])
    user.update!(paid_until: [ user.paid_until, Time.current ].compact.max + 1.year)
    redirect_to admin_user_path(user), notice: "Accès prolongé d’un an."
  end
end
