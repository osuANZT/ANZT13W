ComfyJS.Init( "osuANZT", null, "osuANZT" );

// Twitch Chat
const twitchChatContainer = document.getElementById("chat-display")
ComfyJS.onChat = ( user, message, flags, self, extra ) => {

    // Get rid of nightbot messages
    if (user === "Nightbot") return

    // Set up message container
    const twitchChatMessageContainer = document.createElement("div")
    twitchChatMessageContainer.classList.add("message-container")
    twitchChatMessageContainer.setAttribute("id", extra.id)
    twitchChatMessageContainer.setAttribute("data-twitch-id", extra.userId)

    // Message user
    const messageUser = document.createElement("span")
    messageUser.classList.add("message-name")
    messageUser.innerText = `${user}:`

    if (!chatColours[user]) generateChatColour(user)
    let chatColour = chatColours[user]
    messageUser.style.color = `rgb(${chatColour.r}, ${chatColour.g}, ${chatColour.b})`

    // Message
    const chatMessage = document.createElement("span")
    chatMessage.classList.add("message-content")
    chatMessage.innerText = message

    // Append everything together
    twitchChatMessageContainer.append(messageUser, chatMessage)
    twitchChatContainer.append(twitchChatMessageContainer)
    twitchChatContainer.scrollTop = twitchChatContainer.scrollHeight
}

// Delete message
ComfyJS.onMessageDeleted = (id) => document.getElementById(id).remove()

// Timeout
ComfyJS.onTimeout = ( timedOutUsername, durationInSeconds, extra ) => deleteAllMessagesFromUser(extra.timedOutUserId)

// Ban
ComfyJS.onBan = (bannedUsername, extra) => deleteAllMessagesFromUser(extra.bannedUserId)

// Delete all messages from user
function deleteAllMessagesFromUser(twitchId) {
    const allTwitchChatMessages = Array.from(document.getElementsByClassName("twitchChatMessage"))
    allTwitchChatMessages.forEach((message) => {
        if (message.dataset.twitchId === twitchId) {
            message.remove()
        }
    })
}

// Generate Colour
let chatColours = {}
function generateChatColour(username) {
    let r, g, b
    let validColour = false

    while (!validColour) {
        r = Math.floor(Math.random() * 256)
        g = Math.floor(Math.random() * 256)
        b = Math.floor(Math.random() * 256)

        // Guard clauses
        if (r === 256 || g === 256 || b === 256) continue
        if (r + g + b >= 500) validColour = true
    }

    chatColours[username] = {"r": r, "g": g, "b": b}
}