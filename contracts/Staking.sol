// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract ERC721Staking is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable rewardsToken;
    IERC721 public immutable nftCollection;

    struct Staker {
        uint256 amountStaked;
        StakedToken[] stakedTokens;
        uint256 timeOfLastUpdate;
        uint256 unclaimedRewards;
    }

    struct StakedToken {
        address staker;
        uint256 tokenId;
    }

    uint256 private rewardsPerHour = 100000;
    uint256 constant SECONDS_IN_HOUR = 3600;

    mapping(address => Staker) public stakers;
    mapping(uint256 => address) public stakerAddress;

    event Responce(bool indexed responce);

    constructor(IERC721 _nftCollection, IERC20 _rewardsToken) {
        nftCollection = _nftCollection;
        rewardsToken = _rewardsToken;
    }

    function stake(uint256 _tokenId) external nonReentrant {
        if (stakers[msg.sender].amountStaked > 0) {
            uint256 rewards = calculateRewards(msg.sender);
            stakers[msg.sender].unclaimedRewards += rewards;
        }

        require(
            nftCollection.ownerOf(_tokenId) == msg.sender,
            "You don't own this token!"
        );
        // !необходимо выдать апрув данному контракту перед стейкингом
        nftCollection.transferFrom(msg.sender, address(this), _tokenId);

        StakedToken memory stakedToken = StakedToken(msg.sender, _tokenId);

        stakers[msg.sender].stakedTokens.push(stakedToken);

        stakers[msg.sender].amountStaked++;

        stakerAddress[_tokenId] = msg.sender;

        stakers[msg.sender].timeOfLastUpdate = block.timestamp;
    }

    function withdraw(uint256 _tokenId) external nonReentrant {
        require(
            stakers[msg.sender].amountStaked > 0,
            "You have no tokens staked"
        );

        require(
            stakerAddress[_tokenId] == msg.sender,
            "You don't own this token!"
        );

        uint256 rewards = calculateRewards(msg.sender);
        stakers[msg.sender].unclaimedRewards += rewards;

        uint256 index = 0;
        for (uint256 i = 0; i < stakers[msg.sender].stakedTokens.length; i++) {
            if (
                stakers[msg.sender].stakedTokens[i].tokenId == _tokenId &&
                stakers[msg.sender].stakedTokens[i].staker != address(0)
            ) {
                index = i;
                break;
            }
        }

        stakers[msg.sender].stakedTokens[index].staker = address(0);

        stakers[msg.sender].amountStaked--;

        stakerAddress[_tokenId] = address(0);

        nftCollection.transferFrom(address(this), msg.sender, _tokenId);

        stakers[msg.sender].timeOfLastUpdate = block.timestamp;
    }

    function claimRewards() external {
        uint256 rewards = calculateRewards(msg.sender) +
            stakers[msg.sender].unclaimedRewards;
        require(rewards > 0, "You have no rewards to claim");
        stakers[msg.sender].timeOfLastUpdate = block.timestamp;
        stakers[msg.sender].unclaimedRewards = 0;

        // rewardsToken.transfer(msg.sender, rewards);
        (bool successReavrded, ) = address(rewardsToken).call(
            abi.encodeWithSignature(
                "_mint(address,uint256)",
                msg.sender,
                rewards
            )
        );
        require(successReavrded, "Cant sent reward");

        emit Responce(successReavrded);
    }

    function setRewardsPerHour(uint256 _newValue) public onlyOwner {
        uint256 count;
        for (uint256 i = 1; i <= 132; i++) {
            if (stakerAddress[i] != address(0)) {
                count++;
            }
        }

        for (uint256 i = 1; i <= count; ++i) {
            stakers[stakerAddress[i]].unclaimedRewards += calculateRewards(
                stakerAddress[i]
            );
            stakers[stakerAddress[i]].timeOfLastUpdate = block.timestamp;
        }

        rewardsPerHour = _newValue;
    }

    function getStakedTokens(
        address _user
    ) public view returns (StakedToken[] memory) {
        if (stakers[_user].amountStaked > 0) {
            StakedToken[] memory _stakedTokens = new StakedToken[](
                stakers[_user].amountStaked
            );
            uint256 _index = 0;

            for (uint256 j = 0; j < stakers[_user].stakedTokens.length; j++) {
                if (stakers[_user].stakedTokens[j].staker != (address(0))) {
                    _stakedTokens[_index] = stakers[_user].stakedTokens[j];
                    _index++;
                }
            }

            return _stakedTokens;
        } else {
            return new StakedToken[](0);
        }
    }

    function availableRewards(
        address _staker
    ) public view returns (uint256 _rewards) {
        Staker memory staker = stakers[_staker];

        if (staker.amountStaked == 0) {
            return staker.unclaimedRewards;
        }

        _rewards = staker.unclaimedRewards + calculateRewards(_staker);
    }

    function calculateRewards(
        address _staker
    ) internal view returns (uint256 _rewards) {
        return (((
            ((block.timestamp - stakers[_staker].timeOfLastUpdate) *
                stakers[_staker].amountStaked)
        ) * rewardsPerHour) / SECONDS_IN_HOUR);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
