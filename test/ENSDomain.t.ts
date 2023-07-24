import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ENSDomain", function () {
  async function deployFixture() {
    const [owner, acc1, acc2] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("ENSDomain");
    const contract = await Contract.deploy();
    return { contract, owner, acc1, acc2 };
  }

  describe("Register", function () {
    it("should register correctly", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await contract.register("thomas", 2, {
        value: ethers.parseEther("0.1")
      })
      expect((await contract.domains("thomas")).owner).to.eq(owner.address);
    });
    it("should be impossible to register one domain to\n\
        two different addresses", async function () {
      const { contract, acc1, acc2 } = await loadFixture(deployFixture);
      await contract.connect(acc1).register("thomas", 2, {
        value: ethers.parseEther("0.1")
      })
      await expect(contract.connect(acc2).register("thomas", 2, {
        value: ethers.parseEther("0.1")
      })).to.revertedWith("Error: This domain is occupied")
    })
    it("should be impossible to register a domain when\n\
        transferring an incorrect amount of funds", async function () {
      const { contract } = await loadFixture(deployFixture);
      await expect(contract.register("thomas", 2, {
        value: ethers.parseEther("0.001")
      })).to.be.revertedWith("Error: The wrong amount of funds was transferred!");
      await expect(contract.register("aquinas", 2, {
        value: ethers.parseEther("10")
      })).to.be.revertedWith("Error: The wrong amount of funds was transferred!")
    })
    it("should be impossible to register a domain for\n\
        a period of less than one year and more than\n\
        ten years", async function () {
      const { contract } = await loadFixture(deployFixture);
      await expect(contract.register("thomas", 0, {
        value: ethers.parseEther("0")
      })).to.be.revertedWith("Error: The number of years must be at least one!");
      await expect(contract.register("aquinas", 20, {
        value: ethers.parseEther("1")
      })).to.be.revertedWith("Error: The number of years should be no more than ten!");
    })
  });
  describe("Withdrawal", function () {
    it("should withdraw funds from the contract correctly", async function() {
      const { contract, acc1, owner } = await loadFixture(deployFixture);
      await contract.connect(acc1).register("thomas", 2, {
        value: ethers.parseEther("0.1")
      });
      await contract.connect(owner).withdraw();
    })
    it("should be impossible to withdraw funds to someone\n\
        other than the contract owner", async function () {
      const { contract, acc1, owner } = await loadFixture(deployFixture);
      await contract.connect(owner).register("thomas", 2, {
        value: ethers.parseEther("0.1")
      });
      await expect(contract.connect(acc1).withdraw()).to.be.revertedWith("Access denied: contract owner only!")
    })
  })
  describe("Charge setting", function () {
    it("should be impossible to set the annual payment\n\
        to someone other than the contract owner", async function () {
        const { contract, acc1 } = await loadFixture(deployFixture);
        await expect(contract.connect(acc1).setOneYearCharge(ethers.parseEther("0.1")))
        .to.be.revertedWith("Access denied: contract owner only!")
      })
  })
  describe("Renew ratio setting", function () {
    it("should be impossible to set the renew ratio to\n\
        someone other than the contract owner", async function () {
        const { contract, acc1 } = await loadFixture(deployFixture);
        await expect(contract.connect(acc1).setRatio(12))
        .to.be.revertedWith("Access denied: contract owner only!")
      })
  })
  describe("Renew", function () {
    it("should be impossible to renew a domain for\n\
        someone who is not the domain owner", async function () {
      const { contract, acc1, acc2 } = await loadFixture(deployFixture);
      contract.connect(acc1).register("thomas", 2, {
        value: ethers.parseEther("0.1")
      });
      await expect(contract.connect(acc2).renew("thomas", 2, {
        value: BigInt(12) * ethers.parseEther("0.1") / BigInt(10)
      })).to.be.revertedWith("Access denied: domain owner only");
    });
    it("should be impossible to renew a domain by transferring\n\
        an incorrect amount of funds", async function () {
      const { contract, acc1 } = await loadFixture(deployFixture);
      contract.connect(acc1).register("aquinas", 2, {
        value: ethers.parseEther("0.1")
      });
      await expect(contract.connect(acc1).renew("aquinas", 2, {
        value: ethers.parseEther("0.1")
      })).to.be.revertedWith("Error: The wrong amount of funds was transferred!");
    });
    it("Domain registration must not be extended for less than\n\
        one year", async function () {
        const { contract, acc1 } = await loadFixture(deployFixture);
        contract.connect(acc1).register("thomas", 2, {
          value: ethers.parseEther("0.1")
        });
        await expect(contract.connect(acc1).renew("thomas", 0, {
          value: BigInt(0)
        })).to.be.revertedWith("Error: It is not possible to renew the domain for less than one year");
    });
    it("Domain registration must not be extended for more than\n\
        ten years", async function () {
          const { contract, acc1 } = await loadFixture(deployFixture);
          contract.connect(acc1).register("thomas", 2, {
            value: ethers.parseEther("0.1")
          });
          await expect(contract.connect(acc1).renew("thomas", 20, {
            value: BigInt(12) * ethers.parseEther('1') / BigInt(10)
          })).to.be.revertedWith("Error: You cannot extend the domain for a period longer than 10 years");
        })
  })
});
