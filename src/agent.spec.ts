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

});