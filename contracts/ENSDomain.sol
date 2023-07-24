// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;


contract ENSDomain {

    struct Domain {
        address owner;
        uint256 startTime;
        uint256 charge;
        uint256 numberOfYears;
    }

    uint256 public oneYearCharge = 0.05 ether;
    uint8 public renewRatio = 12;
    uint256 constant private TO_SECONDS = 365 * 24 * 60 * 60; 
    address private owner;
    mapping(string => Domain) public domains;

    modifier onlyOwner() {
        require(msg.sender == owner, "Access denied: contract owner only!");
        _;
    }

    modifier isDomainFree(string memory _domain) {
        require(
            domains[_domain].owner == address(0) &&
            domains[_domain].startTime + domains[_domain].numberOfYears * TO_SECONDS < block.timestamp,
            "Error: This domain is occupied"
            );
            _;
    }

    constructor() {
        owner = msg.sender;
    }

    function register(
        string memory _domain,
        uint256 _years
    ) external payable isDomainFree(_domain) {
        require(_years >= 1, "Error: The number of years must be at least one!");
        require(_years <= 10, "Error: The number of years should be no more than ten!");
        require(msg.value == oneYearCharge * _years, "Error: The wrong amount of funds was transferred!");
        domains[_domain] = Domain(
            msg.sender,
            block.timestamp,
            msg.value,
            _years
        );
    }

    function getAddress(
        string memory _domain
    ) external view returns(address) {
        return domains[_domain].owner;
    }

    function setOneYearCharge(uint256 _charge) external onlyOwner() {
        oneYearCharge = _charge;
    }

    function withdraw() external onlyOwner() {
        require(address(this).balance > 0, "Error: No balance available for withdrawal!");
        payable(owner).transfer(address(this).balance);
    }

    function renew(string memory _domain, uint256 _years) external payable {
        require(msg.sender == domains[_domain].owner, "Access denied: domain owner only");
        require(_years > 0, "Error: It is not possible to renew the domain for less than one year");
        require(_years * TO_SECONDS + domains[_domain].numberOfYears < 10 * TO_SECONDS, "Error: You cannot extend the domain for a period longer than 10 years");
        require(msg.value == (renewRatio * oneYearCharge * _years) / 10, "Error: The wrong amount of funds was transferred!");
        domains[_domain].numberOfYears += _years;
    }

    function setRatio(uint8 _ratio) external onlyOwner() {
        renewRatio = _ratio;
    }

    receive() external payable {

    }

}