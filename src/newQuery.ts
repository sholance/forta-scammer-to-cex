import fetch from 'node-fetch';
import fs from 'fs';
import { ZETTABLOCK_API_KEY } from './key';

const API_KEY = ZETTABLOCK_API_KEY;

const options = {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'X-API-KEY': API_KEY,
  },
};

const options2 = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'X-API-KEY': API_KEY,
  },
};

const options3 = {
  method: 'GET',
  headers: {
    accept: 'plain/text',
    responseType: 'text',
    'content-type': 'application/text',
    'X-API-KEY': API_KEY,
  },
};

export const getCex = async (): Promise<void> => {
  const MAX_TRIES = 3;
  let tries = 0;

  const query = `
    SELECT
      t.from_address,
      t.to_address,
      t.hash,
      t.block_time,
      l.address,
      l.author,
      l.id,
      l.name,
      l.source,
      l.type,
      l.process_time
    FROM
      ethereum_mainnet.transactions t
    JOIN
      ethereum_mainnet.labels l ON t.to_address = l.address
    WHERE
      l."type" = 'owner'
      AND l.name IN ('binance', 'coinbase', 'kraken', 'bitfinex', 'kucoin', 'bittrex', 'huobi', 'okex', 'bitstamp', 'gemini')
      AND t.block_time >= CURRENT_TIMESTAMP - INTERVAL '30' DAY
      AND t.from_address NOT IN (SELECT address FROM ethereum_mainnet.contract_creations)
    ORDER BY
      t.block_number
  `;
  console.log('Starting query execution...');

  const createQueryRes = await fetch(
    'https://api.zettablock.com/api/v1/databases/AwsDataCatalog/queries',
    {
      ...options,
      body: JSON.stringify({ query }),
    }
  );

  if (!createQueryRes.ok) {
    throw new Error('Failed to create query. Status: ' + createQueryRes.status);
  }

  const createQueryData = await createQueryRes.json();
  console.log('Create Query Response:', createQueryData);

  const queryrunId = createQueryData.id;
  console.log('Query Run ID:', queryrunId);

  const dataLakeSubmissionEndpoints = `https://api.zettablock.com/api/v1/queries/${queryrunId}/trigger`;
  const submissionRes = await fetch(dataLakeSubmissionEndpoints, options);
  const submissionResult = await submissionRes.json();
  const submissionQueryrunId = submissionResult.queryrunId;
  console.log('Submission Result:', submissionResult);

  const getResponse = async (queryrunId: string): Promise<string> => {
    const queryrunStatusEndpoint = `https://api.zettablock.com/api/v1/queryruns/${queryrunId}/status`;
    while (true) {
      const res = await fetch(queryrunStatusEndpoint, options2);
      const state = (await res.json()).state;
      console.log('Query Run Status:', state);
      if (state === 'SUCCEEDED' || state === 'FAILED') {
        return state;
      }
      await new Promise((resolve) => setTimeout(resolve, 50)); 
    }
  };

  const RETRY_DELAY_MS = 50; 

  while (tries < MAX_TRIES) {
    try {
      const response = await getResponse(submissionQueryrunId);
      console.log('Query Run Response:', response);

      if (response === 'SUCCEEDED') {
        const params = { includeColumnName: 'true' };
        const URLparams = new URLSearchParams(params).toString();
        const queryrunResultEndpoint =
          `https://api.zettablock.com/api/v1/stream/queryruns/${submissionQueryrunId}/result` +
          '?' +
          URLparams;
        const res = await fetch(queryrunResultEndpoint, { ...options3 });
        const csvData = await res.text();
        fs.writeFileSync('./result.csv', csvData, { encoding: 'utf8', flag: 'w' });
        console.log('CSV data saved to result.csv');
      } else {
        console.log('Query failed. Please check the status message for details.');
      }
      break;
    } catch (err) {
      tries++;
      console.log('Error occurred. Retrying attempt:', tries);
      if (tries === MAX_TRIES) {
        throw err;
      }
     await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

