import BigqueryWarehouseClient from './BigqueryWarehouseClient';
import {
    createJobResponse,
    credentials,
    getDatasetsResponse,
} from './BigqueryWarehouseClient.mock';
import {
    model,
    expectedRow,
    expectedWarehouseSchema,
} from './WarehouseClient.mock';

jest.mock('@google-cloud/bigquery', () => ({
    ...jest.requireActual('@google-cloud/bigquery'),
    BigQuery: class {
        createQueryJob = jest.fn();

        getDatasets = jest.fn();
    },
}));

describe('BigqueryWarehouseClient', () => {
    it('expect query rows with mapped values', async () => {
        const warehouse = new BigqueryWarehouseClient(credentials);
        (warehouse.client.createQueryJob as jest.Mock).mockImplementationOnce(
            () => createJobResponse,
        );
        expect((await warehouse.runQuery('fake sql'))[0]).toEqual(expectedRow);
    });
    it('expect schema with bigquery types mapped to dimension types', async () => {
        const warehouse = new BigqueryWarehouseClient(credentials);
        (warehouse.client.getDatasets as jest.Mock).mockImplementationOnce(
            () => getDatasetsResponse,
        );
        expect(await warehouse.getSchema([model])).toEqual(
            expectedWarehouseSchema,
        );
    });
});
