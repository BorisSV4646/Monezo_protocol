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

  const SnapshotMonezo = await ethers.getContractFactory(
    "SnapshotMonezo",
    deployer
  );
  const MonezoMainContract = await SnapshotMonezo.deploy(
    "SnapshotMonezo",
    "ST",
    3,
    TokenERC20.address
  );

  await MonezoMainContract.deployed(
    "SnapshotMonezo",
    "ST",
    3,
    TokenERC20.address
  );

  console.log("Main contract address:", MonezoMainContract.address);

  await TokenERC20.setNewCreater(MonezoMainContract.address);

  console.log(`Creator ERC20 contract set: ${await TokenERC20.creater()}`);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying...");
    await verify(TokenERC721.address, deployer);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
