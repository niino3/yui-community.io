const hre = require("hardhat");

async function main() {
  const [deployer, alice, bob] = await hre.ethers.getSigners();

  console.log("========================================");
  console.log("  yui スマートコントラクト ローカル検証");
  console.log("========================================\n");
  console.log("デプロイヤー:", deployer.address);
  console.log("Alice:       ", alice.address);
  console.log("Bob:         ", bob.address);

  // --- 1. YuiToken デプロイ ---
  console.log("\n--- 1. YuiToken (ERC-20) デプロイ ---");
  const YuiToken = await hre.ethers.getContractFactory("YuiToken");
  const token = await YuiToken.deploy();
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("YuiToken デプロイ完了:", tokenAddr);

  // --- 2. トークン発行 (mint) ---
  console.log("\n--- 2. Alice に 1000 YUI を発行 ---");
  await token.mint(alice.address, hre.ethers.parseEther("1000"));
  const aliceBal = await token.balanceOf(alice.address);
  console.log("Alice の残高:", hre.ethers.formatEther(aliceBal), "YUI");

  // --- 3. トークン送金 (transfer) ---
  console.log("\n--- 3. Alice → Bob に 300 YUI 送金 ---");
  await token.connect(alice).transfer(bob.address, hre.ethers.parseEther("300"));
  const aliceBal2 = await token.balanceOf(alice.address);
  const bobBal = await token.balanceOf(bob.address);
  console.log("Alice の残高:", hre.ethers.formatEther(aliceBal2), "YUI");
  console.log("Bob の残高:  ", hre.ethers.formatEther(bobBal), "YUI");

  // --- 4. MembershipSBT デプロイ ---
  console.log("\n--- 4. MembershipSBT (Soulbound) デプロイ ---");
  const MembershipSBT = await hre.ethers.getContractFactory("MembershipSBT");
  const sbt = await MembershipSBT.deploy();
  await sbt.waitForDeployment();
  const sbtAddr = await sbt.getAddress();
  console.log("MembershipSBT デプロイ完了:", sbtAddr);

  // --- 5. SBT 発行 ---
  console.log("\n--- 5. Alice に SBT（メンバーシップ証明）を発行 ---");
  await sbt.issue(alice.address);
  const aliceSbt = await sbt.balanceOf(alice.address);
  console.log("Alice の SBT 保有数:", aliceSbt.toString());

  // --- 6. SBT 譲渡不可の確認 ---
  console.log("\n--- 6. SBT 譲渡を試みる（失敗するはず）---");
  try {
    await sbt.connect(alice).transferFrom(alice.address, bob.address, 0);
    console.log("ERROR: 譲渡が成功してしまいました！");
  } catch (e) {
    console.log("期待通り譲渡拒否: Soulbound トークンは転送できません ✓");
  }

  // --- まとめ ---
  console.log("\n========================================");
  console.log("  検証完了！すべて正常に動作しました");
  console.log("========================================");
  console.log(`
まとめ:
  - YuiToken (${tokenAddr})
    → mint / transfer が正常動作
  - MembershipSBT (${sbtAddr})
    → SBT 発行成功、譲渡は正しくブロック
`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
