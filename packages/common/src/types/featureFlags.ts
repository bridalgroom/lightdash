/**
 * Consider adding a short description of the feature flag and how it
 * will be used.
 *
 * If the feature flag is no longer in use, remove it from this enum.
 */
export enum FeatureFlags {
    /**/
    PassthroughLogin = 'passthrough-login',

    /**
     * Enables custom visualizations when the environment variable is also enabled
     */
    CustomVisualizationsEnabled = 'custom-visualizations-enabled',

    /**/
    ShowDbtCloudProjectOption = 'show-dbt-cloud-project-option',

    /**
     * Use the new in-memory table calculations engine/duckdb
     */
    UseInMemoryTableCalculations = 'new-table-calculations-engine',

    /**/
    CustomSQLEnabled = 'custom-sql-enabled',

    /**/
    PuppeteerScrollElementIntoView = 'puppeteer-scroll-element-into-view',
    PuppeteerSetViewportDynamically = 'puppeteer-set-viewport-dynamically',

    /* Shows the two-stage login flow */
    newLoginEnabled = 'new-login-enabled',
}
