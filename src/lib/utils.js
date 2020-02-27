import $ from './zepto';

const utils = {
  /*
   * Move the content of an object key one level higher.
   * eg.
   * {
   *   name: 'My name',
   *   hierarchy: {
   *     lvl0: 'Foo',
   *     lvl1: 'Bar'
   *   }
   * }
   * Will be converted to
   * {
   *   name: 'My name',
   *   lvl0: 'Foo',
   *   lvl1: 'Bar'
   * }
   * @param {Object} object Main object
   * @param {String} property Main object key to move up
   * @return {Object}
   * @throws Error when key is not an attribute of Object or is not an object itself
   */
  mergeKeyWithParent(object, property) {
    if (object[property] === undefined) {
      return object;
    }
    if (typeof object[property] !== 'object') {
      return object;
    }
    const newObject = $.extend({}, object, object[property]);
    delete newObject[property];
    return newObject;
  },
  /*
   * Rename the keys containing a 'lvlX' into 'lvlX' only
   * eg.
   * {
   *   name: 'My name',
   *   hierarchy_lvl0: 'Foo',
   *   hierarchy_lvl1: 'Bar'
   * }
   * Will be converted to
   * {
   *   name: 'My name',
   *   lvl0: 'Foo',
   *   lvl1: 'Bar'
   * }
   * @param {Object} object Main object
   * @param {String} prefix Main object key to move rename
   * @return {Object}
   */
  renameKeysWithLevels(object, prefix) {
    return Object.keys(object).reduce(function(acc, key) {
      const result = acc;
      if (key.startsWith(prefix)) {
        const newKey = key.substring(key.indexOf('lvl'));
        result[newKey] = object[key];
      } else {
        result[key] = object[key];
      }
      return result;
    }, {});
  },
  /*
   * Replace string "null" by a null
   * @param {Object} object Main object
   * @return null or {String}
   */
  replaceNullString(object) {
    return Object.keys(object).reduce(function(acc, key) {
      const result = acc;
      if (typeof object[key] === 'string' && object[key] === 'null') {
        result[key] = null;
      } else {
        result[key] = object[key];
      }
      return result;
    }, {});
  },

  /*
   * Group all objects of a collection by the value of the specified attribute
   * If the attribute is a string, use the lowercase form.
   *
   * eg.
   * groupBy([
   *   {name: 'Tim', category: 'dev'},
   *   {name: 'Vincent', category: 'dev'},
   *   {name: 'Ben', category: 'sales'},
   *   {name: 'Jeremy', category: 'sales'},
   *   {name: 'AlexS', category: 'dev'},
   *   {name: 'AlexK', category: 'sales'}
   * ], 'category');
   * =>
   * {
   *   'devs': [
   *     {name: 'Tim', category: 'dev'},
   *     {name: 'Vincent', category: 'dev'},
   *     {name: 'AlexS', category: 'dev'}
   *   ],
   *   'sales': [
   *     {name: 'Ben', category: 'sales'},
   *     {name: 'Jeremy', category: 'sales'},
   *     {name: 'AlexK', category: 'sales'}
   *   ]
   * }
   * @param {array} collection Array of objects to group
   * @param {String} property The attribute on which apply the grouping
   * @return {array}
   * @throws Error when one of the element does not have the specified property
   */
  groupBy(collection, property) {
    const newCollection = {};
    $.each(collection, (index, item) => {
      if (item[property] === undefined) {
        throw new Error(`[groupBy]: Object has no key ${property}`);
      }
      let key = item[property];
      if (typeof key === 'string') {
        key = key.toLowerCase();
      }
      // fix #171 the given data type of docsSearchBar hits might be conflict with the properties of the native Object,
      // such as the constructor, so we need to do this check.
      if (!Object.prototype.hasOwnProperty.call(newCollection, key)) {
        newCollection[key] = [];
      }
      newCollection[key].push(item);
    });
    return newCollection;
  },
  /*
   * Return an array of all the values of the specified object
   * eg.
   * values({
   *   foo: 42,
   *   bar: true,
   *   baz: 'yep'
   * })
   * =>
   * [42, true, yep]
   * @param {object} object Object to extract values from
   * @return {array}
   */
  values(object) {
    return Object.keys(object).map(key => object[key]);
  },
  /*
   * Flattens an array
   * eg.
   * flatten([1, 2, [3, 4], [5, 6]])
   * =>
   * [1, 2, 3, 4, 5, 6]
   * @param {array} array Array to flatten
   * @return {array}
   */
  flatten(array) {
    const results = [];
    array.forEach(value => {
      if (!Array.isArray(value)) {
        results.push(value);
        return;
      }
      value.forEach(subvalue => {
        results.push(subvalue);
      });
    });
    return results;
  },
  /*
   * Flatten all values of an object into an array, marking each first element of
   * each group with a specific flag
   * eg.
   * flattenAndFlagFirst({
   *   'devs': [
   *     {name: 'Tim', category: 'dev'},
   *     {name: 'Vincent', category: 'dev'},
   *     {name: 'AlexS', category: 'dev'}
   *   ],
   *   'sales': [
   *     {name: 'Ben', category: 'sales'},
   *     {name: 'Jeremy', category: 'sales'},
   *     {name: 'AlexK', category: 'sales'}
   *   ]
   * , 'isTop');
   * =>
   * [
   *     {name: 'Tim', category: 'dev', isTop: true},
   *     {name: 'Vincent', category: 'dev', isTop: false},
   *     {name: 'AlexS', category: 'dev', isTop: false},
   *     {name: 'Ben', category: 'sales', isTop: true},
   *     {name: 'Jeremy', category: 'sales', isTop: false},
   *     {name: 'AlexK', category: 'sales', isTop: false}
   * ]
   * @param {object} object Object to flatten
   * @param {string} flag Flag to set to true on first element of each group
   * @return {array}
   */
  flattenAndFlagFirst(object, flag) {
    const values = this.values(object).map(collection =>
      collection.map((item, index) => {
        // eslint-disable-next-line no-param-reassign
        item[flag] = index === 0;
        return item;
      })
    );
    return this.flatten(values);
  },
  /*
   * Removes all empty strings, null, false and undefined elements array
   * eg.
   * compact([42, false, null, undefined, '', [], 'foo']);
   * =>
   * [42, [], 'foo']
   * @param {array} array Array to compact
   * @return {array}
   */
  compact(array) {
    const results = [];
    array.forEach(value => {
      if (!value) {
        return;
      }
      results.push(value);
    });
    return results;
  },
  /*
   * Returns the highlighted value of the specified key in the specified object.
   * If no highlighted value is available, will return the key value directly
   * eg.
   * getHighlightedValue({
   *    _formatted: {
   *      text: '<em>foo</em>'
   *    },
   *    text: 'foo'
   * }, 'text');
   * =>
   * '<em>foo</em>'
   * @param {object} object Hit object returned by the MeiliSearch API
   * @param {string} property Object key to look for
   * @return {string}
   **/
  getHighlightedValue(object, property) {
    if (
      object._formatted &&
      object._formatted[property] &&
      typeof object._formatted[property] === 'string'
    ) {
      return this.replaceHtmlTagsToHighlight(object._formatted[property]);
    }
    return object[property];
  },
  /*
   * Returns the formatted string with the right HTML tags to highlight in
   * the dropdown.
   * @param {string} the string containing <em> tags
   * @return {string}
   **/
  replaceHtmlTagsToHighlight(str) {
    return str
      .replace('<em>', '<span class="docs-search-bar-suggestion--highlight">')
      .replace('</em>', '</span>');
  },
  /*
   * Returns the snippeted value of the specified key in the specified object.
   * If no highlighted value is available, will return the key value directly.
   * Will add starting and ending ellipsis (…) if we detect that a sentence is
   * incomplete
   * eg.
   * getSnippetedValue({
   *    _formatted: {
   *      text: '<em>This is an unfinished sentence</em>'
        },
   *    text: 'This is an unfinished sentence'
   * }, 'text');
   * =>
   * '<em>This is an unfinished sentence</em>…'
   * @param {object} object Hit object returned by the MeiliSearch API
   * @param {string} property Object key to look for
   * @return {string}
   **/
  getSnippetedValue(object, property) {
    if (
      !object._formatted ||
      !object._formatted[property] ||
      typeof object._formatted[property] !== 'string'
    ) {
      return object[property];
    }
    let snippet = this.replaceHtmlTagsToHighlight(object._formatted[property]);
    if (snippet[0] !== snippet[0].toUpperCase()) {
      snippet = `…${snippet}`;
    }
    if (['.', '!', '?'].indexOf(snippet[snippet.length - 1]) === -1) {
      snippet = `${snippet}…`;
    }
    return snippet;
  },
  /*
   * Deep clone an object.
   * Note: This will not clone functions and dates
   * @param {object} object Object to clone
   * @return {object}
   */
  deepClone(object) {
    return JSON.parse(JSON.stringify(object));
  },
};

export default utils;
