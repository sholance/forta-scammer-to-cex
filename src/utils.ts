import { ethers } from "ethers";
import { SYMBOL_ABI_LIST } from "./constants";
import { getEthersProvider, Network } from "forta-agent";

export const getTokenSymbol = async (block: number, address: string): Promise<string> => {
    const provider = getEthersProvider()
    for (const abi of SYMBOL_ABI_LIST) {
        try {
            const contract = new ethers.Contract(address, [abi], provider);
            const symbol = await contract.symbol();
            return symbol;
        } catch (error) {
            continue;
        }
    }

    return 'UNKNOWN';
};
export const NATIVE_TOKEN_SYMBOL: { [chainId: number]: string } = {
    [Network.MAINNET]: 'ETH',
    [Network.POLYGON]: 'MATIC',
    [Network.BSC]: 'BNB',
    [Network.ARBITRUM]: 'ARB',
    [Network.OPTIMISM]: 'OP',
    [Network.AVALANCHE]: 'AVAX',
    [Network.FANTOM]: 'FTM',
  };