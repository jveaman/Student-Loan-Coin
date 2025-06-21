const fs = require("fs");
const hre = require("hardhat");

async function main() {
  const flattened = await hre.run("flatten", {
    files: ["./contracts/studentloancoin.sol"],
  });

  if (flattened) {
    fs.writeFileSync("flattened.sol", flattened);
    console.log("✅ Flattened contract saved as flattened.sol");
  } else {
    console.error("❌ Flattened output was undefined. Make sure the contract compiles.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
