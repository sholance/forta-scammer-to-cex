# SCAMMER TO CEX FORTA BOT

## Description

This Forta Bot runs to detect known scammers deposits into centralized exchanges (CEXes). It generates the following types of alerts:

NATIVE-ASSET-DEPOSIT: This alert is triggered when a known scammer deposits native assets (e.g., ETH) into a CEX. The alert provides information about the source address, the amount deposited, the asset symbol, the CEX deposit address, and the CEX name.

ERC20-ASSET-DEPOSIT: This alert is triggered when a known scammer deposits ERC-20 tokens into a CEX. Along with the information provided in the NATIVE-ASSET-DEPOSIT alert, it also includes the ERC-20 contract address.

## Supported Chains

- Ethereum
- Optimism
- BNB Smart Chain
- Polygon
- Fantom
- Arbitrum
- Avalanche

## Alerts

Each alert includes the following metadata:

`source_address`: The address of the scammer EOA from which the assets were transferred.
`amount`: The amount transferred.
`symbol`: The name of the asset.
`ERC-20-contract-address` (for ERC20-ASSET-DEPOSIT alert): The address of the ERC-20 contract.
`CEX_deposit_address`: The CEX deposit address where the assets were transferred to.
`CEX_name`: The name of the CEX (e.g., Binance, Coinbase).
