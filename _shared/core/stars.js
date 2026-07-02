import { getCookie, delay } from "../core/utils.js"

let redStarCount = 0
let blueStarCount = 0
let totalBestOf = 0
let firstTo = 0

// Toggle stars
export function toggleStars(buttonText, button, redTeamStarContainerEl, blueTeamStarContainerEl) {
    let isOn = buttonText.textContent.trim().toLowerCase() === "on"
    buttonText.textContent = isOn ? "OFF" : "ON"

    button.classList.toggle("toggle-on", !isOn)
    button.classList.toggle("toggle-off", isOn)

    isOn = buttonText.textContent.trim().toLowerCase() === "on"
    document.cookie = `toggleStarContainers=${isOn}; path=/`

    toggleStarContainers(redTeamStarContainerEl, blueTeamStarContainerEl)
    renderStars(redTeamStarContainerEl, blueTeamStarContainerEl)
}

export function updateStarCount(side, action, redTeamStarContainerEl, blueTeamStarContainerEl, redTeamName, blueTeamName) {
    // Update star count
    if (side === "red" && action === "plus") redStarCount++
    else if (side === "red" && action === "minus") redStarCount--
    else if (side === "blue" && action === "plus") blueStarCount++
    else if (side === "blue" && action === "minus") blueStarCount--

    // Ensure star count is following restrictions
    if (redStarCount > firstTo) redStarCount = firstTo
    else if (redStarCount < 0) redStarCount = 0
    if (blueStarCount > firstTo) blueStarCount = firstTo
    else if (blueStarCount < 0) blueStarCount = 0

    saveStarCount()
    renderStars(redTeamStarContainerEl, blueTeamStarContainerEl)

    // Set winner details
    const currentWinner = redStarCount > blueStarCount ? redTeamName : blueStarCount > redStarCount ? blueTeamName : "none"
    document.cookie = `currentWinner=${currentWinner}; path=/`
}

// Save Star Count
function saveStarCount() {
    document.cookie = `redStarCount=${redStarCount}; path=/`
    document.cookie = `blueStarCount=${blueStarCount}; path=/`
    document.cookie = `totalBestOf=${totalBestOf}; path=/`
    document.cookie = `firstTo=${firstTo}; path=/`
}

// Set default star count
export function setDefaultStarCount(bestOf, redTeamStarContainerEl, blueTeamStarContainerEl) {
    redStarCount = 0
    blueStarCount = 0
    totalBestOf = bestOf
    firstTo = Math.ceil(totalBestOf / 2)
    saveStarCount()
    renderStars(redTeamStarContainerEl, blueTeamStarContainerEl)
}

// Display Stars
export function toggleStarContainers(redTeamStarContainerEl, blueTeamStarContainerEl) {
    const isOn = getCookie("toggleStarContainers")
    if (isOn === "true") {
        redTeamStarContainerEl.style.display = "flex"
        blueTeamStarContainerEl.style.display = "flex"
    } else {
        redTeamStarContainerEl.style.display = "none"
        blueTeamStarContainerEl.style.display = "none"
    }
}

// Get isStarOn
export function isStarOn() {
    return getCookie("toggleStarContainers") === "true"
}

// Set Star Count Display
export function renderStars(redTeamStarContainerEl, blueTeamStarContainerEl) {
    const renderStarCountRed = Number(getCookie("redStarCount"))
    const renderStarCountBlue = Number(getCookie("blueStarCount"))
    const renderFirstTo = Number(getCookie("firstTo"))

    redTeamStarContainerEl.innerHTML = ""
    blueTeamStarContainerEl.innerHTML = ""
    iterateStarImages(renderStarCountRed, redTeamStarContainerEl, renderFirstTo)
    iterateStarImages(renderStarCountBlue, blueTeamStarContainerEl, renderFirstTo)
}

function iterateStarImages(starCount, starContainer, firstTo) {
    let i = 0
    for (let i = 0; i < firstTo; i++) {
        starContainer.append(createStarImage(`${i < starCount ? "fill" : "empty"}`))
    }
}

function createStarImage(status) {
    const image = document.createElement("img")
    image.setAttribute("src", `../_shared/assets/points/point-${status}.png`)
    return image
}