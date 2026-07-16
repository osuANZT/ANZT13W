import { loadBeatmaps, findBeatmap } from "../_shared/core/beatmaps.js"
import { displayStars } from "../_shared/core/stars.js"
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

// Star Containers
const redTeamStarContainerEl = document.getElementById("red-team-star-container")
const blueTeamStarContainerEl = document.getElementById("blue-team-star-container")
let currentRedTeamStars, currentBlueTeamStars, currentOsuBestOf, starsVisible

// Score Bar
const scoreBarLeftEl = document.getElementById("score-bar-left")
const scoreBarRightEl = document.getElementById("score-bar-right")
const scoreDifferenceLeftEl = document.getElementById("score-difference-left")
const scoreDifferenceRightEl = document.getElementById("score-difference-right")
const scoreLeftEl = document.getElementById("score-left")
const scoreRightEl = document.getElementById("score-right")
const crownLeftEl = document.getElementById("crown-left")
const crownRightEl = document.getElementById("crown-right")
let scoreVisible

const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)
    // console.log(data)

    // Save data
    const clients = data.tourney.clients
    const teamPoints = data.tourney.points
    
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

    // Star visibility
    console.log(data)
    if (starsVisible !== data.tourney.starsVisible) {
        starsVisible = data.tourney.starsVisible
        if (starsVisible) {
            redTeamStarContainerEl.style.opacity = 1
            blueTeamStarContainerEl.style.opacity = 1
        } else {
            redTeamStarContainerEl.style.opacity = 0
            blueTeamStarContainerEl.style.opacity = 0
        }
    }

    // Star info
    if (currentOsuBestOf !== data.tourney.bestOF ||
        currentRedTeamStars !== teamPoints.left ||
        currentBlueTeamStars !== teamPoints.right
    ) {
        currentOsuBestOf = data.tourney.bestOF
        currentRedTeamStars = teamPoints.left
        currentBlueTeamStars = teamPoints.right
        displayStars(currentOsuBestOf, redTeamStarContainerEl, blueTeamStarContainerEl, currentRedTeamStars, currentBlueTeamStars)
    }

    // Score visibility
    if (scoreVisible !== data.tourney.scoreVisible) {
        scoreVisible = data.tourney.scoreVisible
        if (scoreVisible) {
            scoreBarLeftEl.style.opacity = 1
            scoreBarRightEl.style.opacity = 1
            scoreDifferenceLeftEl.style.opacity = 1
            scoreDifferenceRightEl.style.opacity = 1
            scoreLeftEl.style.opacity = 1
            scoreRightEl.style.opacity = 1
            crownLeftEl.style.opacity = 1
            crownRightEl.style.opacity = 1
        } else {
            scoreBarLeftEl.style.opacity = 0
            scoreBarRightEl.style.opacity = 0
            scoreDifferenceLeftEl.style.opacity = 0
            scoreDifferenceRightEl.style.opacity = 0
            scoreLeftEl.style.opacity = 0
            scoreRightEl.style.opacity = 0
            crownLeftEl.style.opacity = 0
            crownRightEl.style.opacity = 0
        }
    }
}
