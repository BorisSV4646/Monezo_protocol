const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ERC721Staking", function () {
  let owner;
  let acc2;
  let acc3;
  let acc4;
  let paymentsMonezoNFT;

  this.beforeEach(async function () {
    [owner, acc2, acc3, acc4] = await ethers.getSigners();

    const InitialSuplay = 100;

    const Payments = await ethers.getContractFactory(
      "ERC20_MONEZO_TOKEN",
      owner
    );
    payments = await Payments.deploy(InitialSuplay);
    await payments.deployed(InitialSuplay);

    const monezoNFT = await ethers.getContractFactory("SnapshotMonezo", owner);
    paymentsMonezoNFT = await monezoNFT.deploy();
    await paymentsMonezoNFT.deployed();

    const monezoStaking = await ethers.getContractFactory(
      "ERC721Staking",
      owner
    );
    paymentsMonezoStaking = await monezoStaking.deploy(
      paymentsMonezoNFT.address,
      payments.address
    );
    await paymentsMonezoStaking.deployed(
      paymentsMonezoNFT.address,
      payments.address
    );

    const SetPriceOwner = paymentsMonezoNFT.setPrice(500);
    const Mint = await paymentsMonezoNFT.safeMint(owner.address, {
      value: 550,
    });

    const MintTwo = await paymentsMonezoNFT
      .connect(acc2)
      .safeMint(acc2.address, {
        value: 550,
      });

    const MintThree = await paymentsMonezoNFT
      .connect(acc3)
      .safeMint(acc3.address, {
        value: 550,
      });

    const MintOwnerAgain = await paymentsMonezoNFT.safeMint(owner.address, {
      value: 550,
    });
  });

  it("Deploy - shoud be deployed and address correct", async function () {
    expect(payments.address).to.be.properAddress;
    expect(paymentsMonezoNFT.address).to.be.properAddress;
    expect(paymentsMonezoStaking.address).to.be.properAddress;
  });

  it("Constructor() - right address tokens", async function () {
    expect(await paymentsMonezoStaking.rewardsToken()).to.equal(
      payments.address
    );
    expect(await paymentsMonezoStaking.nftCollection()).to.equal(
      paymentsMonezoNFT.address
    );
  });

  it("Function stake() and getStakedTokens() work correct", async function () {
    await paymentsMonezoNFT.approve(paymentsMonezoStaking.address, 1);

    const stakingAdd = await paymentsMonezoStaking.stake(1);

    await expect(stakingAdd)
      .to.emit(paymentsMonezoStaking, "Stake")
      .withArgs(owner.address, 1);

    await expect(paymentsMonezoStaking.stake(2)).to.be.revertedWith(
      "You don't own this token!"
    );

    await expect(stakingAdd).to.changeTokenBalances(
      paymentsMonezoNFT,
      [owner, paymentsMonezoStaking],
      [-1, 1]
    );

    expect(await paymentsMonezoStaking.stakerAddress(1)).to.eq(owner.address);

    const stakerInfo = await paymentsMonezoStaking.stakers(owner.address);
    expect(await stakerInfo["amountStaked"]).to.eq(1);
    const showBlock = await ethers.provider.getBlock(stakingAdd.blockHash);
    expect(await stakerInfo["timeOfLastUpdate"]).to.eq(showBlock.timestamp);

    const tokeInfo = await paymentsMonezoStaking.getStakedTokens(owner.address);
    expect(await tokeInfo.length).to.eq(1);

    const tokeInfoNull = await paymentsMonezoStaking.getStakedTokens(
      acc2.address
    );
    expect(await tokeInfoNull.length).to.eq(0);

    await paymentsMonezoNFT.approve(paymentsMonezoStaking.address, 4);

    const stakingAddNew = await paymentsMonezoStaking.stake(4);

    const stakerInfoRewaed = await paymentsMonezoStaking.stakers(owner.address);
    expect(await stakerInfoRewaed["amountStaked"]).to.eq(2);
    const showBlockTwo = await ethers.provider.getBlock(
      stakingAddNew.blockHash
    );
    expect(await stakerInfoRewaed["timeOfLastUpdate"]).to.eq(
      showBlockTwo.timestamp
    );
    const reward = Math.round(
      ((showBlockTwo.timestamp - stakerInfo["timeOfLastUpdate"]) *
        (await stakerInfo["amountStaked"]) *
        100000) /
        3600
    );
    expect(await stakerInfoRewaed["unclaimedRewards"]).to.eq(reward);

    const tokeInfoTwo = await paymentsMonezoStaking.getStakedTokens(
      owner.address
    );
    expect(await tokeInfoTwo.length).to.eq(2);
  });

  it("Function withdraw() and claimRewards() work correct", async function () {
    await paymentsMonezoNFT.approve(paymentsMonezoStaking.address, 1);

    const stakingAdd = await paymentsMonezoStaking.stake(1);

    const stakerInfoOld = await paymentsMonezoStaking.stakers(owner.address);

    await expect(paymentsMonezoStaking.withdraw(2)).to.be.revertedWith(
      "You don't own this token!"
    );

    await expect(
      paymentsMonezoStaking.connect(acc2).withdraw(1)
    ).to.be.revertedWith("You have no tokens staked");

    await time.increase(5000);

    const withdrawYoken = await paymentsMonezoStaking.withdraw(1);

    await expect(withdrawYoken)
      .to.emit(paymentsMonezoStaking, "WithDraw")
      .withArgs(owner.address, 1);

    await expect(withdrawYoken).to.changeTokenBalances(
      paymentsMonezoNFT,
      [paymentsMonezoStaking, owner],
      [-1, 1]
    );

    expect(await paymentsMonezoStaking.stakerAddress(1)).to.eq(
      ethers.constants.AddressZero
    );

    const stakerInfo = await paymentsMonezoStaking.stakers(owner.address);
    expect(await stakerInfo["amountStaked"]).to.eq(0);
    const showBlock = await ethers.provider.getBlock(withdrawYoken.blockHash);
    expect(await stakerInfo["timeOfLastUpdate"]).to.eq(showBlock.timestamp);

    const tokeInfo = await paymentsMonezoStaking.getStakedTokens(owner.address);
    expect(await tokeInfo.length).to.eq(0);

    const reward = Math.round(
      ((showBlock.timestamp - (await stakerInfoOld["timeOfLastUpdate"])) *
        (await stakerInfoOld["amountStaked"]) *
        100000) /
        3600
    );
    expect(await stakerInfo["unclaimedRewards"]).to.eq(reward);

    await time.increase(500);

    await expect(
      paymentsMonezoStaking.connect(acc2).claimRewards()
    ).to.be.revertedWith("You have no rewards to claim");

    await payments.setNewCreater(paymentsMonezoStaking.address);

    const claimRewards = await paymentsMonezoStaking.claimRewards();

    await expect(claimRewards)
      .to.emit(paymentsMonezoStaking, "Responce")
      .withArgs(true);

    const stakerInfoWithdraw = await paymentsMonezoStaking.stakers(
      owner.address
    );
    const showBlockWithdraw = await ethers.provider.getBlock(
      stakerInfoWithdraw.blockHash
    );
    expect(await stakerInfoWithdraw["timeOfLastUpdate"]).to.eq(
      showBlockWithdraw.timestamp
    );

    expect(await stakerInfoWithdraw["unclaimedRewards"]).to.eq(0);

    await expect(claimRewards).to.changeTokenBalance(payments, owner, reward);
  });

  it("Function setRewardsPerHour() and availableRewards() work correct", async function () {
    await paymentsMonezoNFT.approve(paymentsMonezoStaking.address, 1);

    const stakingAdd = await paymentsMonezoStaking.stake(1);

    await time.increase(50);

    const stakerInfo = await paymentsMonezoStaking.stakers(owner.address);
    const showBlock = await ethers.provider.getBlock(stakingAdd.blockHash);
    expect(await stakerInfo["timeOfLastUpdate"]).to.eq(showBlock.timestamp);

    const reward = Math.round(
      ((showBlock.timestamp - stakerInfo["timeOfLastUpdate"]) *
        (await stakerInfo["amountStaked"]) *
        100000) /
        3600
    );
    expect(await stakerInfo["unclaimedRewards"]).to.eq(reward);

    await time.increase(5000);

    const setNewReward = await paymentsMonezoStaking.setRewardsPerHour(20000);

    await expect(
      paymentsMonezoStaking.connect(acc2).setRewardsPerHour(100000000)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    const stakerInfoTwo = await paymentsMonezoStaking.stakers(owner.address);
    const showBlockTwo = await ethers.provider.getBlock(setNewReward.blockHash);
    expect(await stakerInfoTwo["timeOfLastUpdate"]).to.eq(
      showBlockTwo.timestamp
    );

    const rewardTwo = Math.round(
      ((showBlockTwo.timestamp - stakerInfo["timeOfLastUpdate"]) *
        (await stakerInfo["amountStaked"]) *
        100000) /
        3600
    );
    expect(await stakerInfoTwo["unclaimedRewards"]).to.eq(rewardTwo - 1);

    await time.increase(500);

    const avalREwards = await paymentsMonezoStaking.availableRewards(
      owner.address
    );

    const showBlockThree = await ethers.provider.getBlock(
      avalREwards.blockHash
    );

    const rewardThree = Math.round(
      ((showBlockThree.timestamp - stakerInfoTwo["timeOfLastUpdate"]) *
        (await stakerInfoTwo["amountStaked"]) *
        20000) /
        3600
    );
    expect(avalREwards).to.eq(rewardThree + rewardTwo - 1);

    const avalREwardsAcc2 = await paymentsMonezoStaking.availableRewards(
      acc2.address
    );

    expect(avalREwardsAcc2).to.eq(0);
  });

  it("Function pause() and unpause() work correct", async function () {
    await expect(
      paymentsMonezoStaking.connect(acc2).pause()
    ).to.be.revertedWith("Ownable: caller is not the owner");

    const startPause = await paymentsMonezoStaking.pause();

    await expect(startPause)
      .to.emit(paymentsMonezoStaking, "Paused")
      .withArgs(owner.address);

    expect(await paymentsMonezoStaking.paused()).to.true;

    await expect(
      paymentsMonezoStaking.connect(acc2).unpause()
    ).to.be.revertedWith("Ownable: caller is not the owner");

    const startUnpause = await paymentsMonezoStaking.unpause();

    await expect(startUnpause)
      .to.emit(paymentsMonezoStaking, "Unpaused")
      .withArgs(owner.address);

    expect(await paymentsMonezoStaking.paused()).to.false;
  });
});
