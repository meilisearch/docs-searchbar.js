import { SearchResponse, SearchParams, Hits, Config } from 'meilisearch'

interface Options {
  hostUrl: string
  apiKey: string
  indexUid: string
  inputSelector?: string
  inputElement?: Element
  debug?: boolean
  meilisearchOptions?: SearchParams
  queryDataCallback?: (data?: SearchResponse) => void
  autocompleteOptions?: {
    ariaLabel?: string
    cssClasses?: {
      prefix?: string
      root?: string
    }
    keyboardShortcuts?: (string | number)[]
  }
  transformData?: (hits: Hits) => Hits
  queryHook?: (query: unknown) => unknown
  handleSelected?: (input, event, suggestion, datasetNumber, context) => void
  enhancedSearchInput?: boolean
  layout?: 'column' | 'simple'
  enableDarkMode?: boolean | 'auto'
  clientAgents?: Config['clientAgents']
}

declare class DocsSearchBar {
  constructor(options: Options)
}

declare global {
  interface Window {
    docsSearchBar: (options: Options) => void
  }
}

export default DocsSearchBar
