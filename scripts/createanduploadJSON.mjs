import { NFTStorage, File } from "nft.storage";

async function main() {
  const NFT_STORAGE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDJCMTNmYjVFRjlEZWY3MTk5ZkNhRmIzNzg2OEJlMzdhREFkQzZGY0IiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY4MTc4NjQ5Mjk4NiwibmFtZSI6Ik1vbmV6b05GVCJ9.93KkpmFEHutf6oSj17e1MpXJPPmuk3paMVmg3Jtb3zI";
  const client = new NFTStorage({ token: NFT_STORAGE_KEY });

  const Json = [];

  const assets = ["Yellow", "Black", "Orange", "Red", "Blue", "Pink", "Green"];

  for (let i = 1; i <= 10; i++) {
    // const filePath = path.join(__dirname, "JSON", "" + i);
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

    Json.push(new File([JSON.stringify(json)], `${i}.json`));
  }

  const cid = await client.storeDirectory(Json);

  console.log("stored at:", cid);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
