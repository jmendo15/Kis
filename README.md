# Kis

Logo:

![kis](https://github.com/jmendo15/Kis/assets/72280816/1bf20903-0a1a-4ef3-bdbb-54f51496ea3a)

# Introduction:
Kis is a sophisticated, statically-typed programming language designed for modern software development needs. Its rich type system supports both primitive and user-defined types, enhanced by advanced features like generics and type inference, allowing developers to write expressive, yet type-safe code. A distinctive feature of Kis is its support for function and operator overloading, enabling context-specific behaviors of functions and operators based on argument types, thereby enhancing the language's flexibility and expressiveness.

Pattern matching, akin to languages like Scala or Rust, is integrated, allowing for concise handling of complex data structures and control flows. Kis also places a strong emphasis on immutability, offering immutable data types to ensure safer and more predictable code, particularly beneficial in concurrent programming scenarios. The language introduces an innovative approach to scoping by supporting nested functions with static scoping rules, necessitating intricate symbol table and scope management in its compiler design. Furthermore, Kis features a robust module system, complete with import/export capabilities, encouraging modularity and code reuse. This comprehensive suite of features positions Kis as a powerful tool for developers looking to leverage the benefits of modern language design in both system-level and high-level application development.


# Features:
1. Rich Type System:
- Includes primitive types and user-defined types.
- Advanced features like generics allow for creating functions and data structures that can operate on different types without sacrificing type safety.
2. Type inference reduces the need for explicit type declarations, making the language more concise and readable.
- Function Overloading and Operator Overloading:
- Functions and operators can behave differently based on their argument types.
- This adds complexity to type checking as the compiler must determine the correct function or operator to use based on the context.
3. Pattern Matching:
- Similar to languages like Scala or Rust, allows matching values against patterns.
- Enables more expressive and concise code, especially when working with complex data structures.
-Requires sophisticated static analysis to ensure correct and efficient implementation.

4. Immutable Data Types:
- Once created, objects of these types cannot be modified.
- This feature is crucial for functional programming paradigms and can help in writing safer, more predictable code.
- The language runtime and compiler must enforce and optimize the use of immutable data.
  
5. Static Scoping with Nested Functions:
- Allows functions to be defined within other functions, creating a hierarchy of scopes.
- Requires a more complex symbol table and scope management in the compiler to handle the visibility and lifetime of variables correctly.
  
6. Module System:
- A system for organizing and packaging code with import/export capabilities.
- Ensures code modularity and reuse.
- Requires the compiler to perform static analysis for dependency resolution and to handle issues like name collisions and visibility.

# Example Programs:
**Mathematica**: Known for its symbolic computation abilities, Mathematica heavily uses function and operator overloading to operate on various types of data, from numbers to symbolic expressions.

**Node.js Applications**: Node.js, though dynamically typed, has a robust module system. Large-scale Node.js applications demonstrate the effectiveness of modular code organization.
**Java**: Allows the creation of immutable objects by making class fields final and private, and not providing setters.

