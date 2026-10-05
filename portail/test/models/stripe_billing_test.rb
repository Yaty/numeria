require "test_helper"

class StripeBillingTest < ActiveSupport::TestCase
  def subscription(status:, period_end:, customer: "cus_123", id: "sub_123", user_id: nil)
    Stripe::Subscription.construct_from(
      id:, object: "subscription", status:, customer:, metadata: { user_id: user_id&.to_s }.compact,
      items: { object: "list", data: [ { id: "si_1", object: "subscription_item", current_period_end: period_end.to_i } ] }
    )
  end

  test "un abonnement actif prolonge l'accès jusqu'à la fin de la période" do
    user = users(:famille_expiree)
    StripeBilling.sync(subscription(status: "active", period_end: 1.year.from_now, user_id: user.id))
    user.reload
    assert user.subscribed?
    assert_equal "sub_123", user.stripe_subscription_id
    assert_equal "cus_123", user.stripe_customer_id
  end

  test "un abonnement résilié coupe l'accès" do
    user = users(:famille)
    user.update!(stripe_subscription_id: "sub_9")
    StripeBilling.sync(subscription(id: "sub_9", status: "canceled", period_end: 1.year.from_now, customer: "cus_9"))
    assert_not user.reload.subscribed?
  end

  test "le webhook refuse une signature invalide et accepte une signature valide" do
    secret = "whsec_test"
    ENV["STRIPE_WEBHOOK_SECRET"] = secret
    user = users(:famille_expiree)
    payload = { id: "evt_1", object: "event", type: "customer.subscription.updated",
                data: { object: subscription(status: "active", period_end: 1.year.from_now, user_id: user.id).to_hash } }.to_json
    session = ActionDispatch::Integration::Session.new(Rails.application)
    session.post "/stripe/webhook", params: payload, headers: { "Stripe-Signature" => "t=1,v1=faux", "CONTENT_TYPE" => "application/json" }
    assert_equal 400, session.response.status

    t = Time.now.to_i
    sig = Stripe::Webhook::Signature.compute_signature(Time.at(t), payload, secret)
    session.post "/stripe/webhook", params: payload, headers: { "Stripe-Signature" => "t=#{t},v1=#{sig}", "CONTENT_TYPE" => "application/json" }
    assert_equal 200, session.response.status
    assert user.reload.subscribed?
  ensure
    ENV.delete("STRIPE_WEBHOOK_SECRET")
  end
end
