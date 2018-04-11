// this is our parent contract.
pragma solidity ^0.4.18;

contract Ownable {
  // state variables declaration.
  address owner;

  // modifiers declaration.
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  // constructor declaration.
  function Ownable() public {
    owner = msg.sender;
  }
}
