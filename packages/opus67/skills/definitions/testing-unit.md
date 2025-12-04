# Unit Testing Expert

> **ID:** `testing-unit`
> **Tier:** 3
> **Token Cost:** 5000
> **MCP Connections:** None

## 🎯 What This Skill Does

- Write unit tests (Jest/Vitest)
- Mocking and stubbing
- Test coverage analysis
- TDD patterns
- Testing React components

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** jest, vitest, unit test, mock, coverage, tdd
- **File Types:** .test.ts, .spec.ts
- **Directories:** N/A

## 🚀 Core Capabilities


### 1. Write unit tests (Jest/Vitest)

Create fast, isolated unit tests that verify individual functions, classes, and modules work correctly.

**Best Practices:**
- One test file per source file
- Test pure functions first (easiest to test)
- Use descriptive test names (what, condition, expected)
- Arrange-Act-Assert pattern
- Test edge cases and error paths
- Keep tests simple and focused
- Avoid testing implementation details
- Use test.each for similar test cases

**Common Patterns:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { calculateDiscount, UserService } from './utils';

// Basic unit test structure
describe('calculateDiscount', () => {
  it('should return 10% off for regular customers', () => {
    // Arrange
    const price = 100;
    const customerType = 'regular';

    // Act
    const result = calculateDiscount(price, customerType);

    // Assert
    expect(result).toBe(90);
  });

  it('should return 20% off for premium customers', () => {
    expect(calculateDiscount(100, 'premium')).toBe(80);
  });

  it('should return original price for invalid customer type', () => {
    expect(calculateDiscount(100, 'invalid')).toBe(100);
  });

  it('should handle zero price', () => {
    expect(calculateDiscount(0, 'regular')).toBe(0);
  });

  it('should handle negative prices', () => {
    expect(() => calculateDiscount(-100, 'regular')).toThrow();
  });
});

// Test parameterization with test.each
describe('price calculations', () => {
  it.each([
    [100, 'regular', 90],
    [100, 'premium', 80],
    [50, 'regular', 45],
    [50, 'premium', 40],
  ])('calculateDiscount(%i, %s) should return %i', (price, type, expected) => {
    expect(calculateDiscount(price, type)).toBe(expected);
  });
});

// Testing classes
describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  afterEach(() => {
    userService.cleanup();
  });

  it('should create a new user', async () => {
    const user = await userService.create({
      name: 'John Doe',
      email: 'john@example.com',
    });

    expect(user).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com',
    });
    expect(user.id).toBeDefined();
  });

  it('should throw error for duplicate email', async () => {
    await userService.create({
      name: 'John',
      email: 'john@example.com',
    });

    await expect(
      userService.create({
        name: 'Jane',
        email: 'john@example.com',
      })
    ).rejects.toThrow('Email already exists');
  });
});
```

**Gotchas:**
- Don't test third-party libraries (trust they work)
- Avoid testing private methods directly (test through public API)
- Don't over-assert (one logical concept per test)
- Be careful with Date.now() and Math.random() (mock them)
- Test files run in isolation (no shared state)


### 2. Mocking and stubbing

Replace dependencies with test doubles to isolate the code under test and control test conditions.

**Best Practices:**
- Mock external dependencies (APIs, databases, file system)
- Stub functions to return predictable values
- Use spies to verify function calls
- Mock at module boundaries
- Reset mocks between tests
- Mock time-based functions (setTimeout, Date)
- Use fake implementations for complex mocks
- Verify mock calls with toHaveBeenCalledWith

**Common Patterns:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRepository } from './user-repository';
import { EmailService } from './email-service';
import { UserService } from './user-service';

// Mock entire module
vi.mock('./email-service');

describe('UserService with mocks', () => {
  let userService: UserService;
  let mockUserRepo: any;
  let mockEmailService: any;

  beforeEach(() => {
    // Create mock objects
    mockUserRepo = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    mockEmailService = {
      send: vi.fn(),
    };

    userService = new UserService(mockUserRepo, mockEmailService);
  });

  it('should send welcome email when user is created', async () => {
    const newUser = { name: 'John', email: 'john@example.com' };
    mockUserRepo.save.mockResolvedValue({ id: '123', ...newUser });

    await userService.createUser(newUser);

    expect(mockEmailService.send).toHaveBeenCalledWith({
      to: 'john@example.com',
      subject: 'Welcome!',
      body: expect.stringContaining('John'),
    });
  });

  it('should handle repository errors', async () => {
    mockUserRepo.save.mockRejectedValue(new Error('Database error'));

    await expect(
      userService.createUser({ name: 'John', email: 'john@example.com' })
    ).rejects.toThrow('Database error');

    // Verify email was not sent
    expect(mockEmailService.send).not.toHaveBeenCalled();
  });
});

// Spy on existing functions
describe('Math operations', () => {
  it('should use Math.random correctly', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const result = generateRandomId();

    expect(randomSpy).toHaveBeenCalled();
    expect(result).toBe('some-predictable-id');

    randomSpy.mockRestore();
  });
});

// Mock timers
describe('delayed operations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute callback after delay', () => {
    const callback = vi.fn();
    scheduleTask(callback, 1000);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledOnce();
  });
});

// Partial mocks
describe('UserService with partial mock', () => {
  it('should use real implementation for some methods', async () => {
    const mockRepo = {
      findById: vi.fn().mockResolvedValue({ id: '123', name: 'John' }),
      save: vi.fn(), // Real implementation
    };

    const service = new UserService(mockRepo);
    const user = await service.getUser('123');

    expect(user.name).toBe('John');
  });
});

// Mock modules with auto-mock
vi.mock('./api-client', () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  })),
}));
```

**Gotchas:**
- Mocks persist between tests (use beforeEach to reset)
- Over-mocking leads to brittle tests (mock only external deps)
- Mock implementations can drift from real code
- TypeScript types don't catch mock errors (use type assertions)
- Module-level mocks are hoisted (run before imports)


### 3. Test coverage analysis

Measure how much of your code is tested to identify gaps and ensure critical paths are covered.

**Best Practices:**
- Aim for 80%+ coverage on critical code
- Don't chase 100% coverage blindly
- Focus on branch coverage, not just line coverage
- Exclude test files and generated code
- Use coverage reports in CI
- Set minimum thresholds
- Review uncovered lines regularly
- Prioritize testing complex logic

**Common Patterns:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
      ],
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
    },
  },
});

// package.json scripts
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch"
  }
}
```

**Analyzing Coverage Reports:**
```typescript
// Example: Identifying untested code
describe('PaymentProcessor', () => {
  it('should process successful payment', async () => {
    // This covers the happy path
    const result = await processor.process({ amount: 100 });
    expect(result.status).toBe('success');
  });

  // Coverage report shows error handling isn't tested
  it('should handle payment declined', async () => {
    const result = await processor.process({ amount: -1 });
    expect(result.status).toBe('declined');
  });

  it('should handle network errors', async () => {
    // Mock network failure
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Network error'));
    const result = await processor.process({ amount: 100 });
    expect(result.status).toBe('error');
  });
});
```

**Coverage in CI:**
```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: pnpm install
      - run: pnpm test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Check coverage thresholds
        run: |
          if [ $(jq '.total.lines.pct' coverage/coverage-summary.json) -lt 80 ]; then
            echo "Coverage below 80%"
            exit 1
          fi
```

**Gotchas:**
- 100% coverage doesn't mean bug-free code
- Coverage tools may miss edge cases
- Generated code inflates coverage numbers
- Integration tests don't count toward unit test coverage
- Coverage thresholds can block legitimate PRs


### 4. TDD patterns

Write tests first, then implement code to make them pass. This drives better design and ensures testability.

**Best Practices:**
- Red-Green-Refactor cycle
- Write the simplest test first
- Write only enough code to pass the test
- Refactor after tests pass
- Test one behavior at a time
- Use test names to document requirements
- Start with edge cases, then happy path
- Keep test-code cycle tight (minutes, not hours)

**Common Patterns:**
```typescript
import { describe, it, expect } from 'vitest';
import { FizzBuzz } from './fizzbuzz';

// TDD Example: FizzBuzz
describe('FizzBuzz - TDD approach', () => {
  // Step 1: RED - Write failing test
  it('should return "1" for 1', () => {
    const fizzBuzz = new FizzBuzz();
    expect(fizzBuzz.convert(1)).toBe('1');
  });

  // Step 2: GREEN - Implement minimal code to pass
  // class FizzBuzz {
  //   convert(n: number): string {
  //     return '1';
  //   }
  // }

  // Step 3: Add next test
  it('should return "2" for 2', () => {
    const fizzBuzz = new FizzBuzz();
    expect(fizzBuzz.convert(2)).toBe('2');
  });

  // GREEN: Update implementation
  // convert(n: number): string {
  //   return n.toString();
  // }

  // Step 4: Add special case
  it('should return "Fizz" for 3', () => {
    const fizzBuzz = new FizzBuzz();
    expect(fizzBuzz.convert(3)).toBe('Fizz');
  });

  // GREEN: Handle divisible by 3
  // convert(n: number): string {
  //   if (n % 3 === 0) return 'Fizz';
  //   return n.toString();
  // }

  it('should return "Buzz" for 5', () => {
    const fizzBuzz = new FizzBuzz();
    expect(fizzBuzz.convert(5)).toBe('Buzz');
  });

  it('should return "FizzBuzz" for 15', () => {
    const fizzBuzz = new FizzBuzz();
    expect(fizzBuzz.convert(15)).toBe('FizzBuzz');
  });

  // REFACTOR: Clean up implementation
  // convert(n: number): string {
  //   if (n % 15 === 0) return 'FizzBuzz';
  //   if (n % 3 === 0) return 'Fizz';
  //   if (n % 5 === 0) return 'Buzz';
  //   return n.toString();
  // }
});

// Real-world TDD example
describe('ShoppingCart - TDD', () => {
  it('should start with zero items', () => {
    const cart = new ShoppingCart();
    expect(cart.itemCount).toBe(0);
  });

  it('should add item to cart', () => {
    const cart = new ShoppingCart();
    cart.addItem({ id: '1', name: 'Book', price: 10 });
    expect(cart.itemCount).toBe(1);
  });

  it('should calculate total price', () => {
    const cart = new ShoppingCart();
    cart.addItem({ id: '1', name: 'Book', price: 10 });
    cart.addItem({ id: '2', name: 'Pen', price: 5 });
    expect(cart.total).toBe(15);
  });

  it('should remove item from cart', () => {
    const cart = new ShoppingCart();
    cart.addItem({ id: '1', name: 'Book', price: 10 });
    cart.removeItem('1');
    expect(cart.itemCount).toBe(0);
    expect(cart.total).toBe(0);
  });

  it('should apply discount code', () => {
    const cart = new ShoppingCart();
    cart.addItem({ id: '1', name: 'Book', price: 100 });
    cart.applyDiscount('SAVE10');
    expect(cart.total).toBe(90);
  });

  it('should throw error for invalid discount', () => {
    const cart = new ShoppingCart();
    expect(() => cart.applyDiscount('INVALID')).toThrow();
  });
});
```

**Gotchas:**
- Don't write too many tests before implementing
- Don't skip refactoring step
- Don't test implementation details (test behavior)
- TDD doesn't replace integration tests
- Can be slower initially (faster long-term)


### 5. Testing React components

Test React components in isolation using React Testing Library, focusing on user behavior over implementation.

**Best Practices:**
- Test user interactions, not implementation
- Use accessible queries (getByRole, getByLabelText)
- Test the rendered output, not internal state
- Avoid testing library internals
- Use userEvent for interactions
- Mock API calls and context
- Test error states and loading states
- Keep tests maintainable (avoid brittle selectors)

**Common Patterns:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should call onSubmit with email and password', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should show validation errors', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('should disable button while submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});

// Testing async data loading
describe('UserProfile', () => {
  it('should show loading state', () => {
    render(<UserProfile userId="123" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display user data', async () => {
    // Mock API
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ name: 'John Doe', email: 'john@example.com' }),
    });

    render(<UserProfile userId="123" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('should show error message on failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

    render(<UserProfile userId="123" />);

    await waitFor(() => {
      expect(screen.getByText(/error loading user/i)).toBeInTheDocument();
    });
  });
});

// Testing with Context
describe('ThemeToggle', () => {
  it('should toggle theme', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const toggle = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggle).toHaveAttribute('aria-label', 'Switch to dark mode');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-label', 'Switch to light mode');
  });
});

// Snapshot testing
describe('Button component', () => {
  it('should match snapshot', () => {
    const { container } = render(<Button variant="primary">Click me</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

**Gotchas:**
- Don't test implementation details (useState, useEffect)
- Don't query by class names or test IDs (use accessible queries)
- Don't forget to cleanup (React Testing Library does this automatically)
- Avoid testing third-party library components
- Remember: waitFor for async updates


## 💡 Real-World Examples

### Example 1: API Service with Error Handling
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserApiService } from './user-api-service';

describe('UserApiService', () => {
  let apiService: UserApiService;
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    apiService = new UserApiService('https://api.example.com');
  });

  it('should fetch users successfully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: '1', name: 'John' }],
    });

    const users = await apiService.getUsers();

    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('John');
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users');
  });

  it('should retry on network failure', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: '1', name: 'John' }],
      });

    const users = await apiService.getUsers();

    expect(users).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(apiService.getUsers()).rejects.toThrow('Network error');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
```

### Example 2: Complex Form Validation
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegistrationForm } from './RegistrationForm';

describe('RegistrationForm', () => {
  it('should validate password strength', async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(passwordInput, '123');
    expect(screen.getByText(/weak password/i)).toBeInTheDocument();

    await user.clear(passwordInput);
    await user.type(passwordInput, 'Str0ng!Pass');
    expect(screen.getByText(/strong password/i)).toBeInTheDocument();
  });

  it('should validate matching passwords', async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    await user.type(screen.getByLabelText(/^password/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different');

    expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();
  });
});
```

## 🔗 Related Skills

- **testing-playwright** - E2E tests complement unit tests
- **typescript-advanced-types** - Type-safe test utilities
- **docker-containers** - Run tests in consistent environments
- **devops-engineer** - Integrate tests into CI/CD

## 📖 Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Coverage Analysis](https://istanbul.js.org/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Generated by skill-generator.ts - Content to be filled by specialized agents*
