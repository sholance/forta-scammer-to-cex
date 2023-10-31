import { handleTransaction } from './agent';
import { TestTransactionEvent } from "forta-agent-tools/lib/test";

const mockTxEvent = new TestTransactionEvent().setBlock(10);

describe('handleTransaction', () => {
  it('should return an empty array when no findings are present', async () => {
    const txEvent = {
      blockNumber: 1,
      from: '0x123',
      to: '0x456',
      transaction: {
        value: '0x0',
        data: '',
      },
      filterFunction: jest.fn(),
    };
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toEqual([]);
  });

  it('should return an array with a finding when a known scammer deposits native asset to a CEX', async () => {
    const txEvent = {
      blockNumber: 1,
      from: '0x123',
      to: '0x456',
      transaction: {
        value: '0x123',
        data: '',
      },
      filterFunction: jest.fn(),
    };
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toHaveLength(1);
    expect(findings[0].name).toEqual('Known Scammer Asset Deposit');
  });

  it('should return an array with a finding when a known scammer deposits ERC-20 asset to a CEX', async () => {
    const txEvent = {
      blockNumber: 1,
      from: '0x123',
      to: '0x456',
      transaction: {
        value: '0x0',
        data: '0xa9059cbb0000000000000000000000001234567890123456789012345678901234567890' // ERC-20 transfer function
      },
      filterFunction: jest.fn(),
    };
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toHaveLength(1);
    expect(findings[0].name).toEqual('Known Scammer ERC-20 Asset Deposit');
  });
});