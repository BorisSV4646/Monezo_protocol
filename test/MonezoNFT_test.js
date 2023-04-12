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
  });

  it("Deploy - shoud be deployed and address correct", async function () {
    expect(paymentsMonezoNFT.address).to.be.properAddress;
  });

  it("Deploy - rigth creator ERC20 and other params", async function () {
    expect(await paymentsMonezoNFT.name()).to.equal("MonezoNFT");
    expect(await paymentsMonezoNFT.symbol()).to.equal("MT");
  });

  it("Receive() - contract recieve ethers", async function () {
    tx = {
      to: paymentsMonezoNFT.address,
      value: 100,
    };
    const NewTransaction = await owner.sendTransaction(tx);
    await expect(() => NewTransaction).to.changeEtherBalance(
      paymentsMonezoNFT.address,
      100
    );
  });

  it("SupportsInterface() - test check interface", async function () {
    expect(await paymentsMonezoNFT.supportsInterface(0x5b5e139f)).to.true;
    expect(await paymentsMonezoNFT.supportsInterface(0x80ac58cd)).to.true;
  });

  it("BalanceOf() - test check balance", async function () {
    await expect(
      paymentsMonezoNFT.balanceOf(ethers.constants.AddressZero)
    ).to.be.revertedWith("ERC721: address zero is not a valid owner");

    const SetPriceOwner = paymentsMonezoNFT.setPrice(500);
    const Mint = paymentsMonezoNFT.safeMint(owner.address, {
      value: 550,
    });
    await expect(Mint).to.changeTokenBalance(paymentsMonezoNFT, owner, 1);
    expect(await paymentsMonezoNFT.balanceOf(owner.address)).to.equal(1);
    await expect(Mint).to.changeEtherBalance(paymentsMonezoNFT, 550);
  });

  it("OwnerOf() - test check owner token", async function () {
    const SetPriceOwner = paymentsMonezoNFT.setPrice(500);
    const Mint = await paymentsMonezoNFT.safeMint(owner.address, {
      value: 550,
    });
    const Owner = await paymentsMonezoNFT.ownerOf(1);
    await expect(Owner).to.equal(owner.address);

    await expect(paymentsMonezoNFT.ownerOf(0)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );
  });

  it("TokenURI() and SetBaseURI() - test check chow tokenURI and set", async function () {
    const SetPriceOwner = paymentsMonezoNFT.setPrice(500);
    const Mint = await paymentsMonezoNFT.safeMint(owner.address, {
      value: 550,
    });
    const Uri = await paymentsMonezoNFT.tokenURI(1);
    await expect(Uri).to.equal("");

    const BaseUri = "www.Boris.com";
    const TokenId = 1;
    const NewBaseUri = await paymentsMonezoNFT.setBaseURI(BaseUri);
    const NewUri = await paymentsMonezoNFT.tokenURI(TokenId);
    await expect(NewUri).to.equal("www.Boris.com1");

    await expect(paymentsMonezoNFT.tokenURI(0)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );
  });

  it("Approve() and GetApproved() - user can approve token and get approve", async function () {
    const tokenId = 1;
    const SetPriceOwner = paymentsMonezoNFT.setPrice(500);
    const Mint = await paymentsMonezoNFT.safeMint(owner.address, {
      value: 550,
    });

    await expect(paymentsMonezoNFT.approve(acc2.address, 0)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );

    await expect(
      paymentsMonezoNFT.approve(owner.address, 1)
    ).to.be.revertedWith("ERC721: approval to current owner");

    const NotOwner = paymentsMonezoNFT.connect(acc2);
    await expect(NotOwner.approve(acc2.address, 1)).to.be.revertedWith(
      "ERC721: approve caller is not token owner or approved for all"
    );

    const Approve = await paymentsMonezoNFT.approve(acc2.address, tokenId);
    const GerApprove = await paymentsMonezoNFT.getApproved(1);
    await expect(GerApprove).to.equal(acc2.address);

    await expect(paymentsMonezoNFT.getApproved(0)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );

    await expect(Approve)
      .to.emit(paymentsMonezoNFT, "Approval")
      .withArgs(owner.address, acc2.address, 1);
  });

  it("SetApprovalForAll() and IsApprovedForAll() - user can approve all token and get all approve", async function () {
    const tokenId = 1;
    const SetPriceOwner = paymentsMonezoNFT.setPrice(500);
    const Mint = await paymentsMonezoNFT.safeMint(owner.address, {
      value: 550,
    });

    await expect(
      paymentsMonezoNFT.setApprovalForAll(owner.address, true)
    ).to.be.revertedWith("ERC721: approve to caller");

    const Approve = await paymentsMonezoNFT.setApprovalForAll(
      acc2.address,
      true
    );
    await expect(
      await paymentsMonezoNFT.isApprovedForAll(owner.address, acc2.address)
    ).to.true;

    await expect(Approve)
      .to.emit(paymentsMonezoNFT, "ApprovalForAll")
      .withArgs(owner.address, acc2.address, true);
  });

  it("TransferFrom() - user can transfer token", async function () {
    const tokenId = 1;
    const SetPriceOwner = paymentsMonezoNFT.setPrice(500);
    const Mint = await paymentsMonezoNFT.safeMint(owner.address, {
      value: 550,
    });

    await expect(
      paymentsMonezoNFT.transferFrom(
        owner.address,
        ethers.constants.AddressZero,
        1
      )
    ).to.be.revertedWith("ERC721: transfer to the zero address");

    await expect(await paymentsMonezoNFT.ownerOf(1)).to.be.equal(owner.address);
    const transfer = await paymentsMonezoNFT.transferFrom(
      owner.address,
      acc2.address,
      1
    );
    await expect(await paymentsMonezoNFT.ownerOf(1)).to.be.equal(acc2.address);
    await expect(await paymentsMonezoNFT.balanceOf(acc2.address)).to.be.equal(
      1
    );
    await expect(transfer).to.changeTokenBalances(
      paymentsMonezoNFT,
      [owner, acc2],
      [-1, 1]
    );

    await expect(transfer)
      .to.emit(paymentsMonezoNFT, "Transfer")
      .withArgs(owner.address, acc2.address, 1);

    await expect(
      paymentsMonezoNFT.transferFrom(owner.address, acc2.address, 1)
    ).to.be.revertedWith("ERC721: caller is not token owner or approved");

    const newUserThree = paymentsMonezoNFT.connect(acc3);
    const newUserTwo = paymentsMonezoNFT.connect(acc2);
    const Approve = await newUserTwo.approve(acc3.address, 1);
    const transfertwo = await newUserThree.transferFrom(
      acc2.address,
      owner.address,
      1
    );
    await expect(transfertwo).to.changeTokenBalances(
      paymentsMonezoNFT,
      [acc2, owner],
      [-1, 1]
    );
    const GerApprove = await paymentsMonezoNFT.getApproved(1);
    await expect(GerApprove).to.equal(ethers.constants.AddressZero);
  });

  it("SafeTransferFrom() - user can safe transfer token", async function () {
    const SetPriceOwner = paymentsMonezoNFT.setPrice(500);
    const Mint = await paymentsMonezoNFT.safeMint(owner.address, {
      value: 550,
    });

    await expect(
      paymentsMonezoNFT["safeTransferFrom(address,address,uint256)"](
        owner.address,
        paymentsMonezoNFT.address,
        1
      )
    ).to.be.reverted;

    await expect(await paymentsMonezoNFT.ownerOf(1)).to.be.equal(owner.address);
    const transfer = await paymentsMonezoNFT[
      "safeTransferFrom(address,address,uint256)"
    ](owner.address, acc2.address, 1);
    await expect(await paymentsMonezoNFT.ownerOf(1)).to.be.equal(acc2.address);
    await expect(await paymentsMonezoNFT.balanceOf(acc2.address)).to.be.equal(
      1
    );
    await expect(transfer).to.changeTokenBalances(
      paymentsMonezoNFT,
      [owner, acc2],
      [-1, 1]
    );

    await expect(transfer)
      .to.emit(paymentsMonezoNFT, "Transfer")
      .withArgs(owner.address, acc2.address, 1);

    await expect(
      paymentsMonezoNFT["safeTransferFrom(address,address,uint256)"](
        owner.address,
        acc2.address,
        1
      )
    ).to.be.revertedWith("ERC721: caller is not token owner or approved");
  });

  it("safeMint() - user can mint token", async function () {
    const SetPriceOwner = paymentsMonezoNFT.setPrice(500);
    const MintOne = await paymentsMonezoNFT.safeMint(owner.address, {
      value: 550,
    });
    const MintTwo = await paymentsMonezoNFT.safeMint(owner.address, {
      value: 550,
    });
    await expect(MintTwo)
      .to.emit(paymentsMonezoNFT, "Transfer")
      .withArgs(ethers.constants.AddressZero, owner.address, 2);
    await expect(await paymentsMonezoNFT.ownerOf(2)).to.be.equal(owner.address);
    await expect(await paymentsMonezoNFT.balanceOf(owner.address)).to.be.equal(
      2
    );

    await expect(
      paymentsMonezoNFT.safeMint(paymentsMonezoNFT.address, {
        value: 550,
      })
    ).to.be.reverted;

    await expect(
      paymentsMonezoNFT.safeMint(owner.address, {
        value: 450,
      })
    ).to.be.revertedWith("Ether value sent is not correct");

    await expect(
      paymentsMonezoNFT.safeMint(acc2.address, {
        value: 550,
      })
    ).to.be.revertedWith("You can only buy with your wallet");

    const saleInactive = await paymentsMonezoNFT.flipSaleState();
    const newUser = paymentsMonezoNFT.connect(acc2);
    await expect(newUser.flipSaleState()).to.be.revertedWith("Not an owner");
    await expect(
      paymentsMonezoNFT.safeMint(owner.address, {
        value: 550,
      })
    ).to.be.revertedWith("Sale must be active to mint");

    const saleStart = await paymentsMonezoNFT.flipSaleState();
    for (i = 1; i <= 129; i++) {
      await paymentsMonezoNFT.safeMint(owner.address, {
        value: 550,
      });
    }

    expect(
      await paymentsMonezoNFT.safeMint(owner.address, {
        value: 550,
      })
    ).to.be.revertedWith("Limit on token suplay");
  });

  it("GetBalance() - owner can see balance contract", async function () {
    const MintOne = await paymentsMonezoNFT.safeMint(owner.address, {
      value: 50000000000001000n,
    });

    expect(await paymentsMonezoNFT.getBalance()).to.be.equal(
      50000000000001000n
    );

    const newUSer = paymentsMonezoNFT.connect(acc2);
    await expect(newUSer.getBalance()).to.be.revertedWith("Not an owner");
  });

  it("SetPrice() and GetPrice() - owner can set new price", async function () {
    const NewUser = paymentsMonezoNFT.connect(acc2);
    const SetPrice = NewUser.setPrice(500);
    await expect(SetPrice).to.be.revertedWith("Not an owner");

    const SetPriceOwner = paymentsMonezoNFT.setPrice(500);
    expect(await paymentsMonezoNFT.getPrice()).to.equal(500);

    const SetPriceZero = paymentsMonezoNFT.setPrice(0);
    await expect(SetPriceZero).to.be.revertedWith("Price can`t 0");
  });

  it("Function withdraw() - shound allow owner to withdraw funds", async function () {
    tx = {
      to: paymentsMonezoNFT.address,
      value: 100,
    };
    const NewTransaction = await owner.sendTransaction(tx);

    const WithDraw = await paymentsMonezoNFT.withdraw();

    await expect(() => WithDraw).to.changeEtherBalances(
      [paymentsMonezoNFT.address, owner.address],
      [-100, 100]
    );
  });

  it("Function withdraw() - shound not allow other accounts to withdraw funds", async function () {
    tx = {
      to: paymentsMonezoNFT.address,
      value: 100,
    };
    await owner.sendTransaction(tx);

    await expect(paymentsMonezoNFT.connect(acc2).withdraw()).to.be.revertedWith(
      "Not an owner"
    );
  });

  it("Function totalSupply() - user can see total token", async function () {
    const SetPriceOwner = paymentsMonezoNFT.setPrice(500);
    for (i = 0; i <= 5; i++) {
      await paymentsMonezoNFT.safeMint(owner.address, {
        value: 550,
      });
    }
    expect(await paymentsMonezoNFT.totalSupply()).to.be.equal(6);
  });

  it("Function listNft() - user can sell nft", async function () {
    const SetPriceOwner = paymentsMonezoNFT.setPrice(500);
    await paymentsMonezoNFT.safeMint(owner.address, {
      value: 550,
    });

    const sell = await paymentsMonezoNFT.listNft(1, 700);
    const listNFT = await paymentsMonezoNFT.getListedNFT(owner.address, 1);
    await expect(await listNFT["onsail"]).to.true;

    await expect(sell)
      .to.emit(paymentsMonezoNFT, "ListedNFT")
      .withArgs(1, 700, owner.address, true);

    await expect(
      paymentsMonezoNFT.connect(acc2).listNft(1, 700)
    ).to.be.revertedWith("Not owner NFT");

    await expect(paymentsMonezoNFT.listNft(1, 700)).to.be.revertedWith(
      "Tolen already listed"
    );
  });

  it("Function cancelListedNFT() - user can cancel sell", async function () {
    const SetPriceOwner = paymentsMonezoNFT.setPrice(500);
    await paymentsMonezoNFT.safeMint(owner.address, {
      value: 550,
    });

    await expect(paymentsMonezoNFT.cancelListedNFT(1)).to.be.revertedWith(
      "Token not listed"
    );

    const sell = await paymentsMonezoNFT.listNft(1, 700);
    const listNFT = await paymentsMonezoNFT.getListedNFT(owner.address, 1);
    await expect(await listNFT["onsail"]).to.true;

    await expect(
      paymentsMonezoNFT.connect(acc2).cancelListedNFT(1)
    ).to.be.revertedWith("Not owner NFT");

    const cancellSell = await paymentsMonezoNFT.cancelListedNFT(1);
    const cancelNFT = await paymentsMonezoNFT.getListedNFT(owner.address, 1);
    await expect(await cancelNFT["onsail"]).to.false;

    await expect(cancellSell)
      .to.emit(paymentsMonezoNFT, "CancelListedNFT")
      .withArgs(1, owner.address);
  });

  it("Function buyNFT() - user can buy NFT", async function () {
    const SetPriceOwner = paymentsMonezoNFT.setPrice(500);
    const notOwner = paymentsMonezoNFT.connect(acc2);
    await notOwner.safeMint(acc2.address, {
      value: 550,
    });

    await expect(paymentsMonezoNFT.buyNFT(1)).to.be.revertedWith(
      "NFT not on sale"
    );

    const sell = await notOwner.listNft(1, 700);
    const listNFT = await notOwner.getListedNFT(acc2.address, 1);
    await expect(await listNFT["onsail"]).to.true;

    await expect(paymentsMonezoNFT.buyNFT(0)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );

    await expect(paymentsMonezoNFT.buyNFT(1)).to.be.revertedWith(
      "Not enough money"
    );

    const buyNFT = await paymentsMonezoNFT.buyNFT(1, {
      value: 850,
    });

    await expect(buyNFT).to.changeTokenBalances(
      paymentsMonezoNFT,
      [acc2, owner],
      [-1, 1]
    );

    await expect(buyNFT).to.changeEtherBalances(
      [acc2, owner, paymentsMonezoNFT],
      [679, -700, 21]
    );

    await expect(buyNFT)
      .to.emit(paymentsMonezoNFT, "BoughtNFT")
      .withArgs(1, 850, acc2.address, owner.address);

    const cancelNFT = await paymentsMonezoNFT.getListedNFT(owner.address, 1);
    await expect(await cancelNFT["onsail"]).to.false;
  });

  it("Function updatePlatformFee() - owner can updare platforfee", async function () {
    const changeFee = await paymentsMonezoNFT.updatePlatformFee(9000);

    await expect(paymentsMonezoNFT.updatePlatformFee(10001)).to.be.revertedWith(
      "can't more than 10 percent"
    );

    await expect(
      paymentsMonezoNFT.connect(acc2).updatePlatformFee(5000)
    ).to.be.revertedWith("Not an owner");
  });

  it("Function burnToken() - user can burn token", async function () {
    const SetPriceOwner = paymentsMonezoNFT.setPrice(500);
    await paymentsMonezoNFT.safeMint(owner.address, {
      value: 550,
    });

    const Approve = await paymentsMonezoNFT.approve(acc2.address, 1);
    const GerApprove = await paymentsMonezoNFT.getApproved(1);
    await expect(GerApprove).to.equal(acc2.address);

    await expect(paymentsMonezoNFT.burnToken(0)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );

    await expect(
      paymentsMonezoNFT.connect(acc2).burnToken(1)
    ).to.be.revertedWith("Only token owner can burn the token");

    const burn = await paymentsMonezoNFT.burnToken(1);

    await expect(paymentsMonezoNFT.getApproved(1)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );

    await expect(paymentsMonezoNFT.ownerOf(1)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );

    await expect(burn).to.changeTokenBalance(paymentsMonezoNFT, owner, -1);

    expect(await paymentsMonezoNFT.balanceOf(owner.address)).to.be.eq(0);

    await expect(burn)
      .to.emit(paymentsMonezoNFT, "Transfer")
      .withArgs(owner.address, ethers.constants.AddressZero, 1);
  });
});
