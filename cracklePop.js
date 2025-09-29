function cracklePop() {
    for (let i = 1; i <= 100; i++) {
        const divisibleBy3 = i % 3 === 0;
        const divisibleBy5 = i % 5 === 0;
        if (divisibleBy3 && divisibleBy5) {
            console.log("CracklePop");
        } else if (divisibleBy3) {
            console.log("Crackle");
        } else if (divisibleBy5) {
            console.log("Pop");
        } else {
            console.log(i);
        }
    }
}
cracklePop();