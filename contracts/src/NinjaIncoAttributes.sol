// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {e, ebool, euint256, inco} from "@inco/lightning/src/Lib.sol";

interface INinjaPlayerRegistry {
    function isRegistered(address wallet) external view returns (bool);
}

contract NinjaIncoAttributes {
    uint256 public constant ATTRIBUTE_COUNT = 6;

    struct ConfidentialAttributes {
        euint256 power;
        euint256 speed;
        euint256 focus;
        euint256 luck;
        euint256 chakra;
        euint256 startingStyle;
        bool initialized;
    }

    INinjaPlayerRegistry public immutable playerRegistry;
    mapping(address => ConfidentialAttributes) private _attributes;

    event AttributesInitialized(address indexed wallet);
    event TrainingCompleted(address indexed wallet);

    error PlayerNotRegistered();
    error AttributesAlreadyInitialized();
    error AttributesNotInitialized();
    error InvalidAttributeCount();
    error InsufficientFees();

    constructor(address registryAddress) {
        playerRegistry = INinjaPlayerRegistry(registryAddress);
    }

    function initializeAttributes(bytes[] calldata encryptedAttributes) external payable {
        if (!playerRegistry.isRegistered(msg.sender)) revert PlayerNotRegistered();
        if (_attributes[msg.sender].initialized) revert AttributesAlreadyInitialized();
        if (encryptedAttributes.length != ATTRIBUTE_COUNT) revert InvalidAttributeCount();
        if (msg.value < inco.getFee() * ATTRIBUTE_COUNT) revert InsufficientFees();

        ConfidentialAttributes storage attributes = _attributes[msg.sender];
        attributes.power = _newPlayerValue(encryptedAttributes[0]);
        attributes.speed = _newPlayerValue(encryptedAttributes[1]);
        attributes.focus = _newPlayerValue(encryptedAttributes[2]);
        attributes.luck = _newPlayerValue(encryptedAttributes[3]);
        attributes.chakra = _newPlayerValue(encryptedAttributes[4]);
        attributes.startingStyle = _newPlayerValue(encryptedAttributes[5]);
        attributes.initialized = true;

        emit AttributesInitialized(msg.sender);
    }

    function getMyAttributes() external view returns (
        euint256 power,
        euint256 speed,
        euint256 focus,
        euint256 luck,
        euint256 chakra,
        euint256 startingStyle
    ) {
        ConfidentialAttributes storage attributes = _attributes[msg.sender];
        if (!attributes.initialized) revert AttributesNotInitialized();

        return (
            attributes.power,
            attributes.speed,
            attributes.focus,
            attributes.luck,
            attributes.chakra,
            attributes.startingStyle
        );
    }

    function hasAttributes(address wallet) external view returns (bool) {
        return _attributes[wallet].initialized;
    }

    /// @notice Privately finds the lowest trainable attribute and increases only it.
    ///         Strict comparisons make ties deterministic: the first lowest attribute wins.
    function train() external {
        ConfidentialAttributes storage attributes = _attributes[msg.sender];
        if (!attributes.initialized) revert AttributesNotInitialized();

        euint256 weakestValue = attributes.power;
        euint256 weakestIndex = e.asEuint256(0);

        (weakestValue, weakestIndex) = _selectWeaker(
            attributes.speed,
            1,
            weakestValue,
            weakestIndex
        );
        (weakestValue, weakestIndex) = _selectWeaker(
            attributes.focus,
            2,
            weakestValue,
            weakestIndex
        );
        (weakestValue, weakestIndex) = _selectWeaker(
            attributes.luck,
            3,
            weakestValue,
            weakestIndex
        );
        (, weakestIndex) = _selectWeaker(
            attributes.chakra,
            4,
            weakestValue,
            weakestIndex
        );

        attributes.power = _increaseIfSelected(attributes.power, weakestIndex, 0);
        attributes.speed = _increaseIfSelected(attributes.speed, weakestIndex, 1);
        attributes.focus = _increaseIfSelected(attributes.focus, weakestIndex, 2);
        attributes.luck = _increaseIfSelected(attributes.luck, weakestIndex, 3);
        attributes.chakra = _increaseIfSelected(attributes.chakra, weakestIndex, 4);

        emit TrainingCompleted(msg.sender);
    }

    function _newPlayerValue(bytes calldata encryptedValue) internal returns (euint256 value) {
        value = e.newEuint256(encryptedValue, msg.sender);
        e.allow(value, address(this));
        e.allow(value, msg.sender);
    }

    function _selectWeaker(
        euint256 candidate,
        uint256 candidateIndex,
        euint256 currentWeakest,
        euint256 currentIndex
    ) internal returns (euint256 newWeakest, euint256 newIndex) {
        ebool isWeaker = e.lt(candidate, currentWeakest);
        return (
            e.select(isWeaker, candidate, currentWeakest),
            e.select(isWeaker, e.asEuint256(candidateIndex), currentIndex)
        );
    }

    function _increaseIfSelected(
        euint256 attribute,
        euint256 weakestIndex,
        uint256 attributeIndex
    ) internal returns (euint256 updatedAttribute) {
        updatedAttribute = e.select(
            e.eq(weakestIndex, e.asEuint256(attributeIndex)),
            e.add(attribute, e.asEuint256(5)),
            attribute
        );
        e.allow(updatedAttribute, address(this));
        e.allow(updatedAttribute, msg.sender);
    }
}
