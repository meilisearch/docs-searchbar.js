import Hogan from 'hogan.js';
import autocomplete from 'autocomplete.js';
import Templates from './templates';
import utils from './utils';
import $ from './zepto';
import MeiliSearch from 'meilisearch';

/**
 * Adds an autocomplete dropdown to an input field
 * @function DocsSearchBar
 * @param  {string} options.hostUrl               URL where MeiliSearch instance is hosted
 * @param  {string} options.apiKey                Read-only API key
 * @param  {string} options.indexUid              UID of the index to target
 * @param  {string} options.inputSelector         CSS selector that targets the input
 * @param  {Object} [options.meilisearchOptions]  Options to pass the underlying MeiliSearch client
 * @param  {Object} [options.autocompleteOptions] Options to pass to the underlying autocomplete instance
 * @return {Object}
 */
const usage = `Usage:
  documentationSearch({
  hostUrl,
  apiKey,
  indexUid,
  inputSelector,
  [ meilisearchOptions ]
  [ autocompleteOptions ]
})`;
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
    });

    this.apiKey = apiKey;
    this.hostUrl = hostUrl;
    this.indexUid = indexUid;
    this.input = DocsSearchBar.getInputFromSelector(inputSelector);
    this.meilisearchOptions = {
      limit: 5,
      attributesToHighlight: ['*'],
      attributesToCrop: ['content'],
      cropLength: 30,
      ...meilisearchOptions,
    };
    this.queryDataCallback = queryDataCallback || null;
    this.autocompleteOptions = {
      debug,
      hint: false,
      autoselect: true,
      ...autocompleteOptions,
    };
    this.templates = new Templates(this.autocompleteOptions.templates || {});
    const inputAriaLabel =
      this.input &&
      typeof this.input.attr === 'function' &&
      this.input.attr('aria-label');
    this.autocompleteOptions.ariaLabel =
      this.autocompleteOptions.ariaLabel || inputAriaLabel || 'search input';
    this.autocompleteOptions.cssClasses =
      this.autocompleteOptions.cssClasses || {};
    this.autocompleteOptions.cssClasses.prefix =
      this.autocompleteOptions.cssClasses.prefix || 'dsb';
    this.autocompleteOptions.cssClasses.root =
      this.autocompleteOptions.cssClasses.root || 'meilisearch-autocomplete';
    this.autocompleteOptions.keyboardShortcuts = this.parseHotkeysAutocompleteOptions(
      this.autocompleteOptions.keyboardShortcuts
    ) || ['s', 191];

    this.isSimpleLayout = layout === 'simple';

    this.client = new MeiliSearch({
      host: hostUrl,
      apiKey: this.apiKey,
    });

    if (enhancedSearchInput) {
      this.input = DocsSearchBar.injectSearchBox(this.input, this.templates);
    }

    this.autocomplete = autocomplete(this.input, this.autocompleteOptions, [
      {
        source: this.getAutocompleteSource(transformData, queryHook),
        templates: {
          suggestion: DocsSearchBar.getSuggestionTemplate(
            this.isSimpleLayout,
            this.templates
          ),
          footer: this.templates.footer,
          empty: DocsSearchBar.getEmptyTemplate(this.templates),
        },
      },
    ]);

    const customHandleSelected = handleSelected;
    this.handleSelected = customHandleSelected || this.handleSelected;

    // We prevent default link clicking if a custom handleSelected is defined
    if (customHandleSelected) {
      $('.meilisearch-autocomplete').on(
        'click',
        `.${this.autocompleteOptions.cssClasses.prefix}-suggestions a`,
        (event) => {
          event.preventDefault();
        }
      );
    }

    this.autocomplete.on(
      'autocomplete:selected',
      this.handleSelected.bind(null, this.autocomplete.autocomplete)
    );

    this.autocomplete.on(
      'autocomplete:shown',
      this.handleShown.bind(null, this.input)
    );

    if (enhancedSearchInput) {
      DocsSearchBar.bindSearchBoxEvent();
    }
  }

  /**
   * Checks that the passed arguments are valid. Will throw errors otherwise
   * @function checkArguments
   * @param  {object} args Arguments as an option object
   * @returns {void}
   */
  static checkArguments(args) {
    if (!args.apiKey || !args.indexUid || !args.hostUrl) {
      throw new Error(usage);
    }

    if (typeof args.inputSelector !== 'string') {
      throw new Error(
        `Error: inputSelector:${args.inputSelector}  must be a string. Each selector must match only one element and separated by ','`
      );
    }

    if (!DocsSearchBar.getInputFromSelector(args.inputSelector)) {
      throw new Error(
        `Error: No input element in the page matches ${args.inputSelector}`
      );
    }
  }

  static injectSearchBox(input, templates) {
    input.before(templates.searchBox);
    const newInput = input.prev().prev().find('input');
    input.remove();
    return newInput;
  }

  static bindSearchBoxEvent() {
    $('.searchbox [type="reset"]').on('click', function () {
      $('input#docs-searchbar').focus();
      $(this).addClass('hide');
      autocomplete.autocomplete.setVal('');
    });

    $('input#docs-searchbar').on('keyup', () => {
      const searchbox = document.querySelector('input#docs-searchbar');
      const reset = document.querySelector('.searchbox [type="reset"]');
      reset.className = 'searchbox__reset';
      if (searchbox.value.length === 0) {
        reset.className += ' hide';
      }
    });
  }

  /**
   * Returns the matching input from a CSS selector, null if none matches
   * @function getInputFromSelector
   * @param  {string} selector CSS selector that matches the search
   * input of the page
   * @returns {void}
   */
  static getInputFromSelector(selector) {
    const input = $(selector).filter('input');
    return input.length ? $(input[0]) : null;
  }

  /**
   * Returns the `source` method to be passed to autocomplete.js. It will query
   * the MeiliSearch index and call the callbacks with the formatted hits.
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
        query = queryHook(query) || query;
      }

      this.client
        .getIndex(this.indexUid)
        .search(query, this.meilisearchOptions)
        .then((data) => {
          if (
            this.queryDataCallback &&
            typeof this.queryDataCallback === 'function'
          ) {
            this.queryDataCallback(data);
          }
          let hits = data.hits;
          if (transformData) {
            hits = transformData(hits) || hits;
          }
          callback(DocsSearchBar.formatHits(hits));
        });
    };
  }

  // Given a list of hits returned by the API, will reformat them to be used in
  // a Hogan template
  static formatHits(receivedHits) {
    const clonedHits = utils.deepClone(receivedHits);
    const hits = clonedHits.map((hit) => {
      if (hit._formatted) {
        const cleanFormatted = utils.replaceNullString(hit._formatted);
        // eslint-disable-next-line no-param-reassign
        hit._formatted = utils.renameKeysWithLevels(
          cleanFormatted,
          'hierarchy_'
        );
      }
      const cleanHit = utils.replaceNullString(hit);
      return utils.renameKeysWithLevels(cleanHit, 'hierarchy_');
    });

    // Group hits by category / subcategory
    let groupedHits = utils.groupBy(hits, 'lvl0');
    $.each(groupedHits, (level, collection) => {
      const groupedHitsByLvl1 = utils.groupBy(collection, 'lvl1');
      const flattenedHits = utils.flattenAndFlagFirst(
        groupedHitsByLvl1,
        'isSubCategoryHeader'
      );
      groupedHits[level] = flattenedHits;
    });
    groupedHits = utils.flattenAndFlagFirst(groupedHits, 'isCategoryHeader');

    // Translate hits into smaller objects to be send to the template
    return groupedHits.map((hit) => {
      const url = DocsSearchBar.formatURL(hit);
      const category = utils.getHighlightedValue(hit, 'lvl0');
      const subcategory = utils.getHighlightedValue(hit, 'lvl1') || category;
      const displayTitle = utils
        .compact([
          utils.getHighlightedValue(hit, 'lvl2') || subcategory,
          utils.getHighlightedValue(hit, 'lvl3'),
          utils.getHighlightedValue(hit, 'lvl4'),
          utils.getHighlightedValue(hit, 'lvl5'),
          utils.getHighlightedValue(hit, 'lvl6'),
        ])
        .join(
          '<span class="aa-suggestion-title-separator" aria-hidden="true"> › </span>'
        );
      const text = utils.getSnippetedValue(hit, 'content');
      const isTextOrSubcategoryNonEmpty =
        (subcategory && subcategory !== '') ||
        (displayTitle && displayTitle !== '');
      const isLvl1EmptyOrDuplicate =
        !subcategory || subcategory === '' || subcategory === category;
      const isLvl2 =
        displayTitle && displayTitle !== '' && displayTitle !== subcategory;
      const isLvl1 =
        !isLvl2 &&
        subcategory &&
        subcategory !== '' &&
        subcategory !== category;
      const isLvl0 = !isLvl1 && !isLvl2;

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
      };
    });
  }

  static formatURL(hit) {
    const { url, anchor } = hit;
    if (url) {
      const containsAnchor = url.indexOf('#') !== -1;
      if (containsAnchor) return url;
      else if (anchor) return `${hit.url}#${hit.anchor}`;
      return url;
    } else if (anchor) return `#${hit.anchor}`;
    console.warn('no anchor nor url for : ', JSON.stringify(hit));
    return null;
  }

  static getEmptyTemplate(templates) {
    return (args) => Hogan.compile(templates.empty).render(args);
  }

  static getSuggestionTemplate(isSimpleLayout, templates) {
    const stringTemplate = isSimpleLayout
      ? templates.suggestionSimple
      : templates.suggestion;
    const template = Hogan.compile(stringTemplate);
    return (suggestion) => template.render(suggestion);
  }

  handleSelected(input, event, suggestion, datasetNumber, context = {}) {
    // Do nothing if click on the suggestion, as it's already a <a href>, the
    // browser will take care of it. This allow Ctrl-Clicking on results and not
    // having the main window being redirected as well
    if (context.selectionMethod === 'click') {
      return;
    }

    input.setVal('');
    window.location.assign(suggestion.url);
  }

  handleShown(input) {
    const middleOfInput = input.offset().left + input.width() / 2;
    let middleOfWindow = $(document).width() / 2;

    if (isNaN(middleOfWindow)) {
      middleOfWindow = 900;
    }

    const alignClass =
      middleOfInput - middleOfWindow >= 0
        ? 'meilisearch-autocomplete-right'
        : 'meilisearch-autocomplete-left';
    const otherAlignClass =
      middleOfInput - middleOfWindow < 0
        ? 'meilisearch-autocomplete-right'
        : 'meilisearch-autocomplete-left';
    const autocompleteWrapper = $('.meilisearch-autocomplete');
    if (!autocompleteWrapper.hasClass(alignClass)) {
      autocompleteWrapper.addClass(alignClass);
    }

    if (autocompleteWrapper.hasClass(otherAlignClass)) {
      autocompleteWrapper.removeClass(otherAlignClass);
    }
  }

  parseHotkeysAutocompleteOptions(hotkeys) {
    if (hotkeys === undefined || hotkeys === null) {
      return null;
    }
    return hotkeys.map((item) => (item === '/' ? 191 : item));
  }
}

export default DocsSearchBar;
