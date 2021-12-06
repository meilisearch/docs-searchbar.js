

 /*~ This declaration specifies that the class constructor function
  *~ is the exported object from the file
  */

 export type DocsParams = {
  hostUrl: string
  apiKey: string
  indexUid: string
  inputSelector: string
  debug?: boolean,
  meilisearchOptions?: Record<string,any>,
  queryDataCallback?: any,
  autocompleteOptions?: Record<string,any>,
  transformData?: Function
  queryHook?: boolean,
  handleSelected?: Function,
  enhancedSearchInput?: boolean,
  layout?: string,
  enableDarkMode?: boolean | 'auto',
}
/*~ Write your module's methods and properties in this class */
declare function docsSearchBar(docsParams: DocsParams): void;

export { docsSearchBar }
export default docsSearchBar;

