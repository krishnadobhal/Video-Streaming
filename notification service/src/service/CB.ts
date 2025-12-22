class CircuitBreaker {
    private static instance: CircuitBreaker;

    private state: "RUNNING" | "PAUSED" = "RUNNING";
    private failureCount = 0;
    private backoffTimer?: NodeJS.Timeout;

    readonly BASE_DELAY = 60_000; // 1 min
    readonly MAX_RETRIES = 3;

    static getInstance() {
        if (!this.instance) {
            this.instance = new CircuitBreaker();
        }
        return this.instance;
    }

    canConsume() {
        return this.state === "RUNNING";
    }

    recordSuccess() {
        this.failureCount = 0;
        this.state = "RUNNING";
        console.log("System RUNNING");
    }

    // pauseFn: function to pause consuming messages
    // resumeFn: function to resume consuming messages
    recordFailure(pauseFn: () => Promise<void>, resumeFn: () => void) {
        this.failureCount++;

        if (this.failureCount > this.MAX_RETRIES) {
            return;
        }

        if (this.state === "PAUSED") return;

        const delay = this.BASE_DELAY * Math.pow(2, this.failureCount - 1);

        this.state = "PAUSED";
        console.log(`System PAUSED for ${delay / 1000}s`);

        pauseFn().then(() => {
            this.backoffTimer = setTimeout(() => {
                this.state = "RUNNING";
                console.log("System RESUMED");
                resumeFn();
            }, delay);
        });
    }
}

export const circuitBreakerTest = CircuitBreaker.getInstance();
