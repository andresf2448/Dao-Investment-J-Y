// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

interface IStrategyAdapter {
  function execute(address vault, uint8 action, uint256 amount) external;
  function poolAddress() external view returns (address);
}