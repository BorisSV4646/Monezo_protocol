const fs = require("fs");
const path = require("path");

const assets = ["Yellow", "Black", "Orange", "Red", "Blue", "Pink", "Green"];

for (let i = 1; i <= 10; i++) {
  const filePath = path.join(__dirname, "JSON", "" + i);
  const params = [];
  for (let j = 1; j <= 3; j++) {
    let randomIndexBody = Math.floor(Math.random() * assets.length);
    params.push(assets[randomIndexBody]);
  }
  let json = {};
  json.name = "MonezoToken #" + i;
  json.description = "NFT collections from MonezoProtocol";
  json.image =
    "ipfs://bafybeigzbdwamrseia5pwtzudyidm4m2736gdbvy3lohxqkwqfqpu6vo7e/" +
    i +
    ".jpg";
  json.attributes = [
    {
      trait_type: "Body",
      value: `${params[0]}`,
    },
    {
      trait_type: "Cover",
      value: `${params[1]}`,
    },
    {
      trait_type: "Hair",
      value: `${params[2]}`,
    },
  ];

  fs.writeFileSync(filePath, JSON.stringify(json));
}
