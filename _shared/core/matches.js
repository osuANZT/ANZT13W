let allMatches = []

// Load matches
export async function loadMatches() {
    const response = await axios.get("../_data/matches.json")
    allMatches = response.data
    return allMatches
}

// Find match based on id
export async function findMatch(id) {
    return allMatches.find(m => Number(m.id) === Number(id))
}