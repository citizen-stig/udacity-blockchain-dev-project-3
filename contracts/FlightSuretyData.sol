// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./OperationalControl.sol";

contract FlightSuretyData is OperationalControl {
    using SafeMath for uint256;

    mapping(address => bool) private authorizedCallers;

    struct Airline {
        bool isRegistered;
        bool isAuthorized;
        uint256 fundsProvided;
        uint256 createdAt;
        address[] votes;
        mapping(address => bool) votedFor;
    }

    mapping(address => Airline) private airlines;
    uint256 public numberOfRegisteredAirlines;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    constructor() public {
        airlines[msg.sender].isRegistered = true;
        airlines[msg.sender].createdAt = block.timestamp;
        numberOfRegisteredAirlines = 1;
    }


    modifier requireAuthorizedCaller() {
        require(authorizedCallers[msg.sender], "Caller is not authorized");
        _;
    }

    function authorizeCaller(address caller) external requireContractOwner {
        authorizedCallers[caller] = true;
    }

    function deAuthorizeCaller(address caller) external requireContractOwner {
        authorizedCallers[caller] = false;
    }

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */

    //    function enqueueNewAirline(address newAirline, address existingAirline) requireAuthorizedCaller external {
    //        require(airlines[newAirline].isRegistered == false, "Airline already registered");
    //        require(airlines[existingAirline].votedFor[newAirline] == false, "Duplicate voting");
    //        require()
    //
    //        airlines[existingAirline].votedFor[newAirline] = true;
    //        if (airlines[newAirline].createdAt == 0) {
    //            airlines[newAirline].createdAt = block.timestamp;
    //        }
    //
    //        airlines[newAirline].votes.push(existingAirline);
    //    }
    //
    //    function getVotes(address newAirline) external view returns (uint){
    //        return airlines[newAirline].votes.length;
    //    }

    function registerAirline(address newAirline, address existingAirline) requireAuthorizedCaller external {
        require(airlines[existingAirline].isAuthorized, "Airline is not authorized");
        require(airlines[newAirline].isRegistered == false, "Airline already registered");

        airlines[newAirline].isRegistered = true;
        numberOfRegisteredAirlines += 1;

    }

    function isRegisteredAirline(address airline) external view returns (bool) {
        return airlines[airline].isRegistered;
    }

    function isAuthorizedAirline(address airline) external view returns (bool) {
        return airlines[airline].isAuthorized;
    }

    function fundAirline(address airline) requireAuthorizedCaller external payable {
        require(airlines[airline].isRegistered, "Airline is not registered");
        airlines[airline].fundsProvided = airlines[airline].fundsProvided + msg.value;
    }

    function authorizeAirline(address airline) requireAuthorizedCaller external {
        airlines[airline].isAuthorized = true;
    }

    function getTotalFundsProvidedByAirline(address airline) external view returns (uint256) {
        return airlines[airline].fundsProvided;
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy() external payable {}

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees() external pure {}

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay() external pure {}

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund() public payable {

    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    fallback() external payable {
        fund();
    }
}
