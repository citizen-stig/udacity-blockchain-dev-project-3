# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.


## Getting started

#### Prepare
First run ganache:

```
make ganache
```

Keep it running and open another terminal

Install dependencies and deploy contracts:

```
make init
```

To run tests:

```
make test
```

Tests cover following functionality:

*

#### Run

Run dapp

```
npm run dapp
```

Dapp can be accessed on [http://localhost:8000/](http://localhost:8000/)


In another terminal window run server with Oracles

```
npm run server
```

Server will be listening localhost:3000


#### Use

App has following functionality:

* Buy insurance for the flight
* Check flight status:
    * Status of flight is determined pseudo-randomly, based on it's number and timestamp
    * Flight "Oceanic 815" is always delayed because of airline
    * Flight "LE7701" is always on time
* Check balance of available for withdrawal
* Withdraw funds

All accounts are hardcoded in dapp, so Metamask is not needed.

Each action produces html section which is appended to the bottom.

Let's consider following scenario:

1. App is opened: it shows that contract is operational
1. Checking balance button shows how much ETH current account has stored in Insurance Smart Contract.
1. Choose flight "Oceanic 815" and enter 0.8 in "amount ETH" and click buy insurance
1. Check balance, should be still zero, funds are placed in insurance, but does not available for withdraw
1. Click "Submit to Oracles", "Flight Status" section should appear shortly
1. Check balance again, now it should show 1.4 ethere
1. Click withdraw
1. Check balance last time: it should be zero again, funds are moved back to account


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)
