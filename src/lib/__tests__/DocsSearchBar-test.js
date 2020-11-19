/* eslint no-new:0 */
/* eslint-disable camelcase */
import sinon from 'sinon';
import $ from '../zepto';
import DocsSearchBar from '../DocsSearchBar';
import Templates from '../templates';

/**
 * Pitfalls:
 * Whenever you call new DocsSearchBar(), it will add the a new dropdown markup to
 * the page. Because we are clearing the document.body.innerHTML between each
 * test, it usually is not a problem.
 * Except that autocomplete.js remembers internally how many times it has been
 * called, and adds this number to classes of elements it creates.
 * DO NOT rely on any .dsb-dataset-X, .dsb-suggestions-X, etc classes where X is
 * a number. This will change if you add or remove tests and will break your
 * tests.
 **/

describe('DocsSearchBar', () => {
  beforeEach(() => {
    // Note: If you edit this HTML while doing TDD with `npm run test:watch`,
    // you will have to restart `npm run test:watch` for the new HTML to be
    // updated
    document.body.innerHTML = `
    <div>
      <input id="input" name="search" />
      <span class="i-am-a-span">span span</span>
    </div>
    `;

    // We prevent the logging of expected errors
    window.console.warn = sinon.spy();

    window.location.assign = jest.fn();
  });

  describe('constructor', () => {
    let MeiliSearch;
    let meilisearch;
    let AutoComplete;
    let autocomplete;
    let defaultOptions;

    beforeEach(() => {
      meilisearch = { meilisearch: 'client' };
      MeiliSearch = sinon.stub().returns(meilisearch);
      autocomplete = { on: sinon.spy() };
      AutoComplete = sinon.stub().returns(autocomplete);
      defaultOptions = {
        hostUrl: 'https://test.getmeili.com',
        apiKey: 'apiKey',
        indexUid: 'indexUID',
        inputSelector: '#input',
      };

      sinon.spy(DocsSearchBar, 'checkArguments');
      sinon.stub(DocsSearchBar, 'getInputFromSelector').returns(true);

      DocsSearchBar.__Rewire__('MeiliSearch', MeiliSearch);
      DocsSearchBar.__Rewire__('autocomplete', AutoComplete);
    });

    afterEach(() => {
      DocsSearchBar.checkArguments.restore();
      DocsSearchBar.getInputFromSelector.restore();
      DocsSearchBar.__ResetDependency__('meilisearch');
      DocsSearchBar.__ResetDependency__('autocomplete');
    });

    it('should call checkArguments', () => {
      // Given
      const options = defaultOptions;

      // When
      new DocsSearchBar(options);

      // Then
      expect(DocsSearchBar.checkArguments.calledOnce).toBe(true);
    });
    it('should pass main options as instance properties', () => {
      // Given
      const options = defaultOptions;

      // When
      const actual = new DocsSearchBar(options);

      // Then
      expect(actual.hostUrl).toEqual('https://test.getmeili.com');
      expect(actual.indexUid).toEqual('indexUID');
      expect(actual.apiKey).toEqual('apiKey');
    });
    it('should allow customize meilisearchOptions without loosing default options', () => {
      // Given
      const options = {
        meilisearchOptions: {
          cropLength: 50,
        },
        ...defaultOptions,
      };

      // When
      const actual = new DocsSearchBar(options);

      // Then
      expect(actual.meilisearchOptions).toEqual({
        limit: 5,
        attributesToCrop: ['content'],
        attributesToHighlight: ['*'],
        cropLength: 50,
      });
    });
    it('should allow customize limit', () => {
      // Given
      const options = {
        meilisearchOptions: {
          limit: 10,
        },
        ...defaultOptions,
      };

      // When
      const actual = new DocsSearchBar(options);

      // Then
      expect(actual.meilisearchOptions).toEqual({
        limit: 10,
        attributesToHighlight: ['*'],
        attributesToCrop: ['content'],
        cropLength: 30,
      });
    });
    it('should pass the input element as an instance property', () => {
      // Given
      const options = defaultOptions;
      DocsSearchBar.getInputFromSelector.returns($('<span>foo</span>'));

      // When
      const actual = new DocsSearchBar(options);

      // Then
      const $inputs = actual.input;
      expect($inputs.text()).toEqual('foo');
      expect($inputs[0].tagName).toEqual('SPAN');
    });
    it('should pass secondary options as instance properties', () => {
      // Given
      const options = {
        ...defaultOptions,
        meilisearchOptions: { anOption: 42 },
        autocompleteOptions: { anOption: 44 },
      };

      // When
      const actual = new DocsSearchBar(options);

      // Then
      expect(typeof actual.meilisearchOptions).toEqual('object');
      expect(actual.meilisearchOptions.anOption).toEqual(42);
      expect(actual.autocompleteOptions).toEqual({
        debug: false,
        hint: false,
        autoselect: true,
        cssClasses: {
          root: 'meilisearch-autocomplete',
          prefix: 'dsb',
        },
        anOption: 44,
        ariaLabel: 'search input',
        keyboardShortcuts: ['s', 191],
      });
    });
    it('should instantiate meilisearch with the correct values', () => {
      // Given
      const options = defaultOptions;

      // When
      new DocsSearchBar(options);

      // Then
      expect(MeiliSearch.calledOnce).toBe(true);
      expect(
        MeiliSearch.calledWith({
          host: 'https://test.getmeili.com',
          apiKey: 'apiKey',
        })
      ).toBe(true);
    });
    it('should instantiate autocomplete.js', () => {
      // Given
      const options = {
        ...defaultOptions,
        autocompleteOptions: { anOption: '44' },
      };
      const $input = $('<input name="foo" />');
      DocsSearchBar.getInputFromSelector.returns($input);

      // When
      new DocsSearchBar(options);

      // Then
      expect(AutoComplete.calledOnce).toBe(true);
      expect(
        AutoComplete.calledWith($input, {
          anOption: '44',
          cssClasses: {
            root: 'meilisearch-autocomplete',
            prefix: 'dsb',
          },
          debug: false,
          hint: false,
          autoselect: true,
          ariaLabel: 'search input',
          keyboardShortcuts: ['s', 191],
        })
      ).toBe(true);
    });
    it('should listen to the selected and shown event of autocomplete', () => {
      // Given
      const options = { ...defaultOptions, handleSelected() {} };

      // When
      new DocsSearchBar(options);

      // Then
      expect(autocomplete.on.calledTwice).toBe(true);
      expect(autocomplete.on.calledWith('autocomplete:selected')).toBe(true);
    });

    it('should be able to construct default templates when no user customizations are present', () => {
      // Given

      // When
      const searchbar = new DocsSearchBar(defaultOptions);

      // Then
      expect(typeof searchbar.templates.suggestion).toBe('string');
    });

    it('should be able to construct templates from user customizations', () => {
      // Given
      const customizedTemplate = '<div></div>';

      const options = {
        ...defaultOptions,
        autocompleteOptions: {
          templates: {
            suggestion: customizedTemplate,
            suggestionSimple: customizedTemplate,
            footer: customizedTemplate,
            searchBox: customizedTemplate,
          },
        },
      };
      // When
      const searchbar = new DocsSearchBar(options);

      // Then
      expect(searchbar.templates.suggestion).toBe(customizedTemplate);
      expect(searchbar.templates.suggestionSimple).toBe(customizedTemplate);
      expect(searchbar.templates.footer).toBe(customizedTemplate);
      expect(searchbar.templates.searchBox).toBe(customizedTemplate);
    });
  });

  describe('checkArguments', () => {
    let checkArguments;
    beforeEach(() => {
      checkArguments = DocsSearchBar.checkArguments;
    });

    afterEach(() => {
      if (DocsSearchBar.getInputFromSelector.restore) {
        DocsSearchBar.getInputFromSelector.restore();
      }
    });

    it('should throw an error if no hostUrl defined', () => {
      // Given
      const options = {
        apiKey: 'apiKey',
        indexUid: 'indexUID',
      };

      // When
      expect(() => {
        checkArguments(options);
      }).toThrow(/^Usage:/);
    });
    it('should throw an error if no apiKey defined', () => {
      // Given
      const options = {
        hostUrl: 'test.com',
        indexUid: 'indexUID',
      };

      // When
      expect(() => {
        checkArguments(options);
      }).toThrow(/^Usage:/);
    });
    it('should throw an error if no indexUid defined', () => {
      // Given
      const options = {
        hostUrl: 'test.com',
        apiKey: 'apiKey',
      };

      // When
      expect(() => {
        checkArguments(options);
      }).toThrow(/^Usage:/);
    });
    it('should throw an error if no selector matches', () => {
      // Given
      const options = {
        hostUrl: 'test.com',
        apiKey: 'apiKey',
        indexUid: 'indexUID',
      };
      sinon.stub(DocsSearchBar, 'getInputFromSelector').returns(false);

      // When
      expect(() => {
        checkArguments(options);
      }).toThrow(/^Error:/);
    });
  });

  describe('getInputFromSelector', () => {
    let getInputFromSelector;
    beforeEach(() => {
      getInputFromSelector = DocsSearchBar.getInputFromSelector;
    });

    it('should return null if no element matches the selector', () => {
      // Given
      const selector = '.i-do-not-exist > at #all';

      // When
      const actual = getInputFromSelector(selector);

      // Then
      expect(actual).toEqual(null);
    });
    it('should return null if the matched element is not an input', () => {
      // Given
      const selector = '.i-am-a-span';

      // When
      const actual = getInputFromSelector(selector);

      // Then
      expect(actual).toEqual(null);
    });
    it('should return a Zepto wrapped element if it matches', () => {
      // Given
      const selector = '#input';

      // When
      const actual = getInputFromSelector(selector);

      // Then
      expect($.zepto.isZ(actual)).toBe(true);
    });
  });

  describe('getAutocompleteSource', () => {
    let client;
    let MeiliSearch;
    let docsSearchBar;
    beforeEach(() => {
      client = {
        meilisearch: 'client',
        getIndex: sinon.stub().returns({
          search: sinon.stub().returns({
            then: sinon.spy(),
          }),
        }),
      };
      MeiliSearch = sinon.stub().returns(client);
      DocsSearchBar.__Rewire__('MeiliSearch', MeiliSearch);

      docsSearchBar = new DocsSearchBar({
        hostUrl: 'https://test.getmeili.com',
        indexUid: 'indexUID',
        apiKey: 'apiKey',
        inputSelector: '#input',
      });
    });

    afterEach(() => {
      DocsSearchBar.__ResetDependency__('meilisearch');
    });

    it('returns a function', () => {
      // Given
      const actual = docsSearchBar.getAutocompleteSource();

      // When

      // Then
      expect(actual).toBeInstanceOf(Function);
    });

    describe('the returned function', () => {
      it('calls the MeiliSearch client with the correct parameters', () => {
        // Given
        const actual = docsSearchBar.getAutocompleteSource();

        // When
        actual('query');

        // Then
        expect(client.getIndex.calledOnce).toBe(true);
        expect(client.getIndex('indexUID').search.calledOnce).toBe(true);
        const expectedParams = {
          limit: 5,
          attributesToHighlight: ['*'],
          attributesToCrop: ['content'],
          cropLength: 30,
        };
        expect(client.getIndex.calledWith('indexUID')).toBe(true);
        expect(
          client.getIndex('indexUid').search.calledWith('query', expectedParams)
        ).toBe(true);
      });
    });

    describe('when queryHook is used', () => {
      it('calls the MeiliSearch client with the correct parameters', () => {
        // Given
        const actual = docsSearchBar.getAutocompleteSource(
          false,
          (query) => `${query} modified`
        );

        // When
        actual('query');

        // Then
        expect(client.getIndex.calledOnce).toBe(true);
        expect(client.getIndex('indexUID').search.calledOnce).toBe(true);
        const expectedParams = {
          limit: 5,
          attributesToHighlight: ['*'],
          attributesToCrop: ['content'],
          cropLength: 30,
        };
        expect(
          client
            .getIndex('indexUID')
            .search.calledWith('query modified', expectedParams)
        ).toBe(true);
        expect(client.getIndex.calledWith('indexUID')).toBe(true);
      });
    });
  });

  describe('handleSelected', () => {
    it('should change the location if no handleSelected specified', () => {
      // Given
      const options = {
        hostUrl: 'test.com',
        apiKey: 'key',
        indexUid: 'foo',
        inputSelector: '#input',
      };

      // When
      const dsb = new DocsSearchBar(options);
      dsb.autocomplete.trigger('autocomplete:selected', {
        url: 'https://website.com/doc/page',
      });

      return new Promise((resolve) => {
        expect(window.location.assign).toHaveBeenCalledWith(
          'https://website.com/doc/page'
        );
        resolve();
      });
    });
    it('should call the custom handleSelected if defined', () => {
      // Given
      const customHandleSelected = jest.fn();
      const options = {
        hostUrl: 'test.com',
        apiKey: 'key',
        indexUid: 'foo',
        inputSelector: '#input',
        handleSelected: customHandleSelected,
      };
      const expectedInput = expect.objectContaining({
        open: expect.any(Function),
      });
      const expectedEvent = expect.objectContaining({
        type: 'autocomplete:selected',
      });
      const expectedSuggestion = expect.objectContaining({
        url: 'https://website.com/doc/page',
      });

      // When
      const dsb = new DocsSearchBar(options);
      dsb.autocomplete.trigger('autocomplete:selected', {
        url: 'https://website.com/doc/page',
      });

      return new Promise((resolve) => {
        expect(customHandleSelected).toHaveBeenCalledWith(
          expectedInput,
          expectedEvent,
          expectedSuggestion
        );
        resolve();
      });
    });
    it('should prevent all clicks on links if a custom handleSelected is specified', () => {
      // Given
      const options = {
        hostUrl: 'test.com',
        apiKey: 'key',
        indexUid: 'foo',
        inputSelector: '#input',
        handleSelected: jest.fn(),
      };

      // Building a dropdown with links inside
      const dsb = new DocsSearchBar(options);
      dsb.autocomplete.trigger('autocomplete:shown');
      const dataset = $('.meilisearch-autocomplete');
      const suggestions = $('<div class="dsb-suggestions"></div>');
      const testLink = $('<a href="#">test link</a>');
      dataset.append(suggestions);
      suggestions.append(testLink);

      // Simulating a click on the link
      const clickEvent = new $.Event('click');
      clickEvent.preventDefault = jest.fn();
      testLink.trigger(clickEvent);

      return new Promise((resolve) => {
        expect(clickEvent.preventDefault).toHaveBeenCalled();
        resolve();
      });
    });
    describe('default handleSelected', () => {
      it('enterKey: should change the page', () => {
        const options = {
          hostUrl: 'test.com',
          apiKey: 'key',
          indexUid: 'foo',
          inputSelector: '#input',
        };
        const mockSetVal = jest.fn();
        const mockInput = { setVal: mockSetVal };
        const mockSuggestion = { url: 'www.example.com' };
        const mockContext = { selectionMethod: 'enterKey' };

        new DocsSearchBar(options).handleSelected(
          mockInput,
          undefined, // Event
          mockSuggestion,
          undefined, // Dataset
          mockContext
        );

        return new Promise((resolve) => {
          expect(mockSetVal).toHaveBeenCalledWith('');
          expect(window.location.assign).toHaveBeenCalledWith(
            'www.example.com'
          );
          resolve();
        });
      });
      it('click: should not change the page', () => {
        const options = {
          hostUrl: 'test.com',
          apiKey: 'key',
          indexUid: 'foo',
          inputSelector: '#input',
        };
        const mockSetVal = jest.fn();
        const mockInput = { setVal: mockSetVal };
        const mockContext = { selectionMethod: 'click' };

        new DocsSearchBar(options).handleSelected(
          mockInput,
          undefined, // Event
          undefined, // Suggestion
          undefined, // Dataset
          mockContext
        );

        return new Promise((resolve) => {
          expect(mockSetVal).not.toHaveBeenCalled();
          expect(window.location.assign).not.toHaveBeenCalled();
          resolve();
        });
      });
    });
  });

  describe('handleShown', () => {
    it('should add an alignment class', () => {
      // Given
      const options = {
        hostUrl: 'test.com',
        apiKey: 'key',
        indexUid: 'foo',
        inputSelector: '#input',
      };

      // When
      const dsb = new DocsSearchBar(options);

      dsb.autocomplete.trigger('autocomplete:shown');

      expect($('.meilisearch-autocomplete').attr('class')).toEqual(
        'meilisearch-autocomplete meilisearch-autocomplete-right'
      );
    });
  });

  describe('formatHits', () => {
    it('should not mutate the input', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      // Then
      expect(input).not.toBe(actual);
    });
    it('should set category headers to the first of each category', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'Geo-search',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
        {
          hierarchy_lvl0: 'Python',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      // Then
      expect(actual[0].isCategoryHeader).toEqual(true);
      expect(actual[2].isCategoryHeader).toEqual(true);
    });
    it('should group items of same category together', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
        {
          hierarchy_lvl0: 'Python',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'Geo-search',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      // Then
      expect(actual[0].category).toEqual('Ruby');
      expect(actual[1].category).toEqual('Ruby');
      expect(actual[2].category).toEqual('Python');
    });
    it('should mark all first elements as subcategories', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
        {
          hierarchy_lvl0: 'Python',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'Geo-search',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      // Then
      expect(actual[0].isSubCategoryHeader).toEqual(true);
      expect(actual[2].isSubCategoryHeader).toEqual(true);
    });
    it('should mark new subcategories as such', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: 'Foo',
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
        {
          hierarchy_lvl0: 'Python',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: 'Bar',
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'Geo-search',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      // Then
      expect(actual[0].isSubCategoryHeader).toEqual(true);
      expect(actual[1].isSubCategoryHeader).toEqual(false);
      expect(actual[2].isSubCategoryHeader).toEqual(true);
      expect(actual[3].isSubCategoryHeader).toEqual(true);
    });
    it('should use highlighted category and subcategory if exists', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: 'Foo',
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
          _formatted: {
            hierarchy_lvl0: '<mark>Ruby</mark>',
            hierarchy_lvl1: '<mark>API</mark>',
          },
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      // Then
      expect(actual[0].category).toEqual('<mark>Ruby</mark>');
      expect(actual[0].subcategory).toEqual('<mark>API</mark>');
    });
    it('should use lvl2 as title', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: 'Foo',
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      // Then
      expect(actual[0].title).toEqual('Foo');
    });
    it('should use lvl1 as title if no lvl2', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      // Then
      expect(actual[0].title).toEqual('API');
    });
    it('should use lvl0 as title if no lvl2 nor lvl2', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: null,
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      // Then
      expect(actual[0].title).toEqual('Ruby');
    });
    it('should concatenate lvl2+ for title if more', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: 'Geo-search',
          hierarchy_lvl3: 'Foo',
          hierarchy_lvl4: 'Bar',
          hierarchy_lvl5: 'Baz',
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      const separator =
        '<span class="aa-suggestion-title-separator" aria-hidden="true"> › </span>';
      // Then
      expect(actual[0].title).toEqual(
        `Geo-search${separator}Foo${separator}Bar${separator}Baz`
      );
    });
    it('should concatenate highlighted elements', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: 'Geo-search',
          hierarchy_lvl3: 'Foo',
          hierarchy_lvl4: 'Bar',
          hierarchy_lvl5: 'Baz',
          _formatted: {
            hierarchy_lvl0: '<mark>Ruby</mark>',
            hierarchy_lvl1: '<mark>API</mark>',
            hierarchy_lvl2: '<mark>Geo-search</mark>',
            hierarchy_lvl3: '<mark>Foo</mark>',
            hierarchy_lvl4: '<mark>Bar</mark>',
            hierarchy_lvl5: '<mark>Baz</mark>',
          },
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      const separator =
        '<span class="aa-suggestion-title-separator" aria-hidden="true"> › </span>';
      // Then
      const expected = `<mark>Geo-search</mark>${separator}<mark>Foo</mark>${separator}<mark>Bar</mark>${separator}<mark>Baz</mark>`;
      expect(actual[0].title).toEqual(expected);
    });
    it('should add ellipsis to content', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
          content: 'foo bar',
          _formatted: {
            content: 'lorem <mark>foo</mark> bar ipsum.',
          },
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      // Then
      expect(actual[0].text).toEqual('…lorem <mark>foo</mark> bar ipsum.');
    });
    it('should add the anchor to the url if one is set', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
          content: 'foo bar',
          url: 'http://foo.bar/',
          anchor: 'anchor',
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      // Then
      expect(actual[0].url).toEqual('http://foo.bar/#anchor');
    });
    it('should not add the anchor to the url if one is set but it is already in the URL', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
          content: 'foo bar',
          url: 'http://foo.bar/#anchor',
          anchor: 'anchor',
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      // Then
      expect(actual[0].url).toEqual('http://foo.bar/#anchor');
    });
    it('should just use the URL if no anchor is provided', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
          content: 'foo bar',
          url: 'http://foo.bar/',
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      // Then
      expect(actual[0].url).toEqual(input[0].url);
    });
    it('should return the anchor if there is no URL', () => {
      // Given
      const input = [
        {
          hierarchy_lvl0: 'Ruby',
          hierarchy_lvl1: 'API',
          hierarchy_lvl2: null,
          hierarchy_lvl3: null,
          hierarchy_lvl4: null,
          hierarchy_lvl5: null,
          content: 'foo bar',
          anchor: 'anchor',
        },
      ];

      // When
      const actual = DocsSearchBar.formatHits(input);

      // Then
      expect(actual[0].url).toEqual(`#${input[0].anchor}`);
    });
  });

  describe('formatUrl', () => {
    it('concatenates url and anchor', () => {
      // Given
      const input = {
        url: 'url',
        anchor: 'anchor',
      };

      // When
      const actual = DocsSearchBar.formatURL(input);

      // Then
      expect(actual).toEqual('url#anchor');
    });

    it('returns only the url if no anchor', () => {
      // Given
      const input = {
        url: 'url',
      };

      // When
      const actual = DocsSearchBar.formatURL(input);

      // Then
      expect(actual).toEqual('url');
    });

    it('returns the anchor if no url', () => {
      // Given
      const input = {
        anchor: 'anchor',
      };

      // When
      const actual = DocsSearchBar.formatURL(input);

      // Then
      expect(actual).toEqual('#anchor');
    });

    it('does not concatenate if already an anchor', () => {
      // Given
      const input = {
        url: 'url#anchor',
        anchor: 'anotheranchor',
      };

      // When
      const actual = DocsSearchBar.formatURL(input);

      // Then
      expect(actual).toEqual('url#anchor');
    });

    it('returns null if no anchor nor url', () => {
      // Given
      const input = {};

      // When
      const actual = DocsSearchBar.formatURL(input);

      // Then
      expect(actual).toEqual(null);
    });

    it('emits a warning if no anchor nor url', () => {
      // Given
      const input = {};

      // When
      DocsSearchBar.formatURL(input);

      // Then
      expect(window.console.warn.calledOnce).toBe(true);
    });
  });

  describe('getSuggestionTemplate', () => {
    let templates;
    beforeEach(() => {
      templates = new Templates({ suggestion: '<div></div>' });
      DocsSearchBar.__Rewire__('templates', templates);
    });
    afterEach(() => {
      DocsSearchBar.__ResetDependency__('templates');
    });
    it('should return a function', () => {
      // Given

      // When
      const actual = DocsSearchBar.getSuggestionTemplate;

      // Then
      expect(actual).toBeInstanceOf(Function);
    });
    describe('returned function', () => {
      let Hogan;
      let render;
      beforeEach(() => {
        render = sinon.spy();
        Hogan = {
          compile: sinon.stub().returns({ render }),
        };
        DocsSearchBar.__Rewire__('Hogan', Hogan);
      });
      it('should compile the suggestion template', () => {
        // Given

        // When
        DocsSearchBar.getSuggestionTemplate(false, templates);

        // Then
        expect(Hogan.compile.calledOnce).toBe(true);
        expect(Hogan.compile.calledWith('<div></div>')).toBe(true);
      });
      it('should call render on a Hogan template', () => {
        // Given
        const actual = DocsSearchBar.getSuggestionTemplate(false, templates);

        // When
        actual({ foo: 'bar' });

        // Then
        expect(render.calledOnce).toBe(true);
        expect(render.args[0][0]).toEqual({ foo: 'bar' });
      });
    });
  });
});
