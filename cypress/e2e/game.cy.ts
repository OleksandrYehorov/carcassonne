describe('Carcassonne Game', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should start with the initial tile placed and deck ready', () => {
    cy.get('[data-testid="tile"]').should('have.length', 1);
    cy.get('[data-testid="deck"]').should('be.visible');
    cy.get('[data-testid="current-tile"]').should('be.visible');
    cy.get('[data-testid="tile-counter"]')
      .should('be.visible')
      .and('contain', 'Tiles left: 71');
  });
});
