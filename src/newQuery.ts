import fs from 'fs';
import { ZETTABLOCK_API_KEY } from './key';
import { query, ZETTABLOCK_API_URL } from './constants';

const API_KEY = ZETTABLOCK_API_KEY;

const baseOptions = {
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'X-API-KEY': API_KEY,
  },
};

const jsonOptions = {
  ...baseOptions,
  method: 'POST',
};

const getOptions = {
  ...baseOptions,
  method: 'GET',
};

const textOptions = {
  ...baseOptions,
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

  console.log('Starting query execution...');

  const createQueryRes = await fetch(
    `${ZETTABLOCK_API_URL}/databases/AwsDataCatalog/queries`,
    {
      ...jsonOptions,
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

  const dataLakeSubmissionEndpoints = `${ZETTABLOCK_API_URL}/queries/${queryrunId}/trigger`;
  const submissionRes = await fetch(dataLakeSubmissionEndpoints, jsonOptions);
  const submissionResult = await submissionRes.json();
  const submissionQueryrunId = submissionResult.queryrunId;
  console.log('Submission Result:', submissionResult);

  const getResponse = async (queryrunId: string): Promise<string> => {
    const queryrunStatusEndpoint = `${ZETTABLOCK_API_URL}/queryruns/${queryrunId}/status`;
    while (true) {
      const res = await fetch(queryrunStatusEndpoint, getOptions);
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
          `${ZETTABLOCK_API_URL}/stream/queryruns/${submissionQueryrunId}/result` +
          '?' +
          URLparams;
        const res = await fetch(queryrunResultEndpoint, { ...textOptions });
        const csvData = await res.text();
        fs.writeFileSync('./result.csv', csvData, { encoding: 'utf8', flag: 'w' });
        console.log('CSV data saved to result.csv');
      }
      else if (response === 'FAILED') {
        console.log('Query failed. Please check the status message for details.');
      }
      else {
        console.log('Unexpected query result status:', response);
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