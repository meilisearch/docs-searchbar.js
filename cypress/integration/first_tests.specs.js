const HOST = `http://localhost:1234` // Please adjust to your own app port

describe(`My first test`, () => {
  before(() => {
    cy.visit(HOST) // Visit our app
  })

  it('Should visit the dashboard', () => {
    cy.url().should('match', new RegExp(HOST)) // The current host URL
  })
})