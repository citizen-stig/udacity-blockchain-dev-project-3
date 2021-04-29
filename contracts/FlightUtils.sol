// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12;

contract FlightUtils {

    function getFlightKey(address airline, string memory flight, uint256 timestamp) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }
}
