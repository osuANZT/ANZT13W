// Update all chat information
export function updateChat(
    chatData,
    chatLength,
    chatDisplayContainerEl
) {
    if (chatLength === 0 || chatLength > chatData.length) {
        chatDisplayContainerEl.innerHTML = ""
        chatLength = 0
    }
    const fragment = document.createDocumentFragment()

    for (let i = chatLength; i < chatData.length; i++) {
        // Message container
        const messageWrapper = document.createElement("div")
        messageWrapper.classList.add("message-wrapper")

        // Time
        const messageTime = document.createElement("div")
        messageTime.classList.add("message-time")
        messageTime.textContent = chatData[i].timestamp

        // Name
        const messageName = document.createElement("div")
        messageName.classList.add("message-name", chatData[i].team)
        messageName.textContent = `${chatData[i].name}:`
        // Set class of chat

        // Message
        const messageContent = document.createElement("div")
        messageContent.classList.add("message-content")
        messageContent.textContent = chatData[i].message

        // Append everything
        messageWrapper.append(messageTime, messageName, messageContent)
        fragment.append(messageWrapper)
    }

    chatDisplayContainerEl.append(fragment)
    chatLength = chatData.length
    return chatLength
}