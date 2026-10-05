class SubscriptionsController < ApplicationController
  before_action :require_famille

  def show
  end

  def checkout
    return redirect_to abonnement_path, alert: "Le paiement en ligne n’est pas encore configuré." unless Portail.stripe_configured?
    redirect_to StripeBilling.checkout_url(Current.user, success_url: abonnement_merci_url, cancel_url: abonnement_url),
                allow_other_host: true, status: :see_other
  rescue Stripe::StripeError => e
    Rails.logger.error("[stripe] #{e.message}")
    redirect_to abonnement_path, alert: "Le paiement est momentanément indisponible. Réessayez plus tard."
  end

  # Retour de Stripe : on n'attend pas le webhook pour activer l'abonnement.
  def success
    if Portail.stripe_configured? && params[:session_id].present?
      checkout = Stripe::Checkout::Session.retrieve(params[:session_id])
      StripeBilling.complete_checkout(checkout) if checkout.client_reference_id == Current.user.id.to_s
    end
    Current.user.reload
    if Current.user.subscribed?
      redirect_to parent_path, notice: "Merci ! Votre abonnement est actif jusqu’au #{I18n.l(Current.user.paid_until.to_date, format: :long)}. Créez le profil de votre enfant."
    else
      redirect_to abonnement_path, notice: "Paiement en cours de validation. Rechargez la page dans un instant."
    end
  rescue Stripe::StripeError => e
    Rails.logger.error("[stripe] #{e.message}")
    redirect_to abonnement_path, alert: "Impossible de vérifier le paiement pour l’instant."
  end

  def portal
    return redirect_to abonnement_path, alert: "Aucun abonnement Stripe associé." if Current.user.stripe_customer_id.blank?
    redirect_to StripeBilling.portal_url(Current.user, return_url: abonnement_url), allow_other_host: true, status: :see_other
  rescue Stripe::StripeError => e
    Rails.logger.error("[stripe] #{e.message}")
    redirect_to abonnement_path, alert: "La gestion de l’abonnement est momentanément indisponible."
  end
end
