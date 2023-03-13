/* eslint camelcase: ["off"] */

import { SearchResponse, SearchParams, Hits, Config } from 'meilisearch'

interface HitResponse {
  anchor: string
  content: string
  hierarchy_lvl0: string | null
  hierarchy_lvl1: string | null
  hierarchy_lvl2: string | null
  hierarchy_lvl3: string | null
  hierarchy_lvl4: string | null
  hierarchy_lvl5: string | null
  hierarchy_lvl6: string | null
  objectID: string
  url: string
  [key: string]: unknown
}

interface DefaultFormattedHit {
  isLvl0: boolean
  isLvl1: boolean
  isLbl2: boolean
  isLvl1EmptyOrDuplicate: boolean
  isCategoryHeader: boolean
  isSubCategoryHeader: boolean
  isTextOrSubcategoryNonEmpty: boolean
  subcategory: string | null
  text: string | null
  title: string | null
  url: string | null
}

interface AutoCompleteInput {
  open: () => void
  close: () => void
  destroy: () => void
  getWrapper: () => Element
  getVal: () => string
  setVal: (val: string) => void
}

interface Options<FormattedHit = DefaultFormattedHit> {
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
  transformData?: (hits: Hits<HitResponse>) => Hits<FormattedHit>
  queryHook?: (query: string) => string
  handleSelected?: (
    input: AutoCompleteInput,
    event: Event,
    suggestion: FormattedHit,
    datasetNumber: number,
    context: {
      selectionMethod: 'click' | 'blur' | 'enterKey' | 'tabKey' | string
    },
  ) => void
  enhancedSearchInput?: boolean
  layout?: 'column' | 'simple'
  enableDarkMode?: boolean | 'auto'
  clientAgents?: Config['clientAgents']
}

declare class DocsSearchBar<FormattedHit> {
  constructor(options: Options<FormattedHit>)
}

declare global {
  interface Window {
    docsSearchBar: <FormattedHit = DefaultFormattedHit>(
      options: Options<FormattedHit>,
    ) => void
  }
}

export default function docsSearchBar<FormattedHit = DefaultFormattedHit>(
  options: Options<FormattedHit>,
): DocsSearchBar<FormattedHit>
