describe('Home page smoke test', () => {
  it('loads the home page and finds welcome text', () => {
    cy.visit('/')
    cy.contains('Welcome to PharmaPin').should('be.visible')
  })
})
