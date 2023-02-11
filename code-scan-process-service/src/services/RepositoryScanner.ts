import axios from "axios";
import * as path from "path";
import logger from "../logger/WinstonLogger";
import { Finding } from "../models/repositories/ScanEventResultRepositoryModel";
import { ScanRepositoryResult } from "../models/services/ScanRepositoryResult";
import Utils from "../utils/Utils";
const file = path.basename(__filename);

let names: string[];

/**
 * Repository scanner to find the vulnerable files
 */
class RepositoryScanner {
  /**
   * Scan the specified repository
   */
  public async scanRepository(repositoryName: string): Promise<ScanRepositoryResult> {
    logger.info(`Start scanning repository ${repositoryName}`, { file })

    // Generate randomly number of vulnerabilities (0 - 5)
    const vulnerabilities = Utils.getRandomInt(5);
    if (vulnerabilities === 0) {
      logger.info(`No vulnerable files`, { file })
      // No vulnerabilities, it can be returned immediately
      return { vulnerabilityScore: vulnerabilities, findings: [] };
    }
    const result = await this.getVulnerabileFiles(vulnerabilities)
    logger.info(`Detect vulnerabilities: ${vulnerabilities}. Findings ${JSON.stringify(result)}`, { file })
    return { vulnerabilityScore: vulnerabilities, findings: result };
  }

  async getFileNames(): Promise<string[]> {
    if (!names) {
      const result = await axios.get(process.env.GET_FILE_NAME_API);
      names = result.data;
    }
    return names;
  }

  async getVulnerabileFiles(numberOfFile: number = 0): Promise<Finding[]> {
    // Based on the vulnerabilities, using this free API (https://names.drycodes.com/20?nameOptions=funnyWords) to get randomly names representing for the file's name contains that one
    const names = await this.getFileNames();
    const result: Finding[] = [];
    for (let i = 0; i < numberOfFile; i++) {

      // Randomly pick the name from the list
      const randomIndex = Utils.getRandomInt(names.length - 1);
      const randomLineOfCode = Utils.getRandomInt(1000);
      const path = names[randomIndex];
      logger.info(`Get name from index ${randomIndex}(resolve to ${path}) and line of code ${randomLineOfCode}`, { file })

      // Compose the finding objects
      const finding = {
        type: 'sast',
        location: {
          path,
          positions: {
            begin: {
              line: randomLineOfCode,
            }
          }
        }
      }

      result.push(finding);
    }

    return result;
  }
}

export default RepositoryScanner;