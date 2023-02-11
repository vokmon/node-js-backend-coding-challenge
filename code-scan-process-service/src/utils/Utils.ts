/**
 * Utility functions
 */
export default {
  /**
   * Sleep for x milliseconds
   * @param duration in milliseconds
   * @returns 
   */
  delay: (duration: number) => {
    if (!duration) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        resolve();
      }, duration);
    });
  },

  /**
   * Generate random integer
   * 
   * @param max max number to generate
   * @returns 
   */
  getRandomInt: (max: number): number => {
    return Math.floor(Math.random() * max);
  }
}