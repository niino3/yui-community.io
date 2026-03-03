const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("========================================");
  console.log("  yui テストネットデプロイ");
  console.log("========================================\n");
  console.log("ネットワーク:", hre.network.name);
  console.log("デプロイヤー:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("残高:        ", hre.ethers.formatEther(balance), "POL\n");

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
  console.log("  確認URL:", `https://amoy.polygonscan.com/address/${tokenAddr}`);

  // --- 2. MembershipSBT デプロイ ---
  let sbtAddr = null;
  try {
    console.log("\n--- 2. MembershipSBT (Soulbound) デプロイ中... ---");
    const MembershipSBT = await hre.ethers.getContractFactory("MembershipSBT");
    const sbt = await MembershipSBT.deploy();
    await sbt.waitForDeployment();
    sbtAddr = await sbt.getAddress();
    deployed.sbt = sbtAddr;
    console.log("MembershipSBT デプロイ完了!");
    console.log("  アドレス:", sbtAddr);
    console.log("  確認URL:", `https://amoy.polygonscan.com/address/${sbtAddr}`);

    // --- 3. テスト: 自分に 100 YUI を mint ---
    console.log("\n--- 3. 自分に 100 YUI を発行 (mint) ---");
    const mintTx = await token.mint(deployer.address, hre.ethers.parseEther("100"));
    await mintTx.wait();
    const bal = await token.balanceOf(deployer.address);
    console.log("  残高:", hre.ethers.formatEther(bal), "YUI");

    // --- 4. テスト: 自分に SBT を発行 ---
    console.log("\n--- 4. 自分に SBT（メンバーシップ証明）を発行 ---");
    const issueTx = await sbt.issue(deployer.address);
    await issueTx.wait();
    const sbtBal = await sbt.balanceOf(deployer.address);
    console.log("  SBT 保有数:", sbtBal.toString());
  } catch (e) {
    console.log("\n⚠️  残高不足のためスキップ:", e.message?.split("\n")[0]);
  }

  // --- まとめ ---
  const balanceAfter = await hre.ethers.provider.getBalance(deployer.address);
  const gasUsed = balance - balanceAfter;

  console.log("\n========================================");
  console.log("  テストネットデプロイ完了!");
  console.log("========================================");
  console.log(`
  YuiToken:      ${deployed.token || "未デプロイ"}
  MembershipSBT: ${deployed.sbt || "未デプロイ"}

  Polygonscan で確認:
    ${deployed.token ? `https://amoy.polygonscan.com/address/${deployed.token}` : "-"}
    ${deployed.sbt ? `https://amoy.polygonscan.com/address/${deployed.sbt}` : "-"}

  ガス代: ${hre.ethers.formatEther(gasUsed)} POL
  残高:   ${hre.ethers.formatEther(balanceAfter)} POL
`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
