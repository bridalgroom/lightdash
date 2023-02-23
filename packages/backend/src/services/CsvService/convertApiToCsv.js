/* tslint:disable */
/* eslint-disable */
const { workerData, parentPort } = require('worker_threads');

const { convertApiToCsv } = require('./CsvService');

function formatRowsWorker() {
   
    convertApiToCsv(workerData.fieldIds, workerData.rows, workerData.onlyRaw, workerData.itemMap).then(
        (csv) => {
            parentPort.postMessage(csv);
        }
    );
}

formatRowsWorker();
