App.activity = App.cable.subscriptions.create "ActivityChannel",
  connected: ->
    # Called when the subscription is ready for use on the server

  disconnected: ->
    # Called when the subscription has been terminated by the server

  received: (data) ->
    switch data.action
      when "show_invite"
        invitationLink = document.getElementById("invitation")
        invitationLink.lastChild.textContent = data.msg
        invitationLink.classList.remove("invisible")
        
      when "show_decline"
        [gameId, userId] = data.msg.split(" ")

        if window.location.href.split("games/")[1] == gameId
          window.location.href = "/?declined=" + userId
