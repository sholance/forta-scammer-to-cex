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
import { ALERT_ERC20_ASSET_DEPOSIT, ALERT_NATIVE_ASSET_DEPOSIT, CEX_ADDRESSES, CEX_ADDRESSES_v2 } from './constants';

let transactionsProcessed = 0;
let lastBlock = 0;
let cexList: Set<string> = new Set();
let addresses: Map<string, { name: string }> = new Map();

const initialize: Initialize = async () => {
  const csvFilePath = path.resolve(__dirname, '../result.csv');
  const fileExists = fs.existsSync(csvFilePath);

  if (!fileExists) {
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

    if (cexList.has(cexDepositAddress) || CEX_ADDRESSES.includes(cexDepositAddress) || CEX_ADDRESSES_v2.includes(cexDepositAddress)) {
      const block = txEvent.blockNumber;
      const isFromScammer = await isScammer(from); // Check if from address is a scammer
      const txValue = ethers.BigNumber.from(value);

      if (isFromScammer) {
        const symbol = await getTokenSymbol(block, from);
        const provider = getEthersProvider()
        const cexInfo = getCexInfo(cexDepositAddress);
        const {chainId} = await provider.getNetwork()
        findings.push(
          Finding.fromObject({
            name: 'Known Scammer Asset Deposit',
            description: `Known scammer ${from} deposited ${txValue} ${NATIVE_TOKEN_SYMBOL[chainId]} to CEX ${cexDepositAddress} ${cexInfo.name}`,
            alertId: ALERT_NATIVE_ASSET_DEPOSIT,
            severity: FindingSeverity.Low,
            type: FindingType.Info,
            metadata: {
              source_address: from,
              amount: `${txValue}`,
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
  const parser = fs
    .createReadStream(inputFile)
    .pipe(
      parse({
        delimiter: ',',
        columns: true,
      })
    );

  parser
    .on('data', function (record) {
      addresses.set(record.to_address, { name: record.name });
      cexList.add(record.to_address);
    })
    .on('error', function (error) {
      console.error('An error occurred while parsing the CSV file:', error);
    })
    .on('end', function () {
      console.log(addresses.size);
    });
}

function getCexInfo(address: string): { name: string } {
  return addresses.get(address) || { name: '' };
}

export default {
  initialize,
  handleTransaction,
};