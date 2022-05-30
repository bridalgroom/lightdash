import { SEED_PROJECT } from '@lightdash/common';

const firstResult = {
    firstName: 'Gerald',
    lastName: 'C.',
    created: '2017-01-30T11:00:00.000Z',
};
describe('Dashboard', () => {
    before(() => {
        // @ts-ignore
        cy.login();
        // @ts-ignore
        cy.preCompileProject();
    });

    beforeEach(() => {
        Cypress.Cookies.preserveOnce('connect.sid');
        cy.visit(`/projects/${SEED_PROJECT.project_uuid}/sqlRunner`);
    });

    it('Should see results from customers by typing', () => {
        cy.visit(`/projects/${SEED_PROJECT.project_uuid}/sqlRunner`);

        const customersTable = `"jaffle"."customers"`;

        cy.get('.ace_content')
            .type(`SELECT * FROM ${customersTable} LIMIT 1`)
            .type('{ctrl}{enter}');

        const find = [
            '1 results',
            'first_name',
            firstResult.created,
            firstResult.firstName,
            firstResult.lastName,
        ];
        find.forEach((text) => cy.findByText(text));
    });

    it('Should autocomplete customer table', () => {
        cy.visit(`/projects/${SEED_PROJECT.project_uuid}/sqlRunner`);

        cy.get('.ace_content').type(`SELECT * FROM cu\n`).type('{ctrl}{enter}');

        const find = [
            '100 results',
            'first_name',
            firstResult.created,
            firstResult.firstName,
            firstResult.lastName,
            'Jesse',
        ];
        find.forEach((text) => cy.findAllByText(text));
    });

    it('Should see results from orders by clicking', () => {
        cy.findByText('payments').click();
        cy.findAllByText('Run query').first().click();

        const find = [
            '25 results',
            'payment_method',
            'bank_transfer',
            'credit_card',
        ];
        find.forEach((text) => cy.findAllByText(text));
    });

    it('Get error on invalid SQL', () => {
        cy.get('.ace_content').type(`SELECT test`).type('{ctrl}{enter}');

        cy.findByText('Failed to run sql query');
        cy.contains('column "test" does not exist');
    });

    it('Should see results with custom SQL ', () => {
        const sql = `select a from ( values ('foo'), ('bar')) s(a);`;

        cy.get('.ace_content').type(sql).type('{ctrl}{enter}');

        const find = ['2 results'];
        find.forEach((text) => cy.findAllByText(text));
    });
});
