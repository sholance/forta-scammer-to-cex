export const SCAMMER_BOT_ID = '0x1d646c4045189991fdfd24a66b192a294158b839a6ec121d740474bdacb3ab23';
export const ONE_DAY_IN_SECS = 60 * 60 * 24;
export const FP_BUYER_TO_SELLER_MIN_TRANSFERRED_TOKEN_VALUE = 10; // In USD
export const ERC20_TRANSFER_FUNCTION = 'event Transfer(address indexed from, address indexed to, uint256 value)';
export const ALERT_NATIVE_ASSET_DEPOSIT = 'NATIVE-ASSET-DEPOSIT';
export const ALERT_ERC20_ASSET_DEPOSIT = 'ERC20-ASSET-DEPOSIT';
export const ERC_721_TRANSFER_EVENT =
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)";
export const TRANSFER_EVENT = "event Transfer(address indexed from, address indexed to, uint256 value)";
export const ZETTABLOCK_API_URL = 'https://api.zettablock.com/api/v1';
export const query = `
SELECT
  t.from_address,
  t.to_address,
  t.hash,
  t.block_time,
  l.address,
  l.author,
  l.id,
  l.name,
  l.source,
  l.type,
  l.process_time
FROM
  ethereum_mainnet.transactions t
JOIN
  ethereum_mainnet.labels l ON t.to_address = l.address
WHERE
  l."type" = 'owner'
  AND l.name IN ('binance', 'coinbase', 'kraken', 'bitfinex','binanceus','bitgo team','bittrue', 'poloniex', 'kucoin', 'bittrex','crypto.com','binance 15','gateio','peatio', 'huobi', 'okex','okx','mexc','fixfloat', 'bitstamp', 'gemini')
  AND "data_creation_date" > DATE('2023-10-01')
  AND t.from_address NOT IN (SELECT address FROM ethereum_mainnet.contract_creations)
ORDER BY
  t.block_number
`
export const SYMBOL_ABI_LIST = [
  'function symbol() public view returns (string)',
  'function symbol() public view returns (string memory)',
  'function symbol() public view override returns (string memory)',
  'function symbol() external view returns (string)',
  'function symbol() external view returns (string memory)',
  'function symbol() public pure returns (string)',
  'function symbol() public pure returns (string memory)',
  'function symbol() public virtual view returns (string)',
  'function symbol() public virtual view returns (string memory)',
  'function symbol() public virtual override view returns (string memory)'
];