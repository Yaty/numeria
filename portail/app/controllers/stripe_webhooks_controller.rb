class StripeWebhooksController < ActionController::Base
  skip_forgery_protection

  def create
    secret = ENV["STRIPE_WEBHOOK_SECRET"] || Rails.application.credentials.dig(:stripe, :webhook_secret)
    return head :service_unavailable if secret.blank?
    event = Stripe::Webhook.construct_event(request.raw_post, request.headers["Stripe-Signature"].to_s, secret)
    StripeBilling.handle_event(event)
    head :ok
  rescue JSON::ParserError, Stripe::SignatureVerificationError
    head :bad_request
  end
end
