import {
  Finding,
  FindingSeverity,
  FindingType,
  Initialize,
  TransactionEvent,
  getEthersProvider,
} from 'forta-agent';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { ethers } from 'ethers';
import { getCex } from './newQuery';
import { processFindings } from './processFindings';
import { isScammer } from './scammerScan';
import { getTokenSymbol, NATIVE_TOKEN_SYMBOL } from './utils';
import {
  ALERT_ERC20_ASSET_DEPOSIT,
  ALERT_NATIVE_ASSET_DEPOSIT,
  CEX_ADDRESSES,
  CEX_ADDRESSES_v2,
} from './constants';

let transactionsProcessed = 0;
let lastBlock = 0;
let cexList: Set<string> = new Set();
let addresses: Map<string, { name: string }> = new Map();
let addresses2: { to_address: string; from_address: string; name: string }[] = [];


const initialize: Initialize = async () => {
  const csvFilePath = path.resolve(__dirname, '../result.csv');
  const fileExists = fs.existsSync(csvFilePath);

  if (!fileExists) {
    console.log('Running query to getCex');
    await getCex();
  } else {
    console.log('CSV file exists. Skipping getCex query.');
    await readAddressesFromFile();
  }
};

export async function handleTransaction(txEvent: TransactionEvent): Promise<Finding[]> {
  const findings: Finding[] = [];

  if (txEvent.blockNumber !== lastBlock) {
    lastBlock = txEvent.blockNumber;
    console.log(`-----Transactions processed in block ${txEvent.blockNumber - 1}: ${transactionsProcessed}-----`);
    transactionsProcessed = 0;
  }
  transactionsProcessed += 1;

  try {
    const { from, to, transaction } = txEvent;
    const { value } = transaction;
    const cexDepositAddress = to as string;
    if (
      cexList.has(cexDepositAddress) ||
      CEX_ADDRESSES.includes(cexDepositAddress) ||
      CEX_ADDRESSES_v2.includes(cexDepositAddress)
    ) {
      const block = txEvent.blockNumber;
      const isFromScammer = await isScammer(from); // Check if from address is a scammer
      const txValue = ethers.BigNumber.from(value);

      if (isFromScammer) {
        const provider = getEthersProvider();
        const { chainId } = await provider.getNetwork();
        let symbol = NATIVE_TOKEN_SYMBOL[chainId];

        if (symbol === '') {
          symbol = await getTokenSymbol(block -1, from);
        }

        const cexInfo = await getCexInfo(cexDepositAddress);
        findings.push(
          Finding.fromObject({
            name: 'Known Scammer Asset Deposit',
            description: `Known scammer ${from} deposited ${txValue} ${
              symbol === '' ? 'UNKNOWN' : symbol
            } to CEX ${cexDepositAddress} ${cexInfo.name}`,
            alertId: symbol === '' ? ALERT_ERC20_ASSET_DEPOSIT : ALERT_NATIVE_ASSET_DEPOSIT,
            severity: FindingSeverity.Low,
            type: FindingType.Info,
            metadata: {
              source_address: from,
              amount: `${txValue}`,
              symbol: `${symbol === '' ? 'UNKNOWN' : symbol}`,
              CEX_deposit_address: to!,
              CEX_name: `${cexInfo.name}`,
            },
          })
        );
      }
    }
  } catch (error) {
    console.error('An error occurred while processing the transaction:', error);
  }

  processFindings(findings);

  return findings;
}


const inputFile = path.resolve(__dirname, '../result.csv');

async function readAddressesFromFile(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const parser = fs.createReadStream(inputFile).pipe(
      parse({
        delimiter: ',',
        columns: true,
      })
    );

    parser
      .on('data', function (record) {
        addresses2.push({
          to_address: record.to_address,
          from_address: record.from_address,
          name: record.name,
        });
        const { to_address, name } = record;
        addresses.set(to_address, { name });
        cexList.add(to_address);
      })
      .on('error', function (error) {
        console.error('An error occurred while parsing the CSV file:', error);
        reject(error);
      })
      .on('end', function () {
        console.log('CSV file parsing completed.');
        // console.log('Number of sec address list', addresses2.length)
        // console.log('Number of addresses:', addresses.size);
        // console.log('Number of cexes:', cexList.size);
        resolve();
      });
  });
}

function getCexInfo(address: string): { name: string } {
  return addresses2.find((item) => item.to_address.toLowerCase() === address.toLowerCase()) || { name: '' };
}
export default {
  initialize,
  handleTransaction,
};