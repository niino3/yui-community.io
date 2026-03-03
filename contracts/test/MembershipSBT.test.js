const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MembershipSBT", function () {
  let sbt;
  let owner;
  let alice;
  let bob;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const MembershipSBT = await ethers.getContractFactory("MembershipSBT");
    sbt = await MembershipSBT.deploy();
  });

  describe("デプロイ", function () {
    it("トークン名とシンボルが正しい", async function () {
      expect(await sbt.name()).to.equal("Yui Membership");
      expect(await sbt.symbol()).to.equal("YUIM");
    });
  });

  describe("issue（SBT 発行）", function () {
    it("管理者が alice に SBT を発行できる", async function () {
      await sbt.issue(alice.address);
      expect(await sbt.balanceOf(alice.address)).to.equal(1);
    });

    it("管理者以外は SBT を発行できない", async function () {
      await expect(
        sbt.connect(alice).issue(alice.address)
      ).to.be.revertedWithCustomError(sbt, "OwnableUnauthorizedAccount");
    });

    it("同じアドレスに2回発行しようとすると失敗する", async function () {
      await sbt.issue(alice.address);
      await expect(sbt.issue(alice.address)).to.be.revertedWith(
        "Already a member"
      );
    });
  });

  describe("Soulbound（譲渡不可）", function () {
    it("SBT を他のアドレスに transfer できない", async function () {
      await sbt.issue(alice.address);
      const tokenId = 0;
      await expect(
        sbt.connect(alice).transferFrom(alice.address, bob.address, tokenId)
      ).to.be.revertedWith("Soulbound: transfer not allowed");
    });

    it("safeTransferFrom でも転送できない", async function () {
      await sbt.issue(alice.address);
      const tokenId = 0;
      await expect(
        sbt
          .connect(alice)
          ["safeTransferFrom(address,address,uint256)"](
            alice.address,
            bob.address,
            tokenId
          )
      ).to.be.revertedWith("Soulbound: transfer not allowed");
    });
  });
});
