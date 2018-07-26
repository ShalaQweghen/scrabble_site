Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: "welcome#index"
  devise_for :users, controllers: { sessions: 'users/sessions', registrations: 'users/registrations' }
  resources :games

  get "users/:id", to: "users#show", as: "user"
  get "users", to: "users#index"

  mount ActionCable.server => "/cable"
end
