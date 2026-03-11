const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CommunityFactory", function () {
  let factory, registry;
  let owner, admin1, admin2, user1, user2;

  beforeEach(async function () {
    [owner, admin1, admin2, user1, user2] = await ethers.getSigners();

    // 1. CommunityRegistry をデプロイ
    const CommunityRegistry = await ethers.getContractFactory("CommunityRegistry");
    registry = await CommunityRegistry.deploy();
    await registry.waitForDeployment();

    // 2. CommunityFactory をデプロイ
    const CommunityFactory = await ethers.getContractFactory("CommunityFactory");
    factory = await CommunityFactory.deploy(await registry.getAddress());
    await factory.waitForDeployment();

    // 3. Factory を Registry の owner にする
    await registry.transferOwnership(await factory.getAddress());
  });

  describe("デプロイ", function () {
    it("Registry アドレスが正しく設定される", async function () {
      expect(await factory.registry()).to.equal(await registry.getAddress());
    });
  });

  describe("createCommunity", function () {
    it("新しいコミュニティを作成できる", async function () {
      const config = {
        name: "Hokkaido Community",
        slug: "hokkaido",
        tokenName: "Hokkaido Community Dollar",
        tokenSymbol: "HKD",
        sbtName: "Hokkaido Community Membership",
        sbtSymbol: "HKDM",
        admin: admin1.address,
        initialSupply: ethers.parseEther("10000"),
      };

      const tx = await factory.connect(admin1).createCommunity(config);
      const receipt = await tx.wait();

      // イベントをチェック
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "CommunityCreated"
      );
      expect(event).to.not.be.undefined;
      expect(event.args.communityId).to.equal(1n);
      expect(event.args.name).to.equal(config.name);
      expect(event.args.slug).to.equal(config.slug);
      expect(event.args.admin).to.equal(admin1.address);

      // Registry に登録されたか確認
      const community = await registry.getCommunity(1);
      expect(community.name).to.equal(config.name);
      expect(community.slug).to.equal(config.slug);
      expect(community.admin).to.equal(admin1.address);
      expect(community.active).to.be.true;

      // Token がデプロイされたか確認
      const CommunityToken = await ethers.getContractFactory("CommunityToken");
      const token = CommunityToken.attach(community.token);
      expect(await token.name()).to.equal(config.tokenName);
      expect(await token.symbol()).to.equal(config.tokenSymbol);
      expect(await token.balanceOf(admin1.address)).to.equal(config.initialSupply);

      // SBT がデプロイされたか確認
      const CommunitySBT = await ethers.getContractFactory("CommunitySBT");
      const sbt = CommunitySBT.attach(community.sbt);
      expect(await sbt.name()).to.equal(config.sbtName);
      expect(await sbt.symbol()).to.equal(config.sbtSymbol);
      expect(await sbt.balanceOf(admin1.address)).to.equal(1n);
    });

    it("複数のコミュニティを作成できる", async function () {
      const config1 = {
        name: "Hokkaido Community",
        slug: "hokkaido",
        tokenName: "Hokkaido Community Dollar",
        tokenSymbol: "HKD",
        sbtName: "Hokkaido Community Membership",
        sbtSymbol: "HKDM",
        admin: admin1.address,
        initialSupply: ethers.parseEther("10000"),
      };

      const config2 = {
        name: "Kyoto Community",
        slug: "kyoto",
        tokenName: "Kyoto Community Yen",
        tokenSymbol: "KYT",
        sbtName: "Kyoto Community Membership",
        sbtSymbol: "KYTM",
        admin: admin2.address,
        initialSupply: ethers.parseEther("5000"),
      };

      await factory.connect(admin1).createCommunity(config1);
      await factory.connect(admin2).createCommunity(config2);

      expect(await factory.communityCount()).to.equal(3n); // 1と2が登録済み

      const community1 = await registry.getCommunity(1);
      const community2 = await registry.getCommunity(2);

      expect(community1.name).to.equal(config1.name);
      expect(community2.name).to.equal(config2.name);

      // トークンが独立していることを確認
      expect(community1.token).to.not.equal(community2.token);
      expect(community1.sbt).to.not.equal(community2.sbt);
    });

    it("同じslugでは作成できない", async function () {
      const config = {
        name: "Hokkaido Community",
        slug: "hokkaido",
        tokenName: "Hokkaido Community Dollar",
        tokenSymbol: "HKD",
        sbtName: "Hokkaido Community Membership",
        sbtSymbol: "HKDM",
        admin: admin1.address,
        initialSupply: ethers.parseEther("10000"),
      };

      await factory.connect(admin1).createCommunity(config);

      // 同じslugで再度作成しようとするとエラー
      await expect(
        factory.connect(admin2).createCommunity(config)
      ).to.be.revertedWith("Slug already exists");
    });

    it("空のnameでは作成できない", async function () {
      const config = {
        name: "",
        slug: "hokkaido",
        tokenName: "Hokkaido Community Dollar",
        tokenSymbol: "HKD",
        sbtName: "Hokkaido Community Membership",
        sbtSymbol: "HKDM",
        admin: admin1.address,
        initialSupply: ethers.parseEther("10000"),
      };

      await expect(
        factory.connect(admin1).createCommunity(config)
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("initialSupplyが0では作成できない", async function () {
      const config = {
        name: "Hokkaido Community",
        slug: "hokkaido",
        tokenName: "Hokkaido Community Dollar",
        tokenSymbol: "HKD",
        sbtName: "Hokkaido Community Membership",
        sbtSymbol: "HKDM",
        admin: admin1.address,
        initialSupply: 0,
      };

      await expect(
        factory.connect(admin1).createCommunity(config)
      ).to.be.revertedWith("Initial supply must be > 0");
    });
  });

  describe("getCommunity", function () {
    it("コミュニティ情報を取得できる", async function () {
      const config = {
        name: "Hokkaido Community",
        slug: "hokkaido",
        tokenName: "Hokkaido Community Dollar",
        tokenSymbol: "HKD",
        sbtName: "Hokkaido Community Membership",
        sbtSymbol: "HKDM",
        admin: admin1.address,
        initialSupply: ethers.parseEther("10000"),
      };

      await factory.connect(admin1).createCommunity(config);

      const community = await factory.getCommunity(1);
      expect(community.name).to.equal(config.name);
      expect(community.slug).to.equal(config.slug);
      expect(community.admin).to.equal(admin1.address);
    });
  });

  describe("CommunityToken", function () {
    let token;

    beforeEach(async function () {
      const config = {
        name: "Hokkaido Community",
        slug: "hokkaido",
        tokenName: "Hokkaido Community Dollar",
        tokenSymbol: "HKD",
        sbtName: "Hokkaido Community Membership",
        sbtSymbol: "HKDM",
        admin: admin1.address,
        initialSupply: ethers.parseEther("10000"),
      };

      await factory.connect(admin1).createCommunity(config);
      const community = await registry.getCommunity(1);
      const CommunityToken = await ethers.getContractFactory("CommunityToken");
      token = CommunityToken.attach(community.token);
    });

    it("admin がトークンを mint できる", async function () {
      await token.connect(admin1).mint(user1.address, ethers.parseEther("100"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("admin 以外は mint できない", async function () {
      await expect(
        token.connect(user1).mint(user2.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });

    it("トークンを送金できる", async function () {
      await token.connect(admin1).transfer(user1.address, ethers.parseEther("500"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("500"));
      expect(await token.balanceOf(admin1.address)).to.equal(ethers.parseEther("9500"));
    });
  });

  describe("CommunitySBT", function () {
    let sbt;

    beforeEach(async function () {
      const config = {
        name: "Hokkaido Community",
        slug: "hokkaido",
        tokenName: "Hokkaido Community Dollar",
        tokenSymbol: "HKD",
        sbtName: "Hokkaido Community Membership",
        sbtSymbol: "HKDM",
        admin: admin1.address,
        initialSupply: ethers.parseEther("10000"),
      };

      await factory.connect(admin1).createCommunity(config);
      const community = await registry.getCommunity(1);
      const CommunitySBT = await ethers.getContractFactory("CommunitySBT");
      sbt = CommunitySBT.attach(community.sbt);
    });

    it("admin が SBT を issue できる", async function () {
      await sbt.connect(admin1).issue(user1.address);
      expect(await sbt.balanceOf(user1.address)).to.equal(1n);
    });

    it("同じアドレスに2つ発行できない", async function () {
      await expect(
        sbt.connect(admin1).issue(admin1.address)
      ).to.be.revertedWith("Already a member");
    });

    it("SBT を転送できない", async function () {
      await sbt.connect(admin1).issue(user1.address);
      await expect(
        sbt.connect(user1).transferFrom(user1.address, user2.address, 1)
      ).to.be.revertedWith("Soulbound: transfer not allowed");
    });
  });
});
