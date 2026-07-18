import { loadBeatmaps, findBeatmap } from "../_shared/core/beatmaps.js"
import { updateChat } from "../_shared/core/chat.js"
import { displayStars } from "../_shared/core/stars.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Pick Container
const pickContainerEl = document.getElementById("pick-container")

// Mappool Management Maps
const mappoolManagementMapsEl = document.getElementById("mappool-management-maps")

// Load mappool
let bestOf = 0
let banCount = 2
const roundNameEl = document.getElementById("round-name")
let allBeatmaps = []

// Pick array
let currentPickArray, previousPickArray
let currentWinnerArray, previousWinnerArray

Promise.all([loadBeatmaps()]).then(([beatmaps]) => {
    // Load beatmaps
    allBeatmaps = beatmaps.beatmaps
    roundNameEl.textContent = `${beatmaps.roundName.toLowerCase()} mappool`

    switch (beatmaps.roundName.toUpperCase()) {
        case "ROUND OF 64": case "ROUND OF 32": case "ROUND OF 16":
            bestOf = 9
            break
        case "QUARTERFINALS": case "SEMIFINALS":
            bestOf = 11
            break
        case "FINALS": case "GRAND FINALS":
            bestOf = 13
            break
    }
    currentPickArray = new Array(bestOf)
    currentWinnerArray = new Array(bestOf)

    // Create ban images
    teamRedProtectContainerEl.append(createBanProtectElement("red"))
    teamBlueProtectContainerEl.append(createBanProtectElement("blue"))
    for (let i = 0; i < banCount; i++) {
        teamRedBanContainerEl.append(createBanProtectElement("red"))
        teamBlueBanContainerEl.append(createBanProtectElement("blue"))
    }

    // Create pick tiles
    for (let i = 0; i < bestOf; i++) {
        const pickTile = document.createElement("div")
        pickTile.classList.add("pick-tile")

        // Pick tile category
        const pickTileCategory = document.createElement("img")
        pickTileCategory.classList.add("pick-tile-category", "absolute-center-x")

        // Pick Tile Border
        const pickTileBorder = document.createElement("img")
        pickTileBorder.classList.add("pick-tile-border")
        pickTileBorder.setAttribute("src", "../_shared/assets/pick-container/panel-border.png")

        // Pick Tile Winner Crown
        const pickTileWinnerCrown = document.createElement("img")
        pickTileWinnerCrown.classList.add("pick-tile-winner-crown", "absolute-center-x")
        pickTileWinnerCrown.setAttribute("src", "")

        // Pick Tile Bottom BG
        const pickTileBottomBg = document.createElement("img")
        pickTileBottomBg.classList.add("pick-tile-bottom-bg")

        // Pick Tile Bottom Text
        const pickTileBottomText = document.createElement("div")
        pickTileBottomText.classList.add("pick-tile-bottom-text")

        pickTile.append(pickTileCategory, pickTileBorder, pickTileWinnerCrown, pickTileBottomBg, pickTileBottomText)
        pickContainerEl.append(pickTile)
    }

    // Create map pick buttons
    for (let i = 0; i < allBeatmaps.length; i++) {
        const button = document.createElement("button")
        button.addEventListener("mousedown", mapClickEvent)
        button.addEventListener("contextmenu", function(event) {event.preventDefault()})
        button.classList.add("sidebar-button")
        button.dataset.id = allBeatmaps[i].beatmap_id
        button.textContent = `${allBeatmaps[i].mod}${allBeatmaps[i].order}`
        mappoolManagementMapsEl.append(button)
    }
})

function createBanProtectElement(team) {
    // Create the main wrapper div
    const teamBanProtectWrapper = document.createElement('div')
    teamBanProtectWrapper.classList.add("team-ban-protect-wrapper", `team-${team}-ban-protect-wrapper`)

    // Create the inner div for the ban protect image
    const teamBanProtectImage = document.createElement('div')
    teamBanProtectImage.classList.add("team-ban-protect-image")

    // Create the background div
    const teamBanProtectBackground = document.createElement('div')
    teamBanProtectBackground.classList.add("team-ban-protect-background")

    // Create the glass image element
    const teamBanProtectGlass = document.createElement('img')
    teamBanProtectGlass.classList.add("team-ban-protect-glass")
    teamBanProtectGlass.src = 'static/protect-banned-GLASS.png'

    // Create the text div
    const teamBanProtectText = document.createElement('div')
    teamBanProtectText.classList.add("team-ban-protect-text",`team-${team}-ban-protect-text`)

    // Append elements to their parent containers
    teamBanProtectImage.appendChild(teamBanProtectBackground)
    teamBanProtectImage.appendChild(teamBanProtectGlass)
    teamBanProtectImage.appendChild(teamBanProtectText)

    // Create the mod image element
    const teamBanProtectMod = document.createElement('img')
    teamBanProtectMod.classList.add("team-ban-protect-mod")

    // Append elements to the main wrapper
    teamBanProtectWrapper.appendChild(teamBanProtectImage)
    teamBanProtectWrapper.appendChild(teamBanProtectMod)

    return teamBanProtectWrapper
}

// Protect Containers
const teamRedProtectContainerEl = document.getElementById("team-red-protect-container")
const teamBlueProtectContainerEl = document.getElementById("team-blue-protect-container")
// Ban Containers
const teamRedBanContainerEl = document.getElementById("team-red-ban-container")
const teamBlueBanContainerEl = document.getElementById("team-blue-ban-container")

// Current pick tile
let currentPickTile

// Current map
const currentMapBackgroundImageMaskEl = document.getElementById("current-map-background-image-mask")
const currentMapBackgroundImageEl = document.getElementById("current-map-background-image")
const currentMapCategoryImageEl = document.getElementById("current-map-category-image")
const currentMapArtistTitleEl= document.getElementById("current-map-artist-title")
const currentMapArtistEl = document.getElementById("current-map-artist")
const currentMapTitleEl = document.getElementById("current-map-title")
const currentMapMappedByEl= document.getElementById("current-map-mapped-by")
const currentMapMapperNameEl = document.getElementById("current-map-mapper-name")
const currentMapDifficultyEl = document.getElementById("current-map-difficulty")

// Map Click Event
function mapClickEvent(event) {
    // Find map
    const currentMapId = this.dataset.id
    const currentMap = findBeatmap(currentMapId)
    if (!currentMap) return

    // Team
    let team
    if (event.button === 0) team = "red"
    else if (event.button === 2) team = "blue"
    if (!team) return

    // Action
    let action = "pick"
    if (event.ctrlKey) action = "ban"
    if (event.shiftKey) action = "protect"

    // Check if map exists in bans
    const mapCheck = !!(
        teamRedBanContainerEl.querySelector(`[data-id="${currentMapId}"]`) ||
        teamBlueBanContainerEl.querySelector(`[data-id="${currentMapId}"]`) ||
        pickContainerEl.querySelector(`[data-id="${currentMapId}"]`)
    )
    if (mapCheck) return

    // If ban
    if (action === "ban") {
        const currentElement = team === "red" ? teamRedBanContainerEl : teamBlueBanContainerEl

        for (let i = 0; i < currentElement.childElementCount; i++) {
            const element = currentElement.children[i]
            if (element.hasAttribute("data-id")) continue
            setSideMapDetails(element, currentMap, "banned")
            break
        }
    }

    // If protect
    if (action === "protect") {
        const currentElement = team === "red" ? teamRedProtectContainerEl : teamBlueProtectContainerEl
        const element = currentElement.children[0]
        if (!element.hasAttribute("data-id")) {
            setSideMapDetails(element, currentMap, "protect")
        }
    }

    // If pick
    if (action === "pick") {
        let mapsFound = 0
        // Set Tile
        for (let i = 0; i < bestOf; i++) {
            let currentTile = pickContainerEl.children[i]
            if (pickContainerEl.children[i].hasAttribute("data-id")) continue
            currentTile.style.display = "block"
            currentTile.dataset.id = currentMap.beatmap_id
            currentTile.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
            currentTile.children[0].setAttribute("src", `../_shared/assets/category-images/${currentMap.mod.toUpperCase()}${currentMap.order}.png`)
            currentTile.children[3].setAttribute("src", `static/pick-bgs/${currentMap.mod === "TB" ? "tb" : team}-pick-bg.png`)
            currentTile.children[4].textContent = `${currentMap.mod === "TB" ? "TB" : team.toUpperCase()} PICK`
            currentPickTile = currentTile
            mapsFound = 1
            break
        }

        // Set top information
        if (mapsFound !== 0) {
            // Set content
            currentMapBackgroundImageMaskEl.setAttribute("src", `https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg`)
            currentMapBackgroundImageEl.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
            currentMapCategoryImageEl.setAttribute("src", `../_shared/assets/category-images/${currentMap.mod.toUpperCase()}${currentMap.order}.png`)
            currentMapArtistEl.textContent = currentMap.artist
            currentMapTitleEl.textContent = currentMap.title
            currentMapDifficultyEl.textCotnent = currentMap.version
            currentMapMapperNameEl.textContent = currentMap.creator

            // Set display
            currentMapArtistTitleEl.style.display = "block"
            currentMapMappedByEl.style.display = "block"
        }
    }
}

function setSideMapDetails(element, currentMap, action) {
    element.style.display = "flex"
    element.children[0].children[0].style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
    element.children[0].children[2].innerText = `${action.toUpperCase()}`
    element.children[1].setAttribute("src", `../_shared/assets/mods/${currentMap.mod.toLowerCase()}${currentMap.order}.png`)
    element.dataset.id = currentMap.beatmap_id
}

// Team Names
const teamRedNameEl = document.getElementById("team-red-name")
const teamBlueNameEl = document.getElementById("team-blue-name")
let player1Id, player2Id

// Team PFPs
const teamRedPfpEl = document.getElementById("team-red-pfp")
const teamBluePfpEl = document.getElementById("team-blue-pfp")

// Star Containers
const redTeamStarContainerEl = document.getElementById("red-team-star-container")
const blueTeamStarContainerEl = document.getElementById("blue-team-star-container")
let currentRedTeamStars, currentBlueTeamStars, currentOsuBestOf, starsVisible

// Winner Checking Variables
let noOfClients, currentRedScore, currentBlueScore, checkedWinner = false

// Mappool Variables
let mapId, mapChecksum

// Chat variables
const chatDisplayWrapperEl = document.getElementById("chat-display-wrapper")
let chatLen = 0

// Socket
const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)
    console.log(data)

    const clients = data.tourney.clients
    const teamPoints = data.tourney.points
    const chatData = data.tourney.chat

    // Player info
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

    // Star visibility
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


    if (noOfClients !== data.tourney.clients.length) {
        noOfClients = data.tourney.clients.length
    }

    if (noOfClients > 0) {
        // Gameplay
        if (data.beatmap.time.live < data.beatmap.time.lastObject) {
            currentRedScore = 0
            currentBlueScore = 0
            for (let i = 0; i < noOfClients; i++) {
                const score = data.tourney.clients[i].play.score
                if (data.tourney.clients[i].team === "left") currentRedScore += score
                else currentBlueScore += score
            }
            checkedWinner = false

        } else {
            // Results
            if (!checkedWinner && currentPickTile) {
                
                checkedWinner = true

                const winner = currentRedScore > currentBlueScore ? "red" : currentBlueScore > currentRedScore ? "blue" : undefined
                if (winner) {
                    // Set pick
                    currentPickTile.children[2].setAttribute("src", `../_shared/assets/winner-crowns/winner-${winner}-map.png`)
                    currentPickTile.children[2].style.display = "block"
                }
            }
        }
    } else {
        // If in main lobby scene
        currentRedScore = 0
        currentBlueScore = 0
        checkedWinner = false
    }

    // Set beatmap information
    if ((mapId !== data.beatmap.id || mapChecksum !== data.beatmap.checksum) && allBeatmaps) {
        mapId = data.beatmap.id
        mapChecksum = data.beatmap.checksum

        // Find element
        const element = mappoolManagementMapsEl.querySelector(`[data-id="${mapId}"]`)

        // Click Event
        if (isAutopickOn && (!element.hasAttribute("data-is-autopicked") || element.getAttribute("data-is-autopicked") !== "true")) {
            // Check if autopicked already
            const event = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: (currentPicker === "red")? 0 : 2
            })
            element.dispatchEvent(event)
            element.setAttribute("data-is-autopicked", "true")

            updateCurrentPicker(currentPicker)
            if (currentPicker === "red") setAutopicker("blue")
            else if (currentPicker === "blue") setAutopicker("red")
        } else {
            setAutopicker("none")
        }
    }

    // This is also mostly taken from Victim Crasher: https://github.com/VictimCrasher/static/tree/master/WaveTournament
    if (chatLen !== chatData.length) {
        chatLen = updateChat(chatData, chatLen, chatDisplayWrapperEl)
    }

    // Save pick string
    currentPickArray = new Array(bestOf)
    for (let i = 0; i < pickContainerEl.childElementCount; i++) {
        if (pickContainerEl.children[i].hasAttribute("data-id")) currentPickArray[i] = pickContainerEl.children[i].dataset.id
    }
    if (currentPickArray !== previousPickArray) {
        previousPickArray = currentPickArray
        localStorage.setItem("currentPickString", currentPickArray.join("|"))
    }

    // Save winner string
    currentWinnerArray = new Array(bestOf)
    for (let i = 0; i < pickContainerEl.childElementCount; i++) {
        if (pickContainerEl.children[i].hasAttribute("data-id") &&
            pickContainerEl.children[i].children[2].hasAttribute("src")
        ) {
            if (pickContainerEl.children[i].children[2].getAttribute("src").includes("winner-red-map")) currentWinnerArray[i] = "red"
            else if (pickContainerEl.children[i].children[2].getAttribute("src").includes("winner-blue-map")) currentWinnerArray[i] = "blue"
        }
    }
    if (currentWinnerArray !== previousWinnerArray) {
        previousWinnerArray = currentWinnerArray
        localStorage.setItem("currentWinnerString", currentWinnerArray.join("|"))
    }
}

// Next autopick
const nextAutopickNextEl = document.getElementById("next-autopick-text")
const nextAutopickRedEl = document.getElementById("next-autopick-red")
const nextAutopickBlueEl = document.getElementById("next-autopick-blue")
const toggleAutopickButtonEl = document.getElementById("toggle-autopick-button")
const toggleAutopickOnOffEl = document.getElementById("toggle-autopick-on-off")
let isAutopickOn = false, currentPicker = "red"

// Toggle stars button
document.addEventListener("DOMContentLoaded", () => {

    // Toggle Autopick button
    toggleAutopickButtonEl.addEventListener("click", function() {
        isAutopickOn = !isAutopickOn
        toggleAutopickOnOffEl.textContent = isAutopickOn ? "ON" : "OFF"
        toggleAutopickButtonEl.classList.toggle("toggle-on", isAutopickOn)
        toggleAutopickButtonEl.classList.toggle("toggle-off", !isAutopickOn)
    })

    // Set Autopicker Buttons
    nextAutopickRedEl.addEventListener("click", () => setAutopicker("red"))
    nextAutopickBlueEl.addEventListener("click",() => setAutopicker("blue"))

    // Current Picker
    currentPickerRedEl.addEventListener("click", () => updateCurrentPicker("red"))
    currentPickerBlueEl.addEventListener("click", () => updateCurrentPicker("blue"))
    currentPickerNoneEl.addEventListener("click", () => updateCurrentPicker("none"))
    currentPickerNoneEl.click()

    // Ban Pick Management
    banPickManagementSelectActionEl.addEventListener("click", setBanPickAction)
})

// Setting current picker
const currentPickerTextEl = document.getElementById("current-picker-text")
const currentPickerRedEl = document.getElementById("current-picker-red")
const currentPickerBlueEl = document.getElementById("current-picker-blue")
const currentPickerNoneEl = document.getElementById("current-picker-none")
function updateCurrentPicker(side) {
    currentPickerTextEl.textContent = side
    document.cookie = `currentPicker=${side}; path=/`
}

// Set Autopicker
function setAutopicker(picker) {
    currentPicker = picker
    nextAutopickNextEl.textContent = `${currentPicker.substring(0, 1).toUpperCase()}${currentPicker.substring(1)}`
}


// Set Ban Pick Action
const banPickManagementEl = document.getElementById("ban-pick-management")
const banPickManagementSelectActionEl = document.getElementById("ban-pick-management-select-action")
let currentAction
function setBanPickAction() {
    currentAction = banPickManagementSelectActionEl.value
    currentBanContainer = undefined
    // currentPickTeam = undefined
    currentBanTeam = undefined
    sidebarButtonBeatmap = undefined

    while (banPickManagementEl.childElementCount > 3) {
        banPickManagementEl.lastElementChild.remove()
    }

    // Protects
    if (currentAction === "setProtect" || currentAction === "removeProtect") {
        makeSidebarText("Which Team?")

        // Which Team Select
        const whichTeamSelect = document.createElement("select")
        whichTeamSelect.setAttribute("id", "which-ban-select")
        whichTeamSelect.classList.add("ban-pick-management-select")
        whichTeamSelect.addEventListener("change", event => setProtectContainer(event.currentTarget))

        // Which Team Select Options
        whichTeamSelect.append(
            makeTeamProtectOption("red"),
            makeTeamProtectOption("blue")
        )
        whichTeamSelect.setAttribute("size", whichTeamSelect.childElementCount)
        banPickManagementEl.append(whichTeamSelect)

        if (whichTeamSelect.options.length > 0) {
            whichTeamSelect.selectedIndex = 0
            whichTeamSelect.dispatchEvent(new window.Event("change"))
        }

        if (currentAction === "setProtect") makeTeamAddMaps()
    }

    // Bans
    if (currentAction === "setBan" || currentAction === "removeBan") {
        makeSidebarText("Which Team?")

        // Which Team Select
        const whichTeamSelect = document.createElement("select")
        whichTeamSelect.setAttribute("id", "which-ban-select")
        whichTeamSelect.classList.add("ban-pick-management-select")
        whichTeamSelect.addEventListener("change", event => setBanContainer(event.currentTarget))

        // Which Team Select Options
        let noOfBans = 0
        while (noOfBans < banCount) {
            whichTeamSelect.append(
                makeTeamBanOption("red", noOfBans + 1),
                makeTeamBanOption("blue", noOfBans + 1)
            )
            noOfBans++
        }
        whichTeamSelect.setAttribute("size", whichTeamSelect.childElementCount)
        banPickManagementEl.append(whichTeamSelect)

        if (whichTeamSelect.options.length > 0) {
            whichTeamSelect.selectedIndex = 0
            whichTeamSelect.dispatchEvent(new window.Event("change"))
        }

        if (currentAction === "setBan") makeTeamAddMaps()
    }

    // Picks / Winner
    if (currentAction === "setPick" || currentAction === "removePick" || currentAction === "setWinner" || currentAction === "removeWinner") {
        makeSidebarText("Which Pick?")

        // Which pick?
        const whichPickSelect = document.createElement("div")
        whichPickSelect.classList.add("which-map-select")

        // Which Map Select
        makeTeamPickButton(whichPickSelect)
        banPickManagementEl.append(whichPickSelect)

        // Set Pick
        if (currentAction === "setPick") {
            makeTeamAddMaps()
            whichTeamSelect("Which Team Pick?")
        }

        // Set Winner
        if (currentAction === "setWinner") whichTeamSelect("Which Team Won?")
    }

    // Apply changes button
    const applyChangesButton = document.createElement("button")
    applyChangesButton.classList.add("sidebar-button", "full-size-button", "apply-changes-button")
    applyChangesButton.textContent = "Apply Changes"

    // Apply changes clicks
    switch (currentAction) {
        case "setProtect": applyChangesButton.addEventListener("click", sidebarSetProtectAction); break;
        case "removeProtect": applyChangesButton.addEventListener("click", sidebarRemoveProtectAction); break;
        case "setBan": applyChangesButton.addEventListener("click", sidebarSetBanAction); break;
        case "removeBan": applyChangesButton.addEventListener("click", sidebarRemoveBanAction); break;
        case "setPick": applyChangesButton.addEventListener("click", sidebarSetPickAction); break;
        case "removePick": applyChangesButton.addEventListener("click", sidebarRemovePickAction); break;
        case "setWinner": applyChangesButton.addEventListener("click", sidebarSetWinnerAction); break;
        case "removeWinner": applyChangesButton.addEventListener("click", sidebarRemoveWinnerAction); break;
    }
    banPickManagementEl.append(applyChangesButton)

}

// Make sidebar text
function makeSidebarText(text) {
    const h2 = document.createElement("h2")
    h2.textContent = text
    banPickManagementEl.append(h2)
}

// Team Protect Options
function makeTeamProtectOption(team) {
    const selectOptionBan = document.createElement("option")
    selectOptionBan.setAttribute("value", `${team}`)
    selectOptionBan.innerText = `${team.substring(0, 1).toUpperCase()}${team.substring(1)} Protect`
    return selectOptionBan
}

// Team Ban Options
function makeTeamBanOption(team, number) {
    const selectOptionBan = document.createElement("option")
    selectOptionBan.setAttribute("value", `${team}|${number}`)
    selectOptionBan.innerText = `${team.substring(0, 1).toUpperCase()}${team.substring(1)} Ban ${number}`
    return selectOptionBan
}

// Team Select Options
function makeTeamSelectOption(team) {
    const selectOptionTeam = document.createElement("option")
    selectOptionTeam.setAttribute("value", team)
    selectOptionTeam.innerText = `${team.substring(0, 1).toUpperCase()}${team.substring(1)}`
    return selectOptionTeam
}

// Team Pick Button
function makeTeamPickButton(whichPickSelect) {
    for (let i = 0; i < bestOf; i++) {
        // Which Map Button
        whichTeamButtonCreate(i, whichPickSelect)
    }
}

// Which Pick Button Create
function whichTeamButtonCreate(i, whichPickSelect) {
    const whichPickButton = document.createElement("button")
    whichPickButton.classList.add("which-side-button", "which-pick-button")
    whichPickButton.innerText = `Pick ${i + 1}`
    whichPickButton.addEventListener("click", event => setSidebarPick(event.currentTarget))
    whichPickButton.dataset.pickNumber = i + 1
    whichPickSelect.append(whichPickButton)
}

// Selected Option BG Colour
const selectedBGColour = "#CECECE"

// Set sidebar pick
const whichPickButtons = document.getElementsByClassName("which-pick-button")
let sidebarButtonPickNumber
function setSidebarPick(element) {
    sidebarButtonPickNumber = element.dataset.pickNumber

    for (let i = 0; i < whichPickButtons.length; i++) {
        whichPickButtons[i].style.backgroundColor = "transparent"
        whichPickButtons[i].style.color = "unset"
    }

    element.style.backgroundColor = selectedBGColour
    element.style.color = "black"
    setPickContainer(element)
}

// Which Team Select
function whichTeamSelect(text) {
    // Which team?
    makeSidebarText(text)

    // Which Team Select
    const whichTeamSelect = document.createElement("select")
    whichTeamSelect.setAttribute("id", "which-team-select")
    whichTeamSelect.classList.add("ban-pick-management-select")
    whichTeamSelect.setAttribute("size", 2)

    // Which Team Select Options
    whichTeamSelect.append(makeTeamSelectOption("red"), makeTeamSelectOption("blue"))
    banPickManagementEl.append(whichTeamSelect)
}

// Set Protect Container
let currentProtectTeam, currentProtectContainer
function setProtectContainer(element) {
    currentProtectTeam = element.value
    if (currentProtectTeam === "red") currentProtectContainer = teamRedProtectContainerEl.children[0]
    else currentProtectContainer = teamBlueProtectContainerEl.children[0]
}

// Add Ban Container
let currentBanContainer, currentBanTeam
function setBanContainer(element) {
    const currentBanElements = element.value.split("|")
    currentBanTeam = currentBanElements[0]
    if (currentBanTeam === "red") currentBanContainer = teamRedBanContainerEl.children[currentBanElements[1] - 1]
    else currentBanContainer = teamBlueBanContainerEl.children[currentBanElements[1] - 1]
}

// Set Pick Container
// let currentPickContainer
// let currentPickTeam
function setPickContainer(element) {
    const currentPickElement = element
    console.log(currentPickElement)
    // currentPickTeam = currentPickElement.dataset.side
    // if (currentPickTeam === "red") currentPickContainer = pickContainer.querySelectorAll(".red-pick-container")[Number(currentPickElement.dataset.pickNumber) - 1]
    // else if (currentPickTeam === "blue") currentPickContainer = blueChoiceContainerEl.querySelectorAll(".blue-pick-container")[Number(currentPickElement.dataset.pickNumber) - 1]
    // else if (currentPickTeam === "TB") currentPickContainer = tiebreakerPickContainerEl
}

// Team Add maps
function makeTeamAddMaps() {
    // Which map?
    makeSidebarText("Which Map?")

    // Which Map Select
    const whichMapSelect = document.createElement("div")
    whichMapSelect.classList.add("which-map-select")
    for (let i = 0; i < allBeatmaps.length; i++) {
        // Which Map Button
        const currentMap = allBeatmaps[i]
        const whichMapButton = document.createElement("button")
        whichMapButton.classList.add("which-side-button", "which-map-button")
        whichMapButton.innerText = `${currentMap.mod}${currentMap.order}`
        whichMapButton.addEventListener("click", event => setSidebarBeatmap(event.currentTarget))
        whichMapButton.dataset.id = currentMap.beatmap_id
        whichMapSelect.append(whichMapButton)
    }
    banPickManagementEl.append(whichMapSelect)
}

// Set sidebar beatmap
const whichMapButtons = document.getElementsByClassName("which-map-button")
let sidebarButtonBeatmap
function setSidebarBeatmap(element) {
    sidebarButtonBeatmap = element.dataset.id
    for (let i = 0; i < whichMapButtons.length; i++) {
        whichMapButtons[i].style.backgroundColor = "transparent"
        whichMapButtons[i].style.color = "unset"
    }
    element.style.backgroundColor = selectedBGColour
    element.style.color = "black"
}

// Sidebar Set Protect Action
function sidebarSetProtectAction() {
    if (!currentProtectContainer || !sidebarButtonBeatmap) return
    const currentMap = findBeatmap(sidebarButtonBeatmap)
    setSideMapDetails(currentProtectContainer, currentMap, "protect")
}

// Sidebar Set Ban Action
function sidebarSetBanAction() {
    if (!currentBanContainer || !sidebarButtonBeatmap) return
    const currentMap = findBeatmap(sidebarButtonBeatmap)
    setSideMapDetails(currentBanContainer, currentMap, "banned")
}

// Sidebar Remove Ban Action
function sidebarRemoveProtectAction() { 
    if (!currentProtectContainer) return

    // Remove details
    currentProtectContainer.removeAttribute("data-id")
    currentProtectContainer.style.display = "none"
}

// Sidebar Remove Ban Action
function sidebarRemoveBanAction() { 
    if (!currentBanContainer) return

    // Remove details
    currentBanContainer.removeAttribute("data-id")
    currentBanContainer.style.display = "none"
}

function sidebarSetPickAction() {
    if (!sidebarButtonPickNumber || !sidebarButtonBeatmap || !document.getElementById("which-team-select").value) return
    const currentMap = findBeatmap(sidebarButtonBeatmap)
    const currentTile = pickContainerEl.children[sidebarButtonPickNumber - 1]
    const team = document.getElementById("which-team-select").value
    currentTile.style.display = "block"
    currentTile.dataset.id = currentMap.beatmap_id
    currentTile.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
    currentTile.children[0].setAttribute("src", `../_shared/assets/category-images/${currentMap.mod.toUpperCase()}${currentMap.order}.png`)
    currentTile.children[3].setAttribute("src", `static/pick-bgs/${currentMap.mod === "TB" ? "TB" : team}-pick-bg.png`)
    currentTile.children[4].textContent = `${currentMap.mod === "TB" ? "TB" : team.toUpperCase()} PICK`
}

// Sidebar Remove Ban / Pick Action functions
function sidebarRemovePickAction() {
    if (!sidebarButtonPickNumber) return
    const currentTile = pickContainerEl.children[sidebarButtonPickNumber - 1]
    currentTile.style.display = "none"
    currentTile.removeAttribute("data-id")
    currentTile.style.backgroundImage = `unset`
    currentTile.children[0].removeAttribute("src")
    currentTile.children[3].removeAttribute("src")
    currentTile.children[4].textContent = ""
}

// Sidebar Set Winner Action
function sidebarSetWinnerAction() {
    if (!sidebarButtonPickNumber) return
    const currentTile = pickContainerEl.children[sidebarButtonPickNumber - 1]
    const team = document.getElementById("which-team-select").value

    currentTile.children[2].style.display = "block"
    currentTile.children[2].setAttribute("src", `../_shared/assets/winner-crowns/winner-${team}-map.png`)
}

// Sidebar Remove Winner Action
function sidebarRemoveWinnerAction() {
    if (!sidebarButtonPickNumber) return
    const currentTile = pickContainerEl.children[sidebarButtonPickNumber - 1]
    currentTile.children[2].style.display = "none"
    currentTile.children[2].removeAttribute("src")
}

// Read mappool data
setInterval(() => {
    const currentPicks = [...pickContainerEl.children].map(child => child.dataset.id).join(",")
    const currentPickers = [...pickContainerEl.children].map(child => child.children[4].textContent.split(" ")[0].toLowerCase()).join(",")
    const currentWinners = [...pickContainerEl.children].map(child => {
        return child.children[2].getAttribute("src").includes("red") ? "red" :
        child.children[2].getAttribute("src").includes("blue") ? "blue" : ""
    }).join(",")

    document.cookie = `currentPicks=${currentPicks}; path=/`
    document.cookie = `currentPickers=${currentPickers}; path=/`
    document.cookie = `currentWinners=${currentWinners}; path=/`
}, 200)