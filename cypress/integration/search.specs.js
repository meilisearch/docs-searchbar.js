/* eslint jest/expect-expect: ["off"]*/

const HOST = `http://localhost:1234` // Please adjust to your own app port

describe(`My first test`, () => {
  before(() => {
    cy.visit(HOST) // Visit our app
  })

  it('Should visit the dashboard', () => {
    cy.url().should('match', new RegExp(HOST)) // The current host URL
  })

  it('Should check if the searchbar is visible', () => {
    cy.get('.searchbox').should('be.visible')
  })

  it('Should check if autocomplete is visible during typing', () => {
    cy.get('#docs-searchbar-suggestion').type('gett')
    cy.get('#meilisearch-autocomplete-listbox-0').should('be.visible')
    cy.get('div.dsb-suggestion:nth-child(1)') // the first entry should be "Quick start"
      .contains('Getting started')
  })

  it('Should test all other subheadings', () => {
    cy.get('div.dsb-suggestion:nth-child(2)') // the second entry should be "Download and launch"
      .contains('FAQ')
  })

  it('Should have valid placeholder text', () => {
    cy.get('#docs-searchbar-suggestion').should(
      'have.attr',
      'placeholder',
      'Search the docs',
    )
  })

  it('Should display a no results message when search results are empty', () => {
    cy.get('#docs-searchbar-suggestion').type(' empty results')
    cy.get('#meilisearch-autocomplete-listbox-0').should('be.visible')
    cy.get('div.docs-searchbar-suggestion') // No Results message should be displayed instead
      .contains('No results found for query')
  })
})
