const hre = require("hardhat");
const { verify } = require("../task/verify");

async function main() {
  const InitialSuplay = 100;

  [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const ERC20 = await ethers.getContractFactory("ERC20_MONEZO_TOKEN", deployer);
  const TokenERC20 = await ERC20.deploy(InitialSuplay);

  await TokenERC20.deployed(InitialSuplay);

  console.log("Token ERC20 address:", TokenERC20.address);

  verify(TokenERC20.address, InitialSuplay);

  const SnapshotMonezo = await ethers.getContractFactory(
    "SnapshotMonezo",
    deployer
  );
  const MonezoMainContract = await SnapshotMonezo.deploy();

  await MonezoMainContract.deployed();

  console.log("Main contract address:", MonezoMainContract.address);

  const monezoStaking = await ethers.getContractFactory(
    "ERC721Staking",
    deployer
  );
  const paymentsMonezoStaking = await monezoStaking.deploy(
    MonezoMainContract.address,
    TokenERC20.address
  );
  await paymentsMonezoStaking.deployed(
    MonezoMainContract.address,
    TokenERC20.address
  );

  console.log("ERC721Staking address:", paymentsMonezoStaking.address);

  await TokenERC20.setNewCreater(paymentsMonezoStaking.address);

  console.log(`Creator ERC20 contract set: ${await TokenERC20.creater()}`);

  verify(MonezoMainContract.address, TokenERC20.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
