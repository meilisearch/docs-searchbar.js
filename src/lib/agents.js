import version from './version'

export const constructClientAgents = (clientAgents = []) => {
  const instantMeilisearchAgent = `Meilisearch docs-searchbar.js (v${version})`

  return clientAgents.concat(instantMeilisearchAgent)
}
