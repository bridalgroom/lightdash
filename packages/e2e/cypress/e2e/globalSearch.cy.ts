import { SEED_PROJECT } from '@lightdash/common';

function search(query: string) {
    cy.findByRole('search').click();
    cy.findByPlaceholderText(/Search Jaffle shop/gi)
        .clear()
        .type(query);
}

describe('Global search', () => {
    beforeEach(() => {
        cy.login();
    });

    it('Should search all result types', () => {
        cy.visit(`/projects/${SEED_PROJECT.project_uuid}/home`);

        // search and select space
        search('jaffle');
        cy.findByRole('dialog')
            .findByRole('menuitem', { name: 'Jaffle shop Space' })
            .click();
        cy.url().should(
            'include',
            `/projects/${SEED_PROJECT.project_uuid}/spaces/`,
        );

        // search and select dashboard
        search('jaffle');
        cy.findByRole('dialog')
            .findByRole('menuitem', { name: /Jaffle dashboard Dashboard/ })
            .click();
        cy.url().should(
            'include',
            `/projects/${SEED_PROJECT.project_uuid}/dashboards/`,
        );

        // search and select saved chart
        search('Which');
        cy.get('[role="dialog"][aria-modal="true"]').within(() => {
            cy.get('button').click();
        });
        cy.url().should(
            'include',
            `/projects/${SEED_PROJECT.project_uuid}/saved/`,
        );

        // search and select table
        search('Customers');
        cy.findByRole('dialog')
            .findByRole('menuitem', {
                name: "Customers Table · This table has basic information about a customer, as well as some derived facts based on a customer's orders",
            })
            .click();
        cy.url().should(
            'include',
            `/projects/${SEED_PROJECT.project_uuid}/tables/customers`,
        );

        // search and select field
        search('First order');
        cy.findByRole('dialog')
            .findByRole('menuitem', {
                name: 'Payments - Orders - Date of first order Metric · Min of Order date',
                exact: false,
            })
            .click();
        cy.url().should(
            'include',
            `/projects/${SEED_PROJECT.project_uuid}/tables/payments?create_saved_chart_version`,
        );
    });
});
