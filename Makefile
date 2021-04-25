dev:
	truffle deploy
	npm run dev

test:
	truffle test --stacktrace

run-ganache:
	ganache-cli -m "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
