Rails.application.routes.draw do
  devise_for :users
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: "welcome#index"
  post "new", to: "welcome#new_game"
  post "join", to: "welcome#join_game"
  get "game", to: "welcome#game"

  mount ActionCable.server => "/game/cable"
end
