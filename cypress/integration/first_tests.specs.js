const HOST = `http://localhost:1234` // Please adjust to your own app port

describe(`My first test`, () => {
  before(() => {
    cy.visit(HOST) // Visit our app
  })

  it('Should visit the dashboard', () => {
    cy.url().should('match', new RegExp(HOST)) // The current host URL
  })

  it('Should check if the searchbar is visible', () => {
    cy.get('.searchbox')
      .should('be.visible')
  })

  it('Should check if autocomplete is visible during typing', () => {
    cy.get('#docs-searchbar-suggestion')
      .type('Quick')
    cy.get('#meilisearch-autocomplete-listbox-0')
      .should('be.visible')
    cy.get('div.dsb-suggestion:nth-child(1)') // the first entry should be "Quick start"
      .contains('Quick start')
  })
})
