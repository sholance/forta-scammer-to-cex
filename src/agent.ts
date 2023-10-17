import {
  Finding,
  FindingSeverity,
  FindingType,
  Initialize,
  TransactionEvent,
  getLabels,
  LabelsResponse,
  Label,
} from 'forta-agent';

import {
  ALERT_ERC20_ASSET_DEPOSIT,
  CEX_ADDRESSES,
  TRANSFER_EVENT,
  SCAMMER_BOT_ID,
  CEX_ADDRESSES_v2
} from './constants';
import { getCex } from './newQuery';
import { processFindings } from './processFindings';

let transactionsProcessed = 0;
let lastBlock = 0;
let cachedLabels: Label[] | undefined;

const initialize: Initialize = async () => {
  // Initialize any necessary variables or configurations
};

export async function handleTransaction(txEvent: TransactionEvent): Promise<Finding[]> {
  const findings: Finding[] = [];

  if (txEvent.blockNumber !== lastBlock) {
    lastBlock = txEvent.blockNumber;
    console.log(`-----Transactions processed in block ${txEvent.blockNumber - 1}: ${transactionsProcessed}-----`);
    transactionsProcessed = 0;
  }

  transactionsProcessed += 1;
  // const resCex = await getCex();
  // console.log(resCex);
  if (txEvent.blockNumber % 300 === 0) {

    try {
      const { from, to, transaction } = txEvent;
      const { value } = transaction;
      // const resCex = await getCex();
      // console.log(resCex);
      const cexDepositAddress = to as string;

      const transfers = txEvent.filterLog([TRANSFER_EVENT]);
      if (!cachedLabels) {
        const results: LabelsResponse = await getLabels({
          sourceIds: [SCAMMER_BOT_ID],
          createdSince: 1696114800000,
          labels: ['scammer'],
          // first: 10000,
        });

        cachedLabels = results.labels;
      }

      // Check if the to address is in CEX_ADDRESSES
      if (transfers.length > 0 && (CEX_ADDRESSES.includes(to!) || CEX_ADDRESSES_v2.includes(to!))) {
        const cexName = getCexName(to!); // Function to retrieve the CEX name based on the address
        console.log(cachedLabels.length)

        // Check if the from address is a scammer and create a finding
        if (cachedLabels.some((label) => label.metadata?.address_type === 'EOA' && label.entity === from)) {
          findings.push(
            Finding.fromObject({
              name: 'Known Scammer Asset Deposit',
              description: `Known scammer ${from} deposited ${value} ${"symbol"} to CEX ${cexDepositAddress} ${cexName}`,
              alertId: ALERT_ERC20_ASSET_DEPOSIT,
              severity: FindingSeverity.Low,
              type: FindingType.Info,
              metadata: {
                source_address: from,
                amount: value,
                symbol: "symbol"!,
                'ERC-20-contract-address': to!,
                CEX_deposit_address: cexDepositAddress,
                CEX_name: cexName,
              },
            })
          );
        }
      }
    } catch (error) {
      // Handle the error here
      console.error('An error occurred while processing the transaction:', error);
    }
  }

  processFindings(findings);

  return findings;
}

function getCexName(address: string): string {
  // Function to retrieve the CEX name based on the address
  // Replace with the actual implementation
  return 'Binance';
}

export default {
  initialize,
  handleTransaction,
};