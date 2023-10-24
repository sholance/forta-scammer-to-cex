import {
  Finding,
  FindingSeverity,
  FindingType,
  Initialize,
  TransactionEvent,
  ethers,
} from 'forta-agent';
import {
  ALERT_ERC20_ASSET_DEPOSIT,
  CEX_ADDRESSES,
  TRANSFER_EVENT,
  CEX_ADDRESSES_v2,
} from './constants';
import { getCex } from './newQuery';
import { processFindings } from './processFindings';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { isScammer } from './scammerScan';
import { getTokenSymbol } from './utils';

let transactionsProcessed = 0;
let lastBlock = 0;
let cexList = new Set();

const initialize: Initialize = async () => {

  const csvFilePath = path.resolve(__dirname, '../result.csv');
  const fileExists = fs.existsSync(csvFilePath);
  if (!fileExists) {
    await getCex();
  } else {
    console.log('CSV file exists. Skipping getCex query.');
    readAddressesFromFile();
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

    function isCsvAddress(address: string): boolean {
      return cexList.has(address);
    }

    const cexDepositAddress = to as string;

    const transfers = txEvent.filterLog([TRANSFER_EVENT]);


    if (CEX_ADDRESSES.includes(to!) || CEX_ADDRESSES_v2.includes(to!) || isCsvAddress(to!)) {
      let block = txEvent.blockNumber
      const cexName = getCexName(to!);
      const isFromScammer = await isScammer(from); // Check if from address is a scammer
      const txValue = ethers.BigNumber.from(value);

      if (isFromScammer) {
        const symbol = await getTokenSymbol(block, from)

        findings.push(
          Finding.fromObject({
            name: 'Known Scammer Asset Deposit',
            description: `Known scammer ${from} deposited ${txValue} ${symbol} to CEX ${cexDepositAddress} ${"cexName"}`,
            alertId: ALERT_ERC20_ASSET_DEPOSIT,
            severity: FindingSeverity.Low,
            type: FindingType.Info,
            metadata: {
              source_address: from,
              amount: value,
              // symbol: "symbol"!,
              // 'ERC-20-contract-address': to!,
              // CEX_deposit_address: cexDepositAddress,
              // CEX_name: cexName,
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

function getCexName(address: string): string {
  return 'Cex';
}

const inputFile = path.resolve(__dirname, '../result.csv');

async function readAddressesFromFile(): Promise<void> {
  const addresses: { to_address: string; from_address: string; name: string }[] = [];

  const parser = fs.createReadStream(inputFile).pipe(
    parse({
      delimiter: ',',
      columns: true,
    })
  );

  parser
    .on('data', function (record) {
      addresses.push({
        to_address: record.to_address,
        from_address: record.from_address,
        name: record.name,
      });
    })
    .on('error', function (error) {
      console.error('An error occurred while parsing the CSV file:', error);
    })
    .on('end', function () {
      for (const address of addresses) {
        cexList.add(address.to_address);
      }
      console.log(addresses.length);
    });
}

export default {
  initialize,
  handleTransaction,
};