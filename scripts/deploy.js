const hre = require("hardhat");
const { verify } = require("../task/verify");

async function main() {
  [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const ERC721 = await ethers.getContractFactory("ERC721_SUIT_TOKEN", deployer);

  const TokenERC721 = await ERC721.deploy(InitialSuplay);

  await TokenERC721.deployed(InitialSuplay);

  console.log("Token ERC721 address:", TokenERC721.address);

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
