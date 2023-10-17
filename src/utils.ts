import { ethers, providers } from "ethers";
import { SYMBOL_ABI_LIST } from "./constants";
import { getEthersProvider } from "forta-agent";

export const getTokenSymbol = async (block: number, tokenAddress: string): Promise<string> => {
    const provider = getEthersProvider()
    for (const abi of SYMBOL_ABI_LIST) {
        try {
            const contract = new ethers.Contract(tokenAddress, [abi], provider);
            const symbol = await contract.symbol();
            return symbol;
        } catch (error) {
            continue;
        }
    }

    return 'UNKNOWN';
};