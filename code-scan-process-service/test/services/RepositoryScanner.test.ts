import { Finding } from "../../src/models/repositories/ScanEventResultRepositoryModel";
import RepositoryScanner from "../../src/services/RepositoryScanner";
import dotenv from "dotenv";
import Utils from "../../src/utils/Utils";
import { ScanRepositoryResult } from "../../src/models/services/ScanRepositoryResult";
dotenv.config();

describe("Test Scan event repository", () => {
  let repositoryScanner: RepositoryScanner;

  beforeAll(() => {
    repositoryScanner = new RepositoryScanner();
  });

  describe("Test get file name api", () => {
    it("Should get names successfully", async () => {
      const result = await repositoryScanner.getFileNames();
      expect(result.length).toBeGreaterThan(0);
    })
  })

  describe("Test get vulnerabile files", () => {
    it("Should get 5 vulnerabile files", async () => {
      const numberOfFiles = 5;
      const findings: Finding[] = await repositoryScanner.getVulnerabileFiles(numberOfFiles);
      expect(findings.length).toEqual(numberOfFiles);
      findings.forEach((finding) => {
        console.log(finding)
        expect(finding?.location?.path).toBeDefined();
        expect(finding?.location?.positions?.begin?.line).toBeDefined();
      })
    })

    it("Should get no vulnerabile file", async () => {
      const findingsZero: Finding[] = await repositoryScanner.getVulnerabileFiles(0);
      expect(findingsZero.length).toEqual(0);

      const findingsUndefined: Finding[] = await repositoryScanner.getVulnerabileFiles();
      expect(findingsUndefined.length).toEqual(0);

      const findingsNull: Finding[] = await repositoryScanner.getVulnerabileFiles(null);
      expect(findingsNull.length).toEqual(0);
    })
  })

  describe("Test scan repository", () => {
    it("Should get no vulnerabile file", async () => {
      jest.spyOn(Utils, 'getRandomInt').mockImplementation(() => 0);
      const result: ScanRepositoryResult = await repositoryScanner.scanRepository("repo-name");
      expect(result.vulnerabilityScore).toEqual(0);
      expect(result?.findings.length).toEqual(0);
    });
    it("Should get 5 vulnerabile files", async () => {
      jest.spyOn(Utils, 'getRandomInt').mockImplementation(() => 5);
      const result: ScanRepositoryResult = await repositoryScanner.scanRepository("repo-name");
      expect(result.vulnerabilityScore).toEqual(5);
      expect(result?.findings.length).toEqual(5);
    })
  });
});