const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("========================================");
  console.log("  yui Polygon 本番デプロイ");
  console.log("========================================\n");
  console.log("ネットワーク:", hre.network.name);
  console.log("デプロイヤー:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("残高:        ", hre.ethers.formatEther(balance), "POL\n");

  if (hre.network.name !== "polygon") {
    console.error("ERROR: --network polygon を指定してください");
    process.exit(1);
  }

  const deployed = {};

  // --- 1. YuiToken デプロイ ---
  console.log("--- 1. YuiToken (ERC-20) デプロイ中... ---");
  const YuiToken = await hre.ethers.getContractFactory("YuiToken");
  const token = await YuiToken.deploy();
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  deployed.token = tokenAddr;
  console.log("YuiToken デプロイ完了!");
  console.log("  アドレス:", tokenAddr);
  console.log("  確認URL:", `https://polygonscan.com/address/${tokenAddr}`);

  // --- 2. MembershipSBT デプロイ ---
  console.log("\n--- 2. MembershipSBT (Soulbound) デプロイ中... ---");
  const MembershipSBT = await hre.ethers.getContractFactory("MembershipSBT");
  const sbt = await MembershipSBT.deploy();
  await sbt.waitForDeployment();
  const sbtAddr = await sbt.getAddress();
  deployed.sbt = sbtAddr;
  console.log("MembershipSBT デプロイ完了!");
  console.log("  アドレス:", sbtAddr);
  console.log("  確認URL:", `https://polygonscan.com/address/${sbtAddr}`);

  // --- 3. 初期 mint ---
  console.log("\n--- 3. デプロイヤーに 10000 YUI を発行 (初期供給) ---");
  const mintTx = await token.mint(deployer.address, hre.ethers.parseEther("10000"));
  await mintTx.wait();
  const bal = await token.balanceOf(deployer.address);
  console.log("  残高:", hre.ethers.formatEther(bal), "YUI");

  // --- 4. デプロイヤーに SBT を発行 ---
  console.log("\n--- 4. デプロイヤーに SBT（メンバーシップ証明）を発行 ---");
  const issueTx = await sbt.issue(deployer.address);
  await issueTx.wait();
  const sbtBal = await sbt.balanceOf(deployer.address);
  console.log("  SBT 保有数:", sbtBal.toString());

  // --- まとめ ---
  const balanceAfter = await hre.ethers.provider.getBalance(deployer.address);
  const gasUsed = balance - balanceAfter;

  console.log("\n========================================");
  console.log("  Polygon 本番デプロイ完了!");
  console.log("========================================");
  console.log(`
  YuiToken:      ${deployed.token}
  MembershipSBT: ${deployed.sbt}

  Polygonscan で確認:
    https://polygonscan.com/address/${deployed.token}
    https://polygonscan.com/address/${deployed.sbt}

  ガス代: ${hre.ethers.formatEther(gasUsed)} POL
  残高:   ${hre.ethers.formatEther(balanceAfter)} POL

  ★ 次のステップ:
  1. src/contracts/addresses.js のアドレスを上記に更新
  2. src/web3/config.js を polygon に変更
  3. Vercel にデプロイ
`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
