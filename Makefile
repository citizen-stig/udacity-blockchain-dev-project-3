dev:
	truffle deploy
	npm run dev

test:
	truffle test --stacktrace

run-ganache:
	ganache-cli -a 100 -e 10000 -m "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
