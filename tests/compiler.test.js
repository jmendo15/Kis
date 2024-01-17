const assertEquality = (actual, expected) => {
    if (actual === expected) {
        console.log('Assertion passed successfully!');
    } else {
        console.error(`Assertion failed: Expected ${expected}, but got ${actual}`);
    }
};

// Use the function to assert
assertEquality(1, 1);