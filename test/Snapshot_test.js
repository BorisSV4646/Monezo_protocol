const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SnapshotMonezo", function () {
  let owner;
  let acc2;
  let acc3;
  let acc4;
  let paymentsMonezoNFT;

  this.beforeEach(async function () {
    [owner, acc2, acc3, acc4] = await ethers.getSigners();
    const monezoNFT = await ethers.getContractFactory("SnapshotMonezo", owner);
    paymentsMonezoNFT = await monezoNFT.deploy();
    await paymentsMonezoNFT.deployed();

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
  });

  it("Funtion snapshot() work correctly", async function () {
    const snap = await paymentsMonezoNFT.snapshot();
    const addressSnap = await paymentsMonezoNFT.showAddressSnap(1);
    expect(addressSnap.length).to.eq(3);

    await expect(snap)
      .to.emit(paymentsMonezoNFT, "Snapshot")
      .withArgs(1, [owner.address, acc2.address, acc3.address]);

    const transfer = await paymentsMonezoNFT.transferFrom(
      owner.address,
      acc3.address,
      1
    );

    const transferTwo = await paymentsMonezoNFT
      .connect(acc2)
      .transferFrom(acc2.address, acc4.address, 2);

    const snapNew = await paymentsMonezoNFT.snapshot();
    const addressSnapNew = await paymentsMonezoNFT.showAddressSnap(2);
    expect(addressSnapNew.length).to.eq(3);

    await expect(snapNew)
      .to.emit(paymentsMonezoNFT, "Snapshot")
      .withArgs(2, [acc3.address, acc4.address, acc3.address]);

    const burn = await paymentsMonezoNFT.connect(acc3).burnToken(1);

    const snapThree = await paymentsMonezoNFT.snapshot();
    const addressSnapThree = await paymentsMonezoNFT.showAddressSnap(3);
    expect(addressSnapThree.length).to.eq(3);

    await expect(snapThree)
      .to.emit(paymentsMonezoNFT, "Snapshot")
      .withArgs(3, [ethers.constants.AddressZero, acc4.address, acc3.address]);
  });

  it("Funtion balanceOfAt() work correctly", async function () {
    const snap = await paymentsMonezoNFT.snapshot();
    const showAdressBalance = await paymentsMonezoNFT.balanceOfAt(
      owner.address,
      1
    );

    await expect(showAdressBalance).to.eq(1);

    const transfer = await paymentsMonezoNFT.transferFrom(
      owner.address,
      acc3.address,
      1
    );

    const snapNew = await paymentsMonezoNFT.snapshot();
    const showAdressBalanceNew = await paymentsMonezoNFT.balanceOfAt(
      owner.address,
      2
    );

    await expect(showAdressBalanceNew).to.eq(0);
  });

  it("Funtion totalSupplyAt() work correctly", async function () {
    const snap = await paymentsMonezoNFT.snapshot();
    const showBalance = await paymentsMonezoNFT.totalSupplyAt(1);

    await expect(showBalance).to.eq(3);

    const burn = await paymentsMonezoNFT.burnToken(1);

    const snapNew = await paymentsMonezoNFT.snapshot();
    const showBalanceNew = await paymentsMonezoNFT.totalSupplyAt(2);

    await expect(showBalanceNew).to.eq(3);
  });
});
