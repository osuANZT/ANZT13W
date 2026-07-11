// Update all chat information
export function updateChat(
    tourneyData,
    chatLength,
    chatDisplayContainerEl,
    currentTeamRed,
    currentTeamBlue
) {
    const chatData = tourneyData.chat
    if (chatLength === 0 || chatLength > chatData.length) {
        chatDisplayContainerEl.innerHTML = ""
        chatLength = 0
    }
    const fragment = document.createDocumentFragment()

    for (let i = chatLength; i < chatData.length; i++) {
        // Message container
        const messageWrapper = document.createElement("div")
        messageWrapper.classList.add("chat-message-wrapper")

        // Time
        const messageTime = document.createElement("div")
        const date = new Date(chatData[i].timestamp)
        messageTime.classList.add("chat-message-time")
        messageTime.textContent = date.toISOString().substring(11, 19)
        
        // Wrapper
        const messageWhole = document.createElement("div")
        messageWhole.classList.add("chat-message-whole")

        // Name
        const messageName = document.createElement("span")
        const chatName = chatData[i].name
        messageName.textContent = `${chatName}: `
        // Set class of chat
        let chatClass
        console.log(currentTeamRed, currentTeamBlue)
        if (!currentTeamRed || !currentTeamBlue) chatClass = "unknown"
        else if (currentTeamRed["player1-name"] === chatName || currentTeamRed["player2-name"] === chatName) chatClass = "left"
        else if (currentTeamBlue["player1-name"] === chatName || currentTeamBlue["player2-name"] === chatName) chatClass = "right"
        else if (chatData[i].message.includes("[FakeBanchoBot]")) messageName.classList.add("bot")
        else chatClass = "unknown"
        messageName.classList.add(chatClass)

        // Message
        const messageContent = document.createElement("span")
        messageContent.textContent = chatData[i].message

        // Append everything
        messageWhole.append(messageName, messageContent)
        messageWrapper.append(messageTime, messageWhole)
        fragment.append(messageWrapper)
    }

    chatDisplayContainerEl.append(fragment)
    chatLength = chatData.length
    return chatLength
}