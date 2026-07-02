let allTeams = []

// Load teams
export async function loadTeams() {
    const response = await axios.get("../_data/teams.json")
    allTeams = response.data
    return allTeams
}

// Find team
export async function findTeam(team_name) {
    return allTeams.find(t => t.team_name === team_name)
}