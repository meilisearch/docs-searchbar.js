import autocomplete from 'autocomplete.js'
import templates from './templates'
import utils from './utils'
import $ from './zepto'
import { MeiliSearch } from 'meilisearch'

/**
 * Adds an autocomplete dropdown to an input field
 * @function DocsSearchBar
 * @param  {string}            options.hostUrl               URL where Meilisearch instance is hosted
 * @param  {string}            options.apiKey                Read-only API key
 * @param  {string}            options.indexUid              UID of the index to target
 * @param  {string}            options.inputSelector         CSS selector that targets the input
 * @param  {boolean}           [options.debug]               When set to true, the dropdown will not be closed on blur
 * @param  {Object}            [options.meilisearchOptions]  Options to pass the underlying Meilisearch client
 * @param  {function}          [options.queryDataCallback]   This function will be called when querying Meilisearch
 * @param  {Object}            [options.autocompleteOptions] Options to pass to the underlying autocomplete instance
 * @param  {function}          [options.transformData]       An optional function to transform the hits
 * @param  {function}          [options.queryHook]           An optional function to transform the query
 * @param  {function}          [options.handleSelected]      This function is called when a suggestion is selected
 * @param  {function}          [options.enhancedSearchInput] When set to true, a theme is applied to the search box to improve its appearance
 * @param  {'column'|'simple'} [options.layout]              Layout of the search bar
 * @param  {boolean|'auto'}    [options.enableDarkMode]      Allows you to enforce, light theme, dark theme, or auto mode on the searchbar.
 * @return {Object}
 */
const usage = `Usage:
  documentationSearch({
  hostUrl,
  apiKey,
  indexUid,
  inputSelector,
  [ debug ],
  [ meilisearchOptions ],
  [ queryDataCallback ],
  [ autocompleteOptions ],
  [ transformData ],
  [ queryHook ],
  [ handleSelected ],
  [ enhancedSearchInput ],
  [ layout ],
  [ enableDarkMode ]
})`
class DocsSearchBar {
  constructor({
    hostUrl,
    apiKey,
    indexUid,
    inputSelector,
    debug = false,
    meilisearchOptions = {},
    queryDataCallback = null,
    autocompleteOptions = {},
    transformData = false,
    queryHook = false,
    handleSelected = false,
    enhancedSearchInput = false,
    layout = 'columns',
    enableDarkMode = false,
  }) {
    DocsSearchBar.checkArguments({
      hostUrl,
      apiKey,
      indexUid,
      inputSelector,
      debug,
      meilisearchOptions,
      queryDataCallback,
      autocompleteOptions,
      transformData,
      queryHook,
      handleSelected,
      enhancedSearchInput,
      layout,
      enableDarkMode,
    })

    this.apiKey = apiKey
    this.hostUrl = hostUrl
    this.indexUid = indexUid
    this.input = DocsSearchBar.getInputFromSelector(inputSelector)
    this.meilisearchOptions = {
      limit: 5,
      attributesToHighlight: ['*'],
      attributesToCrop: ['content'],
      cropLength: 30,
      ...meilisearchOptions,
    }
    this.queryDataCallback = queryDataCallback || null
    this.autocompleteOptions = {
      debug,
      hint: false,
      autoselect: true,
      ...autocompleteOptions,
    }
    const inputAriaLabel =
      this.input &&
      typeof this.input.attr === 'function' &&
      this.input.attr('aria-label')
    this.autocompleteOptions.ariaLabel =
      this.autocompleteOptions.ariaLabel || inputAriaLabel || 'search input'
    this.autocompleteOptions.cssClasses =
      this.autocompleteOptions.cssClasses || {}
    this.autocompleteOptions.cssClasses.prefix =
      this.autocompleteOptions.cssClasses.prefix || 'dsb'
    this.autocompleteOptions.cssClasses.root =
      this.autocompleteOptions.cssClasses.root || 'meilisearch-autocomplete'
    this.autocompleteOptions.keyboardShortcuts =
      this.parseHotkeysAutocompleteOptions(
        this.autocompleteOptions.keyboardShortcuts,
      ) || ['s', 191]

    this.isSimpleLayout = layout === 'simple'
    this.enableDarkMode = enableDarkMode

    this.client = new MeiliSearch({
      host: hostUrl,
      apiKey: this.apiKey,
    })

    DocsSearchBar.addThemeWrapper(inputSelector, this.enableDarkMode)

    if (enhancedSearchInput) {
      this.input = DocsSearchBar.injectSearchBox(this.input)
    }

    this.autocomplete = autocomplete(this.input, this.autocompleteOptions, [
      {
        source: this.getAutocompleteSource(transformData, queryHook),
        templates: {
          suggestion: DocsSearchBar.getSuggestionTemplate(this.isSimpleLayout),
          footer: templates.footer,
          empty: DocsSearchBar.getEmptyTemplate(),
        },
      },
    ])

    // We remove the inline styles of the wrapper element for left / right
    $(`.${this.autocompleteOptions.cssClasses.root} > [role='listbox']`).css({
      left: false,
      right: false,
    })

    const customHandleSelected = handleSelected
    this.handleSelected = customHandleSelected || this.handleSelected

    // We prevent default link clicking if a custom handleSelected is defined
    if (customHandleSelected) {
      $('.meilisearch-autocomplete').on(
        'click',
        `.${this.autocompleteOptions.cssClasses.prefix}-suggestions a`,
        (event) => {
          event.preventDefault()
        },
      )
    }

    this.autocomplete.on(
      'autocomplete:selected',
      this.handleSelected.bind(null, this.autocomplete.autocomplete),
    )

    this.autocomplete.on(
      'autocomplete:shown',
      this.handleShown.bind(null, this.input),
    )

    if (enhancedSearchInput) {
      DocsSearchBar.bindSearchBoxEvent()
    }
  }

  /**
   * Wraps input selector in a docs-searchbar-js div
   * @function addThemeWrapper
   * @param  {string} inputSelector Selector of the input element
   * @param  {boolean|'auto'} enableDarkMode Allows you to enforce, light theme, dark theme, or auto mode on the searchbar.
   * @returns {void}
   */
  static addThemeWrapper(inputSelector, enableDarkMode) {
    const inputElement = document.querySelector(inputSelector)
    const parent = inputElement.parentNode
    const wrapper = document.createElement('div')
    wrapper.className += 'docs-searchbar-js'
    parent.replaceChild(wrapper, inputElement)
    wrapper.appendChild(inputElement)

    let isSystemInDarkMode = Boolean(enableDarkMode)
    if (enableDarkMode === 'auto' && window.matchMedia) {
      const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
      isSystemInDarkMode = mediaQueryList.matches

      const listener = function (e) {
        if (document.body.contains(wrapper)) {
          wrapper.setAttribute('data-ds-theme', e.matches ? 'dark' : 'light')
        } else if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener('change', listener)
        } else if (mediaQueryList.removeListener) {
          mediaQueryList.removeListener(listener)
        }
      }

      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', listener)
      } else if (mediaQueryList.addListener) {
        mediaQueryList.addListener(listener)
      }
    }
    wrapper.setAttribute('data-ds-theme', isSystemInDarkMode ? 'dark' : 'light')
  }

  /**
   * Checks that the passed arguments are valid. Will throw errors otherwise
   * @function checkArguments
   * @param  {object} args Arguments as an option object
   * @returns {void}
   */
  static checkArguments(args) {
    if (!args.inputSelector || !args.indexUid || !args.hostUrl) {
      throw new Error(usage)
    }

    if (typeof args.inputSelector !== 'string') {
      throw new Error(
        `Error: inputSelector:${args.inputSelector}  must be a string. Each selector must match only one element and separated by ','`,
      )
    }

    if (!DocsSearchBar.getInputFromSelector(args.inputSelector)) {
      throw new Error(
        `Error: No input element in the page matches ${args.inputSelector}`,
      )
    }

    DocsSearchBar.typeCheck(
      args,
      ['meilisearchOptions', 'autocompleteOptions'],
      'object',
      true,
    )

    if (
      args.enableDarkMode !== 'auto' &&
      args.enableDarkMode !== false &&
      args.enableDarkMode !== true
    ) {
      throw new Error(
        `Error: "enableDarkMode" must be either true, false, or 'auto'. Supplied value: ${args.enableDarkMode}`,
      )
    }

    DocsSearchBar.typeCheck(
      args,
      ['debug', 'enhancedSearchInput'],
      'boolean',
      false,
    )

    DocsSearchBar.typeCheck(
      args,
      ['queryDataCallback', 'transformData', 'queryHook', 'handleSelected'],
      'function',
      true,
    )

    if (args.layout && !['simple', 'columns'].includes(args.layout)) {
      throw new Error(
        `Error: "layout" must be either 'columns' or 'simple'. Supplied value: ${args.layout}`,
      )
    }
  }

  /**
   * Checks if the arguments defined in the check variable are of the supplied
   * type
   * @param {any[]} args all arguments
   * @param {string[]} checkArguments array with the argument names to check
   * @param {string} type required type for the arguments
   * @param {boolean} optional don't check argument if it's falsy
   * @returns {void}
   */
  static typeCheck(args, checkArguments, type, optional) {
    checkArguments
      .filter((argument) => !optional || args[argument])
      .forEach((argument) => {
        const value = args[argument]
        if (typeof args[argument] !== type) {
          throw new Error(
            `Error: "${argument}" must be of type: ${type}. Found type: ${typeof value}`,
          )
        }
      })
  }

  static injectSearchBox(input) {
    input.before(templates.searchBox)
    const newInput = input.prev().prev().find('input')
    input.remove()
    return newInput
  }

  static bindSearchBoxEvent() {
    $('.searchbox [type="reset"]').on('click', function () {
      $('input#docs-searchbar').focus()
      $(this).addClass('hide')
      autocomplete.autocomplete.setVal('')
    })

    $('input#docs-searchbar').on('keyup', () => {
      const searchbox = document.querySelector('input#docs-searchbar')
      const reset = document.querySelector('.searchbox [type="reset"]')
      reset.className = 'searchbox__reset'
      if (searchbox.value.length === 0) {
        reset.className += ' hide'
      }
    })
  }

  /**
   * Returns the matching input from a CSS selector, null if none matches
   * @function getInputFromSelector
   * @param  {string} selector CSS selector that matches the search
   * input of the page
   * @returns {void}
   */
  static getInputFromSelector(selector) {
    const input = $(selector).filter('input')
    return input.length ? $(input[0]) : null
  }

  /**
   * Returns the `source` method to be passed to autocomplete.js. It will query
   * the Meilisearch index and call the callbacks with the formatted hits.
   * @function getAutocompleteSource
   * @param  {function} transformData An optional function to transform the hits
   * @param {function} queryHook An optional function to transform the query
   * @returns {function} Method to be passed as the `source` option of
   * autocomplete
   */
  getAutocompleteSource(transformData, queryHook) {
    return (query, callback) => {
      if (queryHook) {
        // eslint-disable-next-line no-param-reassign
        query = queryHook(query) || query
      }

      this.client
        .index(this.indexUid)
        .search(query, this.meilisearchOptions)
        .then((data) => {
          if (
            this.queryDataCallback &&
            typeof this.queryDataCallback === 'function'
          ) {
            this.queryDataCallback(data)
          }
          let hits = data.hits
          if (transformData) {
            hits = transformData(hits) || hits
          }
          callback(DocsSearchBar.formatHits(hits))
        })
    }
  }

  // Given a list of hits returned by the API, will reformat them to be used in
  // a template
  static formatHits(receivedHits) {
    const clonedHits = utils.deepClone(receivedHits)
    const hits = clonedHits.map((hit) => {
      if (hit._formatted) {
        const cleanFormatted = utils.replaceNullString(hit._formatted)
        // eslint-disable-next-line no-param-reassign
        hit._formatted = utils.renameKeysWithLevels(
          cleanFormatted,
          'hierarchy_',
        )
      }
      const cleanHit = utils.replaceNullString(hit)
      return utils.renameKeysWithLevels(cleanHit, 'hierarchy_')
    })

    // Group hits by category / subcategory
    let groupedHits = utils.groupBy(hits, 'lvl0')
    $.each(groupedHits, (level, collection) => {
      const groupedHitsByLvl1 = utils.groupBy(collection, 'lvl1')
      const flattenedHits = utils.flattenAndFlagFirst(
        groupedHitsByLvl1,
        'isSubCategoryHeader',
      )
      groupedHits[level] = flattenedHits
    })
    groupedHits = utils.flattenAndFlagFirst(groupedHits, 'isCategoryHeader')
    // Translate hits into smaller objects to be send to the template
    return groupedHits.map((hit) => {
      const url = DocsSearchBar.formatURL(hit)
      const category = utils.getHighlightedValue(hit, 'lvl0')
      const subcategory = utils.getHighlightedValue(hit, 'lvl1') || category
      const displayTitle = utils
        .compact([
          utils.getHighlightedValue(hit, 'lvl2') || subcategory,
          utils.getHighlightedValue(hit, 'lvl3'),
          utils.getHighlightedValue(hit, 'lvl4'),
          utils.getHighlightedValue(hit, 'lvl5'),
          utils.getHighlightedValue(hit, 'lvl6'),
        ])
        .join(
          '<span class="aa-suggestion-title-separator" aria-hidden="true"> › </span>',
        )
      const text = utils.getSnippetedValue(hit, 'content')
      const isTextOrSubcategoryNonEmpty =
        (subcategory && subcategory !== '') ||
        (displayTitle && displayTitle !== '')
      const isLvl1EmptyOrDuplicate =
        !subcategory || subcategory === '' || subcategory === category
      const isLvl2 =
        displayTitle && displayTitle !== '' && displayTitle !== subcategory
      const isLvl1 =
        !isLvl2 && subcategory && subcategory !== '' && subcategory !== category
      const isLvl0 = !isLvl1 && !isLvl2

      return {
        isLvl0,
        isLvl1,
        isLvl2,
        isLvl1EmptyOrDuplicate,
        isCategoryHeader: hit.isCategoryHeader,
        isSubCategoryHeader: hit.isSubCategoryHeader,
        isTextOrSubcategoryNonEmpty,
        category,
        subcategory,
        title: displayTitle,
        text,
        url,
      }
    })
  }

  static formatURL(hit) {
    const { url, anchor } = hit
    if (url) {
      const containsAnchor = url.indexOf('#') !== -1
      if (containsAnchor) return url
      else if (anchor) return `${hit.url}#${hit.anchor}`
      return url
    } else if (anchor) return `#${hit.anchor}`
    console.warn('no anchor nor url for : ', JSON.stringify(hit))
    return null
  }

  static getEmptyTemplate() {
    return templates.empty
  }

  static getSuggestionTemplate(isSimpleLayout) {
    return isSimpleLayout ? templates.suggestionSimple : templates.suggestion
  }

  handleSelected(input, event, suggestion, datasetNumber, context = {}) {
    // Do nothing if click on the suggestion, as it's already a <a href>, the
    // browser will take care of it. This allow Ctrl-Clicking on results and not
    // having the main window being redirected as well
    if (context.selectionMethod === 'click') {
      return
    }

    input.setVal('')
    window.location.assign(suggestion.url)
  }

  handleShown(input) {
    const middleOfInput = input.offset().left + input.width() / 2
    let middleOfWindow = $(document).width() / 2

    if (isNaN(middleOfWindow)) {
      middleOfWindow = 900
    }

    const alignClass =
      middleOfInput - middleOfWindow >= 0
        ? 'meilisearch-autocomplete-right'
        : 'meilisearch-autocomplete-left'
    const otherAlignClass =
      middleOfInput - middleOfWindow < 0
        ? 'meilisearch-autocomplete-right'
        : 'meilisearch-autocomplete-left'
    const autocompleteWrapper = $('.meilisearch-autocomplete')
    if (!autocompleteWrapper.hasClass(alignClass)) {
      autocompleteWrapper.addClass(alignClass)
    }

    if (autocompleteWrapper.hasClass(otherAlignClass)) {
      autocompleteWrapper.removeClass(otherAlignClass)
    }
  }

  parseHotkeysAutocompleteOptions(hotkeys) {
    if (hotkeys === undefined || hotkeys === null) {
      return null
    }
    return hotkeys.map((item) => (item === '/' ? 191 : item))
  }
}

export default DocsSearchBar
