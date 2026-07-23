import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Accuracy Difference
const accuracyDifferenceEl = document.getElementById("accuracy-difference")

const animation = {
    accuracyDifference: new CountUp(accuracyDifferenceEl, 0, 0, 2, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: "%"}),
}

const socket = createTosuWsSocket()
socket.onmessage = async event => {
    const data = JSON.parse(event.data)
    const clients = data.tourney.clients
    animation.accuracyDifference.update(Math.abs(clients[0].play.accuracy - clients[1].play.accuracy))
}