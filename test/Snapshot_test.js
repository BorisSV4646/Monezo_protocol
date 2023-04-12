const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SnapshotMonezo", function () {
  let owner;
  let acc2;
  let acc3;
  let paymentsMonezoNFT;

  this.beforeEach(async function () {
    [owner, acc2, acc3] = await ethers.getSigners();
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
    const snapNew = await paymentsMonezoNFT.snapshot();
    const addressSnap = await paymentsMonezoNFT.showAddressSnap(1);
    expect(addressSnap.length).to.eq(3);
  });
});
