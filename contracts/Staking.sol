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

    address[] public stakersArray;

    IERC20 public immutable rewardsToken;
    IERC721 public immutable nftCollection;

    struct Staker {
        uint256[] stakedTokenIds;
        uint256 timeOfLastUpdate;
        uint256 unclaimedRewards;
    }

    uint256 private rewardsPerHour = 100000;
    uint256 constant SECONDS_IN_HOUR = 3600;

    mapping(address => Staker) public stakers;
    mapping(uint256 => address) public stakerAddress;
    mapping(address => uint256) public stakerToArrayIndex;
    mapping(uint256 => uint256) public tokenIdToArrayIndex;

    constructor(IERC721 _nftCollection, IERC20 _rewardsToken) {
        nftCollection = _nftCollection;
        rewardsToken = _rewardsToken;
    }

    /**
     * @notice Function used to stake ERC721 Tokens.
     * @param _tokenIds - The array of Token Ids to stake.
     * @dev Each Token Id must be approved for transfer by the user before calling this function.
     */
    function stake(uint256[] calldata _tokenIds) external whenNotPaused {
        Staker storage staker = stakers[msg.sender];

        if (staker.stakedTokenIds.length > 0) {
            updateRewards(msg.sender);
        } else {
            stakersArray.push(msg.sender);
            stakerToArrayIndex[msg.sender] = stakersArray.length - 1;
            staker.timeOfLastUpdate = block.timestamp;
        }

        uint256 len = _tokenIds.length;
        for (uint256 i; i < len; ++i) {
            require(
                nftCollection.ownerOf(_tokenIds[i]) == msg.sender,
                "Can't stake tokens you don't own!"
            );

            nftCollection.transferFrom(msg.sender, address(this), _tokenIds[i]);

            staker.stakedTokenIds.push(_tokenIds[i]);
            tokenIdToArrayIndex[_tokenIds[i]] =
                staker.stakedTokenIds.length -
                1;
            stakerAddress[_tokenIds[i]] = msg.sender;
        }
    }

    /**
     * @notice Function used to withdraw ERC721 Tokens.
     * @param _tokenIds - The array of Token Ids to withdraw.
     */
    function withdraw(uint256[] calldata _tokenIds) external nonReentrant {
        Staker storage staker = stakers[msg.sender];
        require(staker.stakedTokenIds.length > 0, "You have no tokens staked");
        updateRewards(msg.sender);

        uint256 lenToWithdraw = _tokenIds.length;
        for (uint256 i; i < lenToWithdraw; ++i) {
            require(stakerAddress[_tokenIds[i]] == msg.sender);

            uint256 index = tokenIdToArrayIndex[_tokenIds[i]];
            uint256 lastTokenIndex = staker.stakedTokenIds.length - 1;
            if (index != lastTokenIndex) {
                staker.stakedTokenIds[index] = staker.stakedTokenIds[
                    lastTokenIndex
                ];
                tokenIdToArrayIndex[staker.stakedTokenIds[index]] = index;
            }
            staker.stakedTokenIds.pop();

            delete stakerAddress[_tokenIds[i]];

            nftCollection.transferFrom(address(this), msg.sender, _tokenIds[i]);
        }

        if (staker.stakedTokenIds.length == 0) {
            uint256 index = stakerToArrayIndex[msg.sender];
            uint256 lastStakerIndex = stakersArray.length - 1;
            if (index != lastStakerIndex) {
                stakersArray[index] = stakersArray[lastStakerIndex];
                stakerToArrayIndex[stakersArray[index]] = index;
            }
            stakersArray.pop();
        }
    }

    /**
     * @notice Function used to claim the accrued ERC20 Reward Tokens.
     */
    function claimRewards() external {
        Staker storage staker = stakers[msg.sender];

        uint256 rewards = calculateRewards(msg.sender) +
            staker.unclaimedRewards;
        require(rewards > 0, "You have no rewards to claim");

        staker.timeOfLastUpdate = block.timestamp;
        staker.unclaimedRewards = 0;

        rewardsToken.safeTransfer(msg.sender, rewards);
    }

    /**
     * @notice Function used to set the amount of ERC20 Reward Tokens accrued per hour.
     * @param _newValue - The new value of the rewardsPerHour variable.
     * @dev Because the rewards are calculated passively, the owner has to first update the rewards
     * to all the stakers, witch could result in very heavy load and expensive transactions or
     * even reverting due to reaching the gas limit per block.
     */
    function setRewardsPerHour(uint256 _newValue) public onlyOwner {
        address[] memory _stakers = stakersArray;

        uint256 len = _stakers.length;
        for (uint256 i; i < len; ++i) {
            updateRewards(_stakers[i]);
        }

        rewardsPerHour = _newValue;
    }

    /**
     * @notice Function used to get the info for a user: the Token Ids staked and the available rewards.
     * @param _user - The address of the user.
     * @return _stakedTokenIds - The array of Token Ids staked by the user.
     * @return _availableRewards - The available rewards for the user.
     */
    function userStakeInfo(
        address _user
    )
        public
        view
        returns (uint256[] memory _stakedTokenIds, uint256 _availableRewards)
    {
        return (stakers[_user].stakedTokenIds, availableRewards(_user));
    }

    /**
     * @notice Function used to get the available rewards for a user.
     * @param _user - The address of the user.
     * @return _rewards - The available rewards for the user.
     * @dev This includes both the rewards stored but not claimed and the rewards accumulated since the last update.
     */
    function availableRewards(
        address _user
    ) internal view returns (uint256 _rewards) {
        Staker memory staker = stakers[_user];

        if (staker.stakedTokenIds.length == 0) {
            return staker.unclaimedRewards;
        }

        _rewards = staker.unclaimedRewards + calculateRewards(_user);
    }

    /**
     * @notice Function used to calculate the rewards for a user.
     * @return _rewards - The rewards for the user.
     */
    function calculateRewards(
        address _staker
    ) internal view returns (uint256 _rewards) {
        Staker memory staker = stakers[_staker];
        return (((
            ((block.timestamp - staker.timeOfLastUpdate) *
                staker.stakedTokenIds.length)
        ) * rewardsPerHour) / SECONDS_IN_HOUR);
    }

    /**
     * @notice Function used to update the rewards for a user.
     * @param _staker - The address of the user.
     */
    function updateRewards(address _staker) internal {
        Staker storage staker = stakers[_staker];

        staker.unclaimedRewards += calculateRewards(_staker);
        staker.timeOfLastUpdate = block.timestamp;
    }

    /**
     * @dev Pause staking.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Resume staking.
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
