import { expect } from "chai";
import { ethers } from "hardhat";
import { BettingContract } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("BettingContract", function () {
  let bettingContract: BettingContract;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const factory = await ethers.getContractFactory("BettingContract");
    bettingContract = (await factory.deploy()) as BettingContract;
    await bettingContract.waitForDeployment();
  });

  it("should allow owner to create a bet", async function () {
    await bettingContract.connect(addr1).createBet({ value: ethers.parseEther("1") });

    const bet = (await bettingContract.getAllBets())[0];
    expect(bet.amount).to.equal(ethers.parseEther("1"));
    expect(bet.players[0]).to.equal(addr1.address);
    expect(bet.isOpen).to.equal(true);
  });

  it("should allow users to join a bet", async function () {
    await bettingContract.connect(addr1).createBet({ value: ethers.parseEther("1") });

    await bettingContract.connect(addr2).joinBet(0, { value: ethers.parseEther("1") });
    const bet = (await bettingContract.getAllBets())[0];

    expect(bet.players.length).to.equal(2);
    expect(bet.players[1]).to.equal(addr2.address);
  });

  it("should prevent users from joining the same bet twice", async function () {
    await bettingContract.connect(addr1).createBet({ value: ethers.parseEther("1") });

    await bettingContract.connect(addr2).joinBet(0, { value: ethers.parseEther("1") });
    await expect(bettingContract.connect(addr2).joinBet(0, { value: ethers.parseEther("1") })).to.be.revertedWith(
      "You are already participating in this bet",
    );
  });

  it("should allow the owner to resolve a bet", async function () {
    await bettingContract.connect(addr1).createBet({ value: ethers.parseEther("1") });
    await bettingContract.connect(addr2).joinBet(0, { value: ethers.parseEther("1") });

    await bettingContract.connect(owner).resolveBet(0, addr1.address);

    const bet = (await bettingContract.getAllBets())[0];
    expect(bet.isOpen).to.equal(false);
    expect(bet.winner).to.equal(addr1.address);
  });

  it("should prevent non-owners from resolving a bet", async function () {
    await bettingContract.connect(addr1).createBet({ value: ethers.parseEther("1") });
    await bettingContract.connect(addr2).joinBet(0, { value: ethers.parseEther("1") });

    await expect(bettingContract.connect(addr2).resolveBet(0, addr1.address)).to.be.revertedWith(
      "Only the owner can perform this action",
    );
  });

  it("should correctly retrieve all bets", async function () {
    await bettingContract.connect(addr1).createBet({ value: ethers.parseEther("1") });
    await bettingContract.connect(addr2).createBet({ value: ethers.parseEther("2") });

    const allBets = await bettingContract.getAllBets();
    expect(allBets.length).to.equal(2);
    expect(allBets[0].amount).to.equal(ethers.parseEther("1"));
    expect(allBets[1].amount).to.equal(ethers.parseEther("2"));
  });
});
