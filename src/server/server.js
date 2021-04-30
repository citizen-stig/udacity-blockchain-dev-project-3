import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Oracles from './oracles.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const fundFee = web3.utils.toWei("10.5", "ether");

// oracle is the object with address and pk from oracles.json
const registerOracle = (oracle) => {
    console.log(oracle.pk);
    const account = web3.eth.accounts.privateKeyToAccount(oracle.pk);
    console.log(`Registering oracle ${oracle.address}..`);
    // const oracleData = {account: account};
    flightSuretyApp.methods.registerOracle()
        .send({from: account.address, value: fundFee, gas: 6721975,})
        .then(() => flightSuretyApp.methods.getMyIndexes().call({
            from: account.address,
            gas: 6721975,
        }))
        .then(indexes => {
            console.log(`Oracle ${oracle.address} has been registered and indexes ${indexes} received`);
            flightSuretyApp.events.OracleRequest(
                {fromBlock: 0},
                handleOracleRequest({account, indexes}));
        })
}


const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

// oracle is object with account and indexes, built by register oracle
const handleOracleRequest = ({account, indexes}) => {
    return (error, event) => {
        console.log(`Oracle ${account.address} is handling event ${event.id}`);
        let index = event.returnValues.index;
        if (indexes.includes(index)) {
            let airline = event.returnValues.airline;
            let flight = event.returnValues.flight;
            let timestamp = event.returnValues.timestamp;
            console.log(
                `Oracle ${account.address} is going to proceed with `
                + `request for status of flight ${flight} : ${timestamp} from airline ${airline}`);

            // Choosing status
            let statusCode = STATUS_CODE_ON_TIME;
            return flightSuretyApp.methods
                .submitOracleResponse(index, airline, flight, timestamp, statusCode)
                .send({
                    from: account.address,
                    gas: 6721975,
                });
        } else {
            console.log(`Oracle ${account.address} is going to skip event ${event.id}`);
        }
    };
};

Oracles.oracles.forEach(registerOracle);
console.log("All Oracles registered...")


// flightSuretyApp.events.OracleRequest({
//     fromBlock: 0
// }, function (error, event) {
//     if (error) console.log(error)
//     console.log(event)
// });

const app = express();

app.get('/api', (req, res) => {
    res.send({
        message: 'An API for use with your Dapp!'
    })
})

export default app;
