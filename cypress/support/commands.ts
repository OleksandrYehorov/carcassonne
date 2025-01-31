/// <reference types="cypress" />

// Add Testing Library Commands
import '@testing-library/cypress/add-commands';

// Custom commands can be added here
// Example: export const customCommand = () => { ... }

// Type definitions for custom commands
declare global {
  interface Cypress {
    Chainable: Cypress.Chainable & {
      // Add custom command types here
      // example: customCommand(): Chainable<void>;
    };
  }
}

export {};
