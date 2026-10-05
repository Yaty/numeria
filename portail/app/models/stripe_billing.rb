# Abonnement famille via Stripe Checkout (abonnement annuel) et synchronisation
# de l'état de l'abonnement (page de retour et webhook).
module StripeBilling
  ACTIVE = %w[active trialing past_due].freeze

  module_function

  def checkout_url(user, success_url:, cancel_url:)
    line_item =
      if Portail::STRIPE_PRICE_ID.present?
        { price: Portail::STRIPE_PRICE_ID, quantity: 1 }
      else
        { quantity: 1, price_data: { currency: "eur", unit_amount: Portail::PRICE_CENTS, recurring: { interval: "year" },
                                     product_data: { name: "#{Portail::NAME} — abonnement famille (1 an)" } } }
      end
    params = {
      mode: "subscription",
      line_items: [ line_item ],
      success_url: "#{success_url}?session_id={CHECKOUT_SESSION_ID}",
      cancel_url:,
      client_reference_id: user.id.to_s,
      locale: "fr",
      allow_promotion_codes: true,
      subscription_data: { metadata: { user_id: user.id.to_s } }
    }
    if user.stripe_customer_id.present?
      params[:customer] = user.stripe_customer_id
    else
      params[:customer_email] = user.email_address
    end
    Stripe::Checkout::Session.create(params).url
  end

  def portal_url(user, return_url:)
    Stripe::BillingPortal::Session.create(customer: user.stripe_customer_id, return_url:, locale: "fr").url
  end

  # Retour de Checkout (ou webhook checkout.session.completed).
  def complete_checkout(checkout_session)
    user = User.find_by(id: checkout_session.client_reference_id)
    return unless user && checkout_session.subscription
    user.update!(stripe_customer_id: checkout_session.customer) if checkout_session.customer && user.stripe_customer_id != checkout_session.customer
    subscription = checkout_session.subscription
    subscription = Stripe::Subscription.retrieve(subscription) if subscription.is_a?(String)
    sync(subscription, user)
  end

  def sync(subscription, user = nil)
    user ||= User.find_by(stripe_subscription_id: subscription.id) ||
             User.find_by(stripe_customer_id: subscription.customer) ||
             User.find_by(id: subscription.metadata&.[]("user_id"))
    return unless user
    period_end = subscription.items&.data&.first&.current_period_end || subscription.try(:current_period_end)
    attrs = { stripe_subscription_id: subscription.id, subscription_status: subscription.status }
    attrs[:stripe_customer_id] = subscription.customer if subscription.customer.is_a?(String)
    if ACTIVE.include?(subscription.status) && period_end
      attrs[:paid_until] = Time.zone.at(period_end)
    elsif %w[canceled unpaid incomplete_expired].include?(subscription.status)
      ended = subscription.try(:ended_at) ? Time.zone.at(subscription.ended_at) : Time.current
      attrs[:paid_until] = [ user.paid_until, ended ].compact.min
    end
    user.update!(attrs)
    user
  end

  def handle_event(event)
    object = event.data.object
    case event.type
    when "checkout.session.completed"
      complete_checkout(object) if object.mode == "subscription"
    when "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"
      sync(object)
    when "invoice.paid"
      sub_id = object.try(:subscription) || object.try(:parent)&.try(:subscription_details)&.try(:subscription)
      sync(Stripe::Subscription.retrieve(sub_id)) if sub_id
    end
  end
end
