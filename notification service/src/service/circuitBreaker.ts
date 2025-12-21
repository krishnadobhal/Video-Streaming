class CircuitBreaker {
    private failureCount = 0;
    private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
    private lastFailureTime = 0;
    private halfOpenInProgress = false;

    private readonly failureThreshold: number;
    private readonly OPEN_TIMEOUT = 10 * 60 * 1000;

    constructor(failureThreshold = 5) {
        this.failureThreshold = failureThreshold;
    }

    public canExecute(): boolean {
        if (this.state === "OPEN") {
            const now = Date.now();
            if (now - this.lastFailureTime < this.OPEN_TIMEOUT) {
                return false; // block call
            }
            this.state = "HALF_OPEN";
            this.halfOpenInProgress = false;

            return true; // allow test request
        }
        if (this.state === "HALF_OPEN") {
            if (this.halfOpenInProgress) {
                return false;
            }
            this.halfOpenInProgress = true; // lock it
        }
        return true;
    }

    public recordSuccess() {
        if (this.state === "HALF_OPEN") {
            this.failureCount = 0;
            this.state = "CLOSED";
            console.log("Circuit breaker CLOSED");
        }
        this.halfOpenInProgress = false;
    }

    public recordFailure() {
        this.lastFailureTime = Date.now();
        this.halfOpenInProgress = false;

        if (this.state === "HALF_OPEN") {
            this.state = "OPEN";
            console.log("Circuit breaker OPEN (half-open failed)");
            return;
        }

        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.state = "OPEN";
            console.log("Circuit breaker OPEN");
        }
    }

    public getState() {
        return this.state;
    }
}

export default CircuitBreaker;
