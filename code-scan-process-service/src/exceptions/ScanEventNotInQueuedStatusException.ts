/**
 * Exception represents Scan event is not in Queued status
 */
class ScanEventNotInQueuedStatusException extends Error {  
  constructor (message) {
    super(message)

    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name

    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ScanEventNotInQueuedStatusException;