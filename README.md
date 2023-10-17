# NFT SVG Image XSS Detection

## Description

This Forta Bot is designed to detect potential Cross-Site Scripting (XSS) vulnerabilities in SVG images used in NFTs (Non-Fungible Tokens). SVG images are commonly used in NFTs to provide visual representation and artistic elements. However, SVG images can include executable code, which can pose a security risk if not properly validated.

XSS vulnerabilities occur when SVG images contain malicious code that can be executed within a user's browser. This can lead to various security issues, such as unauthorized data access, session hijacking, or arbitrary code execution.

The NFT SVG Image XSS Detection Bot analyzes SVG images associated with NFT transactions and alerts if any potential XSS vulnerabilities are identified.

You can learn more about Cross-Site Scripting (XSS) vulnerabilities and their impact [here](https://owasp.org/www-community/attacks/xss/).

For documentation on how to build your own Forta Bot, refer to the [here](https://docs.forta.network/en/latest/).

## Supported Chains

- Ethereum
- Optimism
- BNB Smart Chain
- Polygon
- Fantom
- Arbitrum
- Avalanche

## Alerts

- XSS-1

  - Triggered when an SVG image used in an NFT transaction contains potential XSS vulnerabilities.
  - Severity: "high" (always)
  - Type: "security" (always)
  - Metadata includes:
    - `anomalyScore`: A score indicating the level of anomaly of the alert (ranging from 0 to 1).
      - The score is calculated by dividing the number of `XSS-1` alerts by the total number of NFT transactions processed by the bot.
  - Labels:
    - Label 1:
      - `entity`: The transaction's hash
      - `entityType`: The type of the entity, always set to "Transaction"
      - `label`: The type of the label, always set to "XSS Vulnerability"
      - `confidence`: The confidence level of the transaction containing an XSS vulnerability (ranging from 0 to 1). Always set to `1`.
      - `remove`: A boolean indicating whether the label is removed. Always set to `false`.
    - Label 2:
      - `entity`: The SVG image URL
      - `entityType`: The type of the entity, always set to "URL"
      - `label`: The type of the label, always set to "XSS Vulnerable Image"
      - `confidence`: The confidence level of the SVG image containing an XSS vulnerability (ranging from 0 to 1). Always set to `0.9`.
      - `remove`: A boolean indicating whether the label is removed. Always set to `false`.

- XSS-2

  - Triggered when an SVG image used in an NFT transaction contains potential XSS vulnerabilities, but with a lower confidence level compared to XSS-1 alerts.
  - Severity: "medium" (always)
  - Type: "security" (always)
  - Metadata includes:
    - `anomalyScore`: A score indicating the level of anomaly of the alert (ranging from 0 to 1).
      - The score is calculated by dividing the number of `XSS-2` alerts by the total number of NFT transactions processed by the bot.
  - Labels:
    - Label 1:
      - `entity`: The transaction's hash
      - `entityType`: The type of the entity, always set to "Transaction"
      - `label`: The type of the label, always set to "XSS Vulnerability"
      - `confidence`: The confidence level of the transaction containing an XSS vulnerability (ranging from 0 to 1). Always set to `0.8`.
      - `remove`: A boolean indicating whether the label is removed. Always set to `false`.
    - Label 2:
      - `entity`: The SVG image URL
      - `entityType`: The type of the entity, always set to "URL"
      - `label`: The type of the label, always set to "XSS Vulnerable Image"
      - `confidence`: The confidence level of the SVG image containing an XSS vulnerability (ranging from 0 to 1). Always set to `0.7`.
      - `remove`: A boolean indicating whether the label is removed. Always set to `false`.

- XSS-3

  - Triggered when an SVG image used in an NFT transaction contains potential XSS vulnerabilities, but with a lower confidence level compared to XSS-2 alerts.
  - Severity: "low" (always)
  - Type: "security" (always)
  - Metadata includes:
    - `anomalyScore`: A score indicating the level of anomaly of the alert (ranging from 0 to 1).
      - The score is calculatedby dividing the number of `XSS-3` alerts by the total number ofNFT transactions processed by the bot.
  - Labels:
    - Label 1:
      - `entity`: The transaction's hash
      - `entityType`: The type of the entity, always set to "Transaction"
      - `label`: The type of the label, always set to "XSS Vulnerability"
      - `confidence`: The confidence level of the transaction containing an XSS vulnerability (ranging from 0 to 1). Always set to `0.6`.
      - `remove`: A boolean indicating whether the label is removed. Always set to `false`.
    - Label 2:
      - `entity`: The SVG image URL
      - `entityType`: The type of the entity, always set to "URL"
      - `label`: The type of the label, always set to "XSS Vulnerable Image"
      - `confidence`: The confidence level of the SVG image containing an XSS vulnerability (ranging from 0 to 1). Always set to `0.5`.
      - `remove`: A boolean indicating whether the label is removed. Always set to `false`.

Note: The confidence levels provided for each alert type are based on the severity of the potential XSS vulnerability detected and can be adjusted as per the specific requirements of the implementation.