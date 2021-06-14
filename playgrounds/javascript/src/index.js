import docsSearchBar from '../../../index'
import '../../../src/styles/main.scss'

docsSearchBar({
  // Test with MeiliSearch Documentation
  hostUrl: 'https://docs-search-bar.meilisearch.com',
  apiKey: 'd79226ae89f29d4dadba8d0c30c240e435f584fb83a7ae573b13eb62edec35cd',
  indexUid: 'docs',
  inputSelector: '#q',
  handleSelected(input, event, suggestion, datasetNumber, context) {
    console.info(input)
    console.info(event)
    console.info(suggestion)
    console.info(datasetNumber)
    console.info(context)
  },
  debug: true, // Set debug to true if you want to inspect the dropdown
  enhancedSearchInput: true,
  enableDarkMode: true,
})
