/**
 * Advanced search filter parsing utilities
 */

// Advanced search configuration
export const ADVANCED_SEARCH_CONFIG = {
  readcomicsonline: {
    url: 'https://readcomicsonline.ru/advanced-search',
    filters: {
      categories: {
        selector: 'select[name="categories[]"]',
        type: 'multi-select',
      },
      status: {
        selector: 'select[name="status[]"]',
        type: 'multi-select',
      },
      types: {
        selector: 'select[name="types[]"]',
        type: 'multi-select',
      },
    },
  },
};

/**
 * Extracts options from a select element or its selectize control
 *
 * @param {Object} $ - Cheerio instance
 * @param {string} selector - CSS selector for the select element
 * @returns {Array} - Array of {value, text} objects
 */
const extractSelectOptions = ($, selector) => {
  const options = [];
  const selectElement = $(selector);

  // Check if it's using selectize control
  const selectizeControl = selectElement.next('.selectize-control');

  if (selectizeControl.length > 0) {
    // Extract from selectize options
    selectizeControl.find('.option').each((i, el) => {
      const value = $(el).attr('data-value');
      const text = $(el).text().trim();
      if (value && text) {
        options.push({value, text});
      }
    });
  } else {
    // Extract from standard select options
    selectElement.find('option').each((i, el) => {
      const value = $(el).attr('value')?.trim();
      const text = $(el).text().trim();
      if (value && text) {
        options.push({value, text});
      }
    });
  }

  return options;
};

/**
 * Parses all filter options from advanced search page
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Advanced search configuration
 * @returns {Object} - Object containing all filter options
 */
export const parseAdvancedSearchFilters = ($, config) => {
  const filters = {};

  Object.entries(config.filters).forEach(([filterName, filterConfig]) => {
    filters[filterName] = extractSelectOptions($, filterConfig.selector);
  });

  return filters;
};

/**
 * Gets advanced search configuration for a source
 *
 * @param {string} sourceId - The search source identifier
 * @returns {Object|null} - Configuration object or null if not found
 */
export const getAdvancedSearchConfig = sourceId => {
  return ADVANCED_SEARCH_CONFIG[sourceId] || null;
};
