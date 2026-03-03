const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YuiToken", function () {
  let token;
  let owner;
  let alice;
  let bob;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const YuiToken = await ethers.getContractFactory("YuiToken");
    token = await YuiToken.deploy();
  });

  describe("デプロイ", function () {
    it("トークン名とシンボルが正しい", async function () {
      expect(await token.name()).to.equal("Yui Token");
      expect(await token.symbol()).to.equal("YUI");
    });

    it("初期供給量は 0", async function () {
      expect(await token.totalSupply()).to.equal(0);
    });
  });

  describe("mint（トークン発行）", function () {
    it("管理者が alice に 1000 YUI を発行できる", async function () {
      await token.mint(alice.address, ethers.parseEther("1000"));
      expect(await token.balanceOf(alice.address)).to.equal(
        ethers.parseEther("1000")
      );
    });

    it("管理者以外は mint できない", async function () {
      await expect(
        token.connect(alice).mint(alice.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  describe("transfer（送金）", function () {
    it("alice が bob に 200 YUI を送金できる", async function () {
      await token.mint(alice.address, ethers.parseEther("1000"));
      await token
        .connect(alice)
        .transfer(bob.address, ethers.parseEther("200"));

      expect(await token.balanceOf(alice.address)).to.equal(
        ethers.parseEther("800")
      );
      expect(await token.balanceOf(bob.address)).to.equal(
        ethers.parseEther("200")
      );
    });

    it("残高不足の場合は送金できない", async function () {
      await token.mint(alice.address, ethers.parseEther("100"));
      await expect(
        token
          .connect(alice)
          .transfer(bob.address, ethers.parseEther("200"))
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });
  });
});
