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
  ERC20_TRANSFER_FUNCTION,
} from './constants';
import { STATIC_CEX_ADDRESSES } from './staticAddresses';

let transactionsProcessed = 0;

let lastBlock = 0;
let cexList: Set<string> = new Set();
let addresses: Map<string, { name: string }> = new Map();
let addressList: { to_address: string; from_address: string; name: string }[] = [];


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
    const {
      from,
      to,
      transaction: { value, data },
    } = txEvent;

    if (to && value != "0x0") {
      // Native transfer
      const cexDepositAddress = to as string;
      const provider = getEthersProvider();
      const { chainId } = await provider.getNetwork();
      const addressInStaticCexAddresses = STATIC_CEX_ADDRESSES[chainId].some((item) => item.address.toLowerCase() === cexDepositAddress.toLowerCase());
      const addressInAddressesList = addressList.some((item) => item.to_address.toLowerCase() === cexDepositAddress.toLowerCase());
      if (addressInAddressesList || addressInStaticCexAddresses) {
        const isFromScammer = await isScammer(from); // Check if from address is a scammer
        const txValue = ethers.utils.formatEther(value);

        if (isFromScammer) {
          const provider = getEthersProvider();
          const { chainId } = await provider.getNetwork();
          let symbol = NATIVE_TOKEN_SYMBOL[chainId];

          const cexInfo = await getCexInfo(cexDepositAddress);
          findings.push(
            Finding.fromObject({
              name: 'Known Scammer Asset Deposit',
              description: `Known scammer ${from} deposited ${txValue} ${symbol} to CEX ${cexDepositAddress} ${cexInfo.name}`,
              alertId: ALERT_NATIVE_ASSET_DEPOSIT,
              severity: FindingSeverity.Low,
              type: FindingType.Info,
              metadata: {
                source_address: from,
                amount: `${txValue}`,
                symbol: `${symbol}`,
                CEX_deposit_address: to,
                CEX_name: `${cexInfo.name}`,
              },
            })
          );
        }
      }
    }
    const transferFunctions = txEvent.filterFunction(ERC20_TRANSFER_FUNCTION);

    if (transferFunctions.length) {
      // ERC-20 transfer
      await Promise.all(
        transferFunctions.map(async (transfer) => {
          const erc20ContractAddress = transfer.address;
          const cexDepositAddress = to as string;
          const erc20TokenValue = ethers.BigNumber.from(data);
          const block = txEvent.blockNumber;
          const isFromScammer = await isScammer(from); // Check if from address is a scammer
          let symbol = await getTokenSymbol(block - 1, erc20ContractAddress);
          const provider = getEthersProvider();
          const { chainId } = await provider.getNetwork();
          const addressInStaticCexAddresses = STATIC_CEX_ADDRESSES[chainId].some((item) => item.address.toLowerCase() === cexDepositAddress.toLowerCase());
          const addressInAddressesList = addressList.some((item) => item.to_address.toLowerCase() === cexDepositAddress.toLowerCase());
          
          if (addressInAddressesList || addressInStaticCexAddresses) {
            if (isFromScammer) {
              const cexInfo = await getCexInfo(cexDepositAddress);
              findings.push(
                Finding.fromObject({
                  name: 'Known Scammer ERC-20 Asset Deposit',
                  description: `Known scammer ${from} deposited ${erc20TokenValue} ${symbol} to CEX ${cexDepositAddress} ${cexInfo.name}`,
                  alertId: ALERT_ERC20_ASSET_DEPOSIT,
                  severity: FindingSeverity.Low,
                  type: FindingType.Info,
                  metadata: {
                    source_address: from,
                    amount: `${erc20TokenValue}`,
                    symbol: `${symbol}`,
                    ERC_20_contract_address: erc20ContractAddress,
                    CEX_deposit_address: to!,
                    CEX_name: `${cexInfo.name}`,
                  },
                })
              );
            }
          }
        })
      );
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
        addressList.push({
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
        resolve();
      });
  });
}

async function getCexInfo(address: string): Promise<{ name: string }> {
  const provider = getEthersProvider();
  const { chainId } = await provider.getNetwork();
  const staticCex = STATIC_CEX_ADDRESSES[chainId]?.find(
    (item) => item.address.toLowerCase() === address.toLowerCase()
  );
  if (staticCex) {
    return { name: staticCex.name };
  }

  const addressListItem = addressList.find(
    (item) => item.to_address.toLowerCase() === address.toLowerCase()
  );
  if (addressListItem) {
    return { name: addressListItem.name };
  }

  return { name: "" };
}

export default {
  initialize,
  handleTransaction,
};