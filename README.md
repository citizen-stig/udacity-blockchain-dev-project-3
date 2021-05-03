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

Following accounts private keys are available for testing

Airlines
```
0xfe4a75c9f60c3603cee8cb69f7cac0ad88801203ab5f695ef13dc5b5495d3510
0x057e71d5a5c8b28b1b2ab01f5437615b361133c5a9cafb4628c53c358679eba7
0x33cbde8007970709c53861ab84a5d31b6e4ab00c84929eb7b000df80074daca5
0x29020a147a9a3a4e402a038599c6c5f157ba91549009eef54a4957a76074d3d8
0xf3c918b50dcb151c23144e8c25bb6d552cfc25e5909256b0dac7522592d74204
0x034a243af2431f1794d9420e0f36cdcd1cb071497c2a36ff3ca929ea7499861c
0x5ac547bde75f0aec26c6fdd4278d0cd6933277d9914b684281e2b2d533145e6e
0xe2f4a1732274e5edbe9dae2eb482810fecd0a510f5fdf4fd6fd934cde6c401a0
0xaf6ba11a71954a0916e7fb4557e0e30b6ca5975ec14b8e457e19f12a1c609d7a
0x49787c73c5a139c42e58b1e4b3c59bcc2fe72b0c8345136d197b9cedd092e5ce
```

Passengers
```
0x589f0bc3a588ad18bdf50b93c84cecc9fa9134da62c94ecb4f0a6534eb62776e
0x9a59c255ef50bcabe369c1343c7b5235d86caff36c9ba5de465588426da3b6c3
0xaa5402e8178457ef86993ea24a0f6af633cccb57a0af1bec6caaa9b0819358da
0x9b70c37df67537a52d433211f9858cfeda91152f7372c537ad74bb533e7fba87
0xf0b5a95fbf8188ee6667aaf4538f3fc26c89784601d5aba381e7166e363db788
0x9bd2c5a5110aa8c2b765faf67d63603a208cd56b81854881531432b99b3c32f8
0xfc11b86a50199f64c91f8839cbc2425da9501822d3d05f9fcb6e0f412fe633ce
0x4d426c06e44d984c0c3aff38b77414e6cdb629651545f6d76e1cc2419d1ef92f
0x708bcf12774aa3c7d0d6089d1e193726eb48bec7f40b99b2477251b8359a34c0
0x2c38eb78d917bbd73bae4f9c84296e8a5875fa4b12ba0f6385e7b464eff80538

```


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)
