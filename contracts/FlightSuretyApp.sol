// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./FlightSuretyData.sol";

contract FlightSuretyApp is OperationalControl {
    using SafeMath for uint256;

    FlightSuretyData private flightSuretyData;
    uint256 public constant MAX_INSURANCE = 1 ether;
    uint256 public constant AIRLINE_MIN_DEPOSIT = 10 ether;


    // Oracles
    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant ORACLE_REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    uint256 private constant PAYBACK_RATIO = 150;  // Percent

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    mapping(address => Oracle) private oracles;

    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses; // Mapping key is the status code reported
        mapping(address => bool) repliedOracles;
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Flight status codes
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp
    );

    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event FlightRefunded(
        address airline,
        string flight,
        uint256 timestamp
    );

    event OracleReport(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    constructor(address payable dataContract) OperationalControl() public {
        flightSuretyData = FlightSuretyData(dataContract);
    }

    function isOperational() public view override returns (bool) {
        return OperationalControl.isOperational() && flightSuretyData.isOperational();
    }

    modifier requireAuthorizedAirline(address airline) {
        require(flightSuretyData.isAuthorizedAirline(airline));
        _;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/



    /**
     * @dev Add an airline to the registration queue
     *
     */
    function registerAirline(
        address newAirline
    ) requireIsOperational external returns (bool success, uint256 votes) {
        require(flightSuretyData.isRegisteredAirline(msg.sender), "Airline is not registered");
        require(flightSuretyData.isAuthorizedAirline(msg.sender), "Airline is not authorized");
        if (flightSuretyData.numberOfRegisteredAirlines() <= 4) {
            flightSuretyData.registerAirline(newAirline);
            success = true;
            votes = 1;
        } else {
            uint256 newAirlineSignedUpAt = flightSuretyData.airlineSignedUpAt(newAirline);
            require(newAirlineSignedUpAt == 0
                || flightSuretyData.airlineSignedUpAt(msg.sender) <= newAirlineSignedUpAt,
                "Cannot vote for earlier airlines");
            flightSuretyData.enqueueAirlineForRegistration(newAirline, msg.sender);
            uint256 requiredVotes = (flightSuretyData.numberOfRegisteredAirlines() / 2) + 1;
            if (flightSuretyData.votesForAirline(newAirline) >= requiredVotes) {
                flightSuretyData.registerAirline(newAirline);
                success = true;
                votes = flightSuretyData.votesForAirline(newAirline);
            }
        }
        return (success, votes);
    }

    function isRegisteredAirline() external view returns (bool) {
        return flightSuretyData.isRegisteredAirline(msg.sender);
    }

    function isAuthorizedAirline() external view returns (bool) {
        return flightSuretyData.isAuthorizedAirline(msg.sender);
    }

    function fundInsurance() external payable {
        require(flightSuretyData.isRegisteredAirline(msg.sender), "Airline is not registered");
        flightSuretyData.fundAirline{value : msg.value}(msg.sender);
        if (flightSuretyData.getTotalFundsProvidedByAirline(msg.sender) >= AIRLINE_MIN_DEPOSIT) {
            flightSuretyData.authorizeAirline(msg.sender);
        }
    }

    /**
     * @dev Register a future flight for insuring.
     *
     */
    function registerFlight(
        string memory flight,
        uint256 timestamp
    ) requireAuthorizedAirline(msg.sender) external {
        flightSuretyData.registerFlight(msg.sender, flight, timestamp);
    }

    function isRegisteredFlight(
        address airline,
        string memory flight,
        uint256 timestamp
    ) external view returns (bool) {
        return flightSuretyData.isRegisteredFlight(airline, flight, timestamp);
    }

    function getFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp
    ) external view returns (uint8) {
        return flightSuretyData.getFlightStatus(airline, flight, timestamp);
    }

    function buyInsurance(
        address airline,
        string memory flight,
        uint256 timestamp
    ) requireAuthorizedAirline(airline) external payable {
        require(msg.value <= MAX_INSURANCE, "Cannot insure value this big");
        flightSuretyData.buyInsurance(airline, flight, timestamp, msg.sender);
    }

    function getInsuranceBalance(
        address airline,
        string memory flight,
        uint256 timestamp
    ) external view returns(uint256) {
        return flightSuretyData.getInsuranceBalance(airline, flight, timestamp, msg.sender);
    }

    function withdraw() external {
        flightSuretyData.withdraw(msg.sender);
    }


    /**
     *
     * ORACLES
     *
     */

    modifier requireRegisteredOracle(address oracle) {
        require(oracles[oracle].isRegistered, "Not registered as an oracle");
        _;
    }

    function registerOracle() external payable {
        require(msg.value >= ORACLE_REGISTRATION_FEE, "Insufficient registration fee");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered : true, indexes : indexes});
    }

    function getMyIndexes() requireRegisteredOracle(msg.sender) external view returns (uint8[3] memory) {
        return oracles[msg.sender].indexes;
    }

    function fetchFlightStatus(address airline, string memory flight, uint256 timestamp) external {
        uint8 index = getRandomIndex(msg.sender);
        bytes32 key = getOracleRequestKey(index, airline, flight, timestamp);

        oracleResponses[key] = ResponseInfo(msg.sender, true);

        emit OracleRequest(index, airline, flight, timestamp);
    }


    function submitOracleResponse(
        uint8 index,
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) external {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
            (oracles[msg.sender].indexes[1] == index) ||
            (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key = getOracleRequestKey(index, airline, flight, timestamp);
        require(
            oracleResponses[key].isOpen,
            "Flight or timestamp do not match oracle request"
        );

        require(
            !oracleResponses[key].repliedOracles[msg.sender],
            "Oracle already replied to this request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        emit OracleReport(airline, flight, timestamp, statusCode);

        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES
            && flightSuretyData.getFlightStatus(airline, flight, timestamp) == STATUS_CODE_UNKNOWN) {
            //            oracleResponses[key].isOpen = false;
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);
            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }

    }


    function generateIndexes(address account) internal returns (uint8[3] memory) {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random =
        uint8(
            uint256(
                keccak256(
                    abi.encodePacked(
                        blockhash(block.number - nonce++),
                        account
                    )
                )
            ) % maxValue
        );

        if (nonce > 250) {
            nonce = 0;
            // Can only fetch block hashes for last 256 blocks so we adapt
        }

        return random;
    }

    function getOracleRequestKey(
        uint8 index,
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(index, airline, flight, timestamp));
    }

    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) internal {
        require(flightSuretyData.getFlightStatus(airline, flight, timestamp) == STATUS_CODE_UNKNOWN, "This flight was processed already");
        flightSuretyData.updateFlightStatus(airline, flight, timestamp, statusCode);
        if (statusCode == STATUS_CODE_LATE_AIRLINE) {
            flightSuretyData.refundFlight(airline, flight, timestamp, PAYBACK_RATIO);
            emit FlightRefunded(airline, flight, timestamp);
        }
    }

}
