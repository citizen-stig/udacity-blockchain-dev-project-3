import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from '../../config/contract.json';
import Oracles from './oracles.json';
import Web3 from 'web3';
import express from 'express';
import crypto from 'crypto';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const fundFee = web3.utils.toWei("10.5", "ether");

// oracle is the object with address and pk from oracles.json
const registerOracle = (oracle) => {
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
                // Uncomment this to process for all past events
                // {fromBlock: 0},
                handleOracleRequest({account, indexes}));
        })
}


const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

const STATUSES = [
    STATUS_CODE_ON_TIME,
    STATUS_CODE_LATE_AIRLINE,
    STATUS_CODE_LATE_WEATHER,
    STATUS_CODE_LATE_TECHNICAL,
    STATUS_CODE_LATE_OTHER
];


const getStatus = (index, airline, flight, timestamp) => {
    if (flight === 'Oceanic 815') {
        return STATUS_CODE_LATE_AIRLINE;
    } else if (flight === 'LE7701') {
        return STATUS_CODE_ON_TIME;
    }
    let key = String(index) + airline + flight + String(timestamp);
    let hash = crypto
        .createHash("sha256")
        .update(key)
        .digest("hex");
    let statusIndex = Number("0x" + hash) % STATUSES.length;
    // TODO: add random variation
    return STATUSES[statusIndex];

}

// oracle is object with account and indexes, built by register oracle
const handleOracleRequest = ({account, indexes}) => {
    return (error, event) => {

        let index = event.returnValues.index;
        if (indexes.includes(index)) {
            console.log(`Oracle ${account.address} is handling event ${event.id}:`, event.returnValues);
            let airline = event.returnValues.airline;
            let flight = event.returnValues.flight;
            let timestamp = event.returnValues.timestamp;
            console.log(
                `Oracle ${account.address} is going to proceed with `
                + `request for status of flight ${flight} : ${timestamp} from airline ${airline}, because ${index}`);
            // Choosing status
            let statusCode = getStatus(index, airline, flight, timestamp);
            console.log(`Oracle ${account.address} sends: `, {
                index,
                airline,
                flight,
                timestamp,
                statusCode});
            flightSuretyApp.methods
                .submitOracleResponse(index, airline, flight, timestamp, statusCode)
                .send({
                    from: account.address,
                    gas: 6721975,
                })
                .then(() => console.log(`SUCCESS for oracle ${account.address} and ${flight} : ${timestamp} from airline ${airline}`))
                .catch(e => console.log(`ERROR for oracle ${account.address} and ${flight} : ${timestamp} from airline ${airline}. Maybe request is closed already`));
        } else {
            // console.log(`Oracle ${account.address} is going to skip event ${event.id}`);
        }
    };
};

Oracles.oracles.forEach(registerOracle);
console.log("All Oracles registered...")


flightSuretyApp.events.OracleRequest({
    fromBlock: 0
}, function (error, event) {
    if (error) console.log(error)
    console.log(event)
});

const app = express();

app.get('/api', (req, res) => {
    res.send({
        message: 'An API for use with your Dapp!'
    })
})

export default app;
