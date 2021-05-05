.PHONY: all test clean

init:
	npm install
	npm run deploy-contracts

test:
	npm run test

ganache:
	ganache-cli --gasLimit 900000000 -a 100 -e 10000 -m "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"

