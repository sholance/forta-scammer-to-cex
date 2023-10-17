import fetch from 'node-fetch';
const API_KEY = "2f9e9143-604c-4900-ae88-d67fc9449a2a";

const options = {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'X-API-KEY': API_KEY,
  },
};

const getCex = async () => {
  const MAX_TRIES = 3;
  const API_KEY = process.env.ZETTABLOCK_API_KEY;
  let tries = 0;
  let cexAddresses = [];

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

  const createQueryRes = await fetch(
    'https://api.zettablock.com/api/v1/databases/AwsDataCatalog/queries',
    {
      ...options,
      body: JSON.stringify({
        query,
      }),
    }
  );

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
    const MAX_TRIES = 3;
    let tries = 0;

    const queryrunStatusEndpoint = `https://api.zettablock.com/api/v1/queryruns/${queryrunId}/status`;
    let i = 1;
    while (true) {
      const res = await fetch(queryrunStatusEndpoint, options);
      const state = (await res.json()).state;
      if (state === 'SUCCEEDED' || state === 'FAILED') {
        return state;
      }
      await new Promise(resolve => setTimeout(resolve, i));
      i += 1;
    }

    throw new Error('Maximum number of tries exceeded.');
  };

  while (tries < MAX_TRIES) {
    try {
      const response = await getResponse(submissionQueryrunId);
      console.log('Query Run Response:', response);

      if (response === 'SUCCEEDED') {
        const params = { includeColumnName: 'true' };
        const queryrunResultEndpoint = `https://api.zettablock.com/api/v1/stream/queryruns/${submissionQueryrunId}/result`;
        const res = await fetch(queryrunResultEndpoint, { ...options, body: JSON.stringify(params) });
        const queryrunResult = await res.json();
        console.log('Query Run Result:', queryrunResult);
      } else {
        console.log('Query failed. Please check the status message for details.');
      }
      break;
    } catch (err) {
      tries++;
      if (tries === MAX_TRIES) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

export { getCex };