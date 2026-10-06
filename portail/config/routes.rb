Rails.application.routes.draw do
  root "pages#home"
  get "legal/:page" => "pages#legal", as: :legal

  resource :session
  resources :passwords, param: :token
  resource :inscription, controller: :registrations, only: %i[ new create ]
  resource :sudo, only: %i[ new create ], path: "confirmer"

  # Côté enfant
  get "jouer" => "play#index", as: :jouer
  get "jouer/:profile_id" => "play#catalogue", as: :catalogue
  get "jouer/:profile_id/:slug" => "play#game", as: :jeu

  scope "api/profils/:profile_id/jeux/:slug", controller: "api/games", as: :api_game do
    post :state
    post :settings
    post :attempts
  end

  # Exercice envoyé par l'orthophoniste (sans compte)
  scope "e/:token", controller: :assignments do
    get "/" => :show, as: :exercice
    get "jouer" => :play, as: :exercice_jeu
    post :state, as: :exercice_state
    post :attempts, as: :exercice_attempts
  end

  # Espace parent
  get "parent" => "parent#index", as: :parent
  post "parent/profils" => "parent#create", as: :parent_profiles
  get "parent/profils/:id" => "parent#show", as: :parent_profile
  patch "parent/profils/:id" => "parent#update"
  delete "parent/profils/:id" => "parent#destroy"
  post "parent/profils/:id/liaison" => "parent#link", as: :parent_profile_link
  delete "parent/profils/:id/liaison" => "parent#unlink"
  post "parent/profils/:id/reglages" => "parent#game_settings", as: :parent_profile_settings

  # Abonnement
  get "abonnement" => "subscriptions#show", as: :abonnement
  post "abonnement/paiement" => "subscriptions#checkout", as: :abonnement_paiement
  get "abonnement/merci" => "subscriptions#success", as: :abonnement_merci
  post "abonnement/gerer" => "subscriptions#portal", as: :abonnement_gerer
  post "stripe/webhook" => "stripe_webhooks#create"

  # Espace orthophoniste
  namespace :pro do
    root "patients#index"
    get "en-attente" => "pending#show", as: :pending
    resources :patients, only: %i[ create show update destroy ] do
      member do
        post :link_code
        post :game_settings
      end
      resources :assignments, only: %i[ create destroy ], path: "exercices"
    end
    resources :devices, only: %i[ index destroy ], path: "appareils"
  end

  namespace :admin do
    root "users#index"
    resources :users, only: %i[ show ] do
      member do
        post :verify
        post :reject
        post :suspend
        post :reinstate
        post :grant
      end
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
