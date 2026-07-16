import { loadBeatmaps, findBeatmap } from "../_shared/core/beatmaps.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

const roundNameEl = document.getElementById("round-name")
Promise.all([loadBeatmaps()]).then(([beatmaps]) => {
    roundNameEl.textContent = beatmaps.roundName.toUpperCase()
})

// Team Info
const teamRedPfpEl = document.getElementById("team-red-pfp")
const teamBluePfpEl = document.getElementById("team-blue-pfp")
const teamRedNameEl = document.getElementById("team-red-name")
const teamBlueNameEl = document.getElementById("team-blue-name")
let player1Id, player2Id

// Accuracy Difference
const accuracyDifferenceEl = document.getElementById("accuracy-difference")
const animation = {
    accuracyDifference: new CountUp(accuracyDifferenceEl, 0, 0, 2, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: "%"})
}

const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)
    // console.log(data)

    // Save data
    const clients = data.tourney.clients
    
    if (player1Id !== clients[0].user.id) {
        player1Id = clients[0].user.id
        teamRedPfpEl.style.backgroundImage = `url("https://a.ppy.sh/${player1Id}")`
        teamRedNameEl.innerText = clients[0].user.name
    }
    if (player2Id !== clients[1].user.id) {
        player2Id = clients[1].user.id
        teamBluePfpEl.style.backgroundImage = `url("https://a.ppy.sh/${player2Id}")`
        teamBlueNameEl.innerText = clients[1].user.name
    }

    // Accuracy
    animation.accuracyDifference.update(Math.abs(clients[0].play.accuracy - clients[1].play.accuracy))
}
