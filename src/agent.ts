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
  cachedLabels = await fetchLabels();
  // const resCex = await getCex();
  // console.log(resCex);
};

async function fetchLabels(): Promise<Label[]> {
  let startingCursor = undefined;

  try {
    const results: LabelsResponse = await getLabels({
      sourceIds: [SCAMMER_BOT_ID],
      createdSince: 1696114800000,
      labels: ['scammer'],
      startingCursor
    });
    startingCursor = results.pageInfo.endCursor;

    console.log('Labels fetched:', results.labels.length);

    return results.labels;
  } catch (error) {
    console.error('An error occurred while fetching labels:', error);
    return [];
  }
}

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
  console.log(cachedLabels?.length)

  // Refresh cached labels every 300 blocks
  if (lastBlock % 300 === 0) {
    cachedLabels = await fetchLabels();
  }

    try {
      const { from, to, transaction } = txEvent;
      const { value } = transaction;
      // const resCex = await getCex();
      // console.log(resCex);
      const cexDepositAddress = to as string;

      const transfers = txEvent.filterLog([TRANSFER_EVENT]);
      // Check if the to address is in CEX_ADDRESSES
      if (CEX_ADDRESSES.includes(to!) || CEX_ADDRESSES_v2.includes(to!)) {
        const cexName = getCexName(to!); // Function to retrieve the CEX name based on the address,
        const scammerLabel = cachedLabels?.find((label) => label.metadata?.address_type === 'EOA' && from?.includes(label.entity));
        // cheks to see if the from address is an EOA and labelled scammer
        if (scammerLabel) {
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
      console.error('An error occurred while processing the transaction:', error);
    }

  processFindings(findings);

  return findings;
}

function getCexName(address: string): string {
  // Function to retrieve the CEX name based on the address
  // will be gotten from zettablock label
  return 'Cex';
}

export default {
  initialize,
  handleTransaction,
};