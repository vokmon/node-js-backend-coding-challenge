import Utils from "../../src/utils/Utils";

describe("Test Utility function", () => {
  describe("Test delay method", () => {
    it("Test no sleep", async () => {
      const duration = 0;
      const start = new Date();
      await Utils.delay(duration);
      const end = new Date();
      expect(end.getSeconds() - start.getSeconds()).toBe(0);
    });

    it("Test sleep for 1 second", async () => {
      const durationInSecond = 1;
      const start = new Date();
      await Utils.delay(durationInSecond * 1000);
      const end = new Date();
      expect(end.getSeconds() - start.getSeconds()).toBeGreaterThanOrEqual(durationInSecond);
    })
  });

  describe("Test get randome number method", () => {
    const maxNumber = 10;
    const randomNumber = Utils.getRandomInt(maxNumber);
    expect(randomNumber).toBeLessThanOrEqual(maxNumber);
  });
});