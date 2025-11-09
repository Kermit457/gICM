# E2B MCP (Code Execution Environment)

## Overview
E2B (Execute to Build) MCP provides secure, sandboxed code execution environments for Claude. It enables running code in isolated containers, testing applications, executing scripts, and building software in a controlled environment with full filesystem access and networking capabilities.

## What It Does
- **Code Execution**: Run Python, JavaScript, TypeScript, Rust, and more in isolated environments
- **Sandbox Safety**: Execute untrusted code safely in containerized environments
- **Filesystem Access**: Full read/write access to sandbox filesystem
- **Package Installation**: Install npm, pip, cargo packages dynamically
- **Web Server Testing**: Run and test web servers in sandbox
- **Multi-Language**: Support for 10+ programming languages
- **Persistent Sessions**: Maintain state across multiple commands
- **Network Access**: Make HTTP requests and test APIs

## Installation

### Global Installation
```bash
npm install -g @e2b/mcp-server
```

### Local/Project Installation
```bash
npm install @e2b/mcp-server
```

## Configuration

### Claude Desktop Configuration
Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "e2b": {
      "command": "npx",
      "args": ["-y", "@e2b/mcp-server"],
      "env": {
        "E2B_API_KEY": "your-e2b-api-key-here"
      }
    }
  }
}
```

### Project-Specific Configuration
Add to `.claude/mcp/e2b.json`:

```json
{
  "mcpServers": {
    "e2b": {
      "command": "npx",
      "args": ["-y", "@e2b/mcp-server"],
      "env": {
        "E2B_API_KEY": "your-e2b-api-key-here"
      }
    }
  }
}
```

## Required Environment Variables

### E2B_API_KEY
- **Description**: API key for E2B service
- **How to Get**:
  1. Visit [e2b.dev](https://e2b.dev)
  2. Sign up for an account
  3. Navigate to API Keys in dashboard
  4. Generate a new API key
- **Security**: Keep this secret! Add to `.env` file, never commit
- **Free Tier**: 100 hours of execution time per month

### Optional Environment Variables

#### E2B_TIMEOUT
- **Description**: Maximum execution time in seconds
- **Default**: `300` (5 minutes)
- **Range**: `1-3600`
- **Example**: `"E2B_TIMEOUT": "600"`

#### E2B_TEMPLATE
- **Description**: Default template/environment to use
- **Options**: `node`, `python`, `rust`, `go`, `custom`
- **Default**: `node`
- **Example**: `"E2B_TEMPLATE": "python"`

#### E2B_MEMORY_LIMIT
- **Description**: Memory limit in MB
- **Default**: `512`
- **Range**: `128-4096`
- **Example**: `"E2B_MEMORY_LIMIT": "1024"`

## Usage Examples

### Execute Python Code
```python
# Run Python code in sandbox
result = await e2b.execute({
  language: "python",
  code: `
    import requests

    response = requests.get('https://api.github.com')
    print(f"Status: {response.status_code}")
    print(response.json()['current_user_url'])
  `
});

# Data analysis with pandas
result = await e2b.execute({
  language: "python",
  code: `
    import pandas as pd

    data = {'name': ['Alice', 'Bob'], 'age': [25, 30]}
    df = pd.DataFrame(data)
    print(df.describe())
  `,
  packages: ["pandas"]
});
```

### Execute JavaScript/TypeScript
```typescript
// Run Node.js code
result = await e2b.execute({
  language: "javascript",
  code: `
    const axios = require('axios');

    async function fetchData() {
      const res = await axios.get('https://jsonplaceholder.typicode.com/todos/1');
      console.log(res.data);
    }

    fetchData();
  `,
  packages: ["axios"]
});

// TypeScript execution
result = await e2b.execute({
  language: "typescript",
  code: `
    interface User {
      name: string;
      age: number;
    }

    const user: User = { name: "Alice", age: 25 };
    console.log(user);
  `
});
```

### Execute Rust Code
```rust
// Compile and run Rust
result = await e2b.execute({
  language: "rust",
  code: `
    fn main() {
      let numbers = vec![1, 2, 3, 4, 5];
      let sum: i32 = numbers.iter().sum();
      println!("Sum: {}", sum);
    }
  `
});

// Async Rust with Tokio
result = await e2b.execute({
  language: "rust",
  code: `
    use tokio;

    #[tokio::main]
    async fn main() {
      println!("Async Rust execution");
    }
  `,
  dependencies: ["tokio = { version = '1', features = ['full'] }"]
});
```

### Test Solana Programs
```rust
// Test Anchor programs
result = await e2b.execute({
  language: "rust",
  code: `
    use anchor_lang::prelude::*;

    // Program test code here
    #[test]
    fn test_initialize() {
      // Test implementation
    }
  `,
  template: "solana-anchor",
  timeout: 600
});
```

### Run Web Servers
```javascript
// Start Express server
const server = await e2b.server({
  language: "javascript",
  code: `
    const express = require('express');
    const app = express();

    app.get('/', (req, res) => {
      res.json({ message: 'Hello World' });
    });

    app.listen(3000, () => {
      console.log('Server running on port 3000');
    });
  `,
  packages: ["express"],
  port: 3000
});

// Test the server
const response = await fetch(server.url);
console.log(await response.json());
```

### Filesystem Operations
```typescript
// Create and manipulate files
result = await e2b.execute({
  language: "python",
  code: `
    # Write to file
    with open('data.txt', 'w') as f:
      f.write('Hello, E2B!')

    # Read file
    with open('data.txt', 'r') as f:
      content = f.read()
      print(content)

    # List files
    import os
    print(os.listdir('.'))
  `
});

// Process uploaded files
result = await e2b.execute({
  language: "python",
  code: `
    import json

    with open('config.json', 'r') as f:
      config = json.load(f)
      print(config)
  `,
  files: {
    'config.json': JSON.stringify({ key: 'value' })
  }
});
```

### Install and Use Packages
```typescript
// Install multiple packages
result = await e2b.execute({
  language: "python",
  code: `
    import numpy as np
    import matplotlib.pyplot as plt

    x = np.linspace(0, 10, 100)
    y = np.sin(x)

    plt.plot(x, y)
    plt.savefig('plot.png')
    print('Plot saved!')
  `,
  packages: ["numpy", "matplotlib"]
});

// Download generated files
const plotImage = await e2b.download('plot.png');
```

## Supported Languages

### Fully Supported
- **Python**: 3.8, 3.9, 3.10, 3.11
- **JavaScript**: Node.js 16, 18, 20
- **TypeScript**: Latest version
- **Rust**: Latest stable
- **Go**: 1.19, 1.20, 1.21
- **Java**: 11, 17, 21
- **C/C++**: GCC 11+
- **Ruby**: 3.0, 3.1, 3.2

### Experimental Support
- **PHP**: 8.1, 8.2
- **Swift**: 5.7+
- **Kotlin**: Latest
- **Scala**: 3.x

## Configuration Options

### Session Persistence
```json
{
  "env": {
    "E2B_API_KEY": "your-key",
    "E2B_PERSISTENT_SESSION": "true",
    "E2B_SESSION_TIMEOUT": "3600"
  }
}
```

### Resource Limits
```json
{
  "env": {
    "E2B_API_KEY": "your-key",
    "E2B_CPU_LIMIT": "2",
    "E2B_MEMORY_LIMIT": "2048",
    "E2B_DISK_LIMIT": "5120"
  }
}
```

### Network Configuration
```json
{
  "env": {
    "E2B_API_KEY": "your-key",
    "E2B_NETWORK_ENABLED": "true",
    "E2B_ALLOW_OUTBOUND": "true",
    "E2B_PROXY_URL": "http://proxy.example.com:8080"
  }
}
```

### Custom Templates
```json
{
  "env": {
    "E2B_API_KEY": "your-key",
    "E2B_TEMPLATE": "solana-anchor",
    "E2B_TEMPLATE_VERSION": "0.29.0"
  }
}
```

## Best Practices

### Security
1. **API Key Safety**: Never hardcode API keys in code
2. **Input Validation**: Validate user input before execution
3. **Timeout Limits**: Set reasonable execution timeouts
4. **Resource Monitoring**: Monitor CPU/memory usage
5. **Audit Logs**: Review execution logs regularly

### Performance
1. **Session Reuse**: Reuse sessions for related commands
2. **Package Caching**: Install packages once per session
3. **Parallel Execution**: Run independent tasks in parallel
4. **Optimize Timeouts**: Set appropriate timeout values
5. **Clean Up**: Close sessions when done

### Development Workflow
1. **Local Testing**: Test code locally before E2B execution
2. **Error Handling**: Implement robust error handling
3. **Logging**: Log execution results for debugging
4. **Version Pinning**: Pin package versions for reproducibility
5. **Templates**: Use custom templates for repeated setups

## Common Use Cases

### Testing Blockchain Code
```rust
// Test Solana program logic
const testResult = await e2b.execute({
  language: "rust",
  template: "solana-anchor",
  code: `
    #[cfg(test)]
    mod tests {
      use super::*;

      #[test]
      fn test_bonding_curve() {
        let price = calculate_price(1000, 100);
        assert!(price > 0);
      }
    }
  `
});
```

### Data Analysis & Visualization
```python
# Analyze token price data
const analysis = await e2b.execute({
  language: "python",
  packages: ["pandas", "matplotlib", "numpy"],
  code: `
    import pandas as pd
    import matplotlib.pyplot as plt

    # Load price data
    df = pd.read_csv('prices.csv')

    # Calculate metrics
    df['returns'] = df['price'].pct_change()
    print(f"Volatility: {df['returns'].std()}")

    # Create chart
    plt.plot(df['timestamp'], df['price'])
    plt.savefig('chart.png')
  `,
  files: {
    'prices.csv': priceData
  }
});
```

### API Testing
```javascript
// Test API endpoints
const apiTest = await e2b.execute({
  language: "javascript",
  packages: ["axios", "jest"],
  code: `
    const axios = require('axios');

    async function testAPI() {
      const response = await axios.post('https://api.example.com/launch', {
        tokenName: 'TestToken',
        symbol: 'TEST'
      });

      console.log('Status:', response.status);
      console.log('Data:', response.data);
    }

    testAPI();
  `
});
```

### Code Generation & Validation
```typescript
// Generate and validate Rust code
const validation = await e2b.execute({
  language: "rust",
  code: generatedRustCode,
  validate: true
});

if (validation.compiled) {
  console.log('Code is valid!');
} else {
  console.error('Compilation errors:', validation.errors);
}
```

## Troubleshooting

### Common Issues

**Issue**: Execution timeout
- **Solution**: Increase timeout value in configuration
- **Solution**: Optimize code for better performance
- **Solution**: Break into smaller execution chunks

**Issue**: Package installation failed
- **Solution**: Verify package name and version
- **Solution**: Check internet connectivity in sandbox
- **Solution**: Use alternative package source/mirror

**Issue**: Out of memory error
- **Solution**: Increase memory limit in configuration
- **Solution**: Optimize memory usage in code
- **Solution**: Process data in smaller chunks

**Issue**: API rate limit exceeded
- **Solution**: Implement exponential backoff
- **Solution**: Upgrade to higher tier plan
- **Solution**: Cache results to reduce API calls

**Issue**: Permission denied
- **Solution**: Check filesystem permissions
- **Solution**: Verify API key has required permissions
- **Solution**: Use correct execution template

### Debug Mode
Enable detailed logging:

```json
{
  "env": {
    "E2B_API_KEY": "your-key",
    "E2B_DEBUG": "true",
    "E2B_LOG_LEVEL": "verbose",
    "E2B_TRACE": "true"
  }
}
```

## Advanced Features

### Custom Docker Images
```json
{
  "env": {
    "E2B_API_KEY": "your-key",
    "E2B_DOCKER_IMAGE": "your-registry/custom-image:latest"
  }
}
```

### GPU Acceleration
```json
{
  "env": {
    "E2B_API_KEY": "your-key",
    "E2B_GPU_ENABLED": "true",
    "E2B_GPU_TYPE": "nvidia-t4"
  }
}
```

### Distributed Execution
```typescript
// Run code across multiple sandboxes
const results = await Promise.all([
  e2b.execute({ code: task1, language: "python" }),
  e2b.execute({ code: task2, language: "python" }),
  e2b.execute({ code: task3, language: "python" })
]);
```

## Pricing & Limits

### Free Tier
- **Execution Time**: 100 hours/month
- **Sessions**: Unlimited
- **Memory**: Up to 512MB
- **CPU**: Shared cores
- **Storage**: 5GB
- **Network**: Limited bandwidth

### Pro Tier ($29/month)
- **Execution Time**: 500 hours/month
- **Memory**: Up to 4GB
- **CPU**: 2 dedicated cores
- **Storage**: 50GB
- **Network**: Unlimited bandwidth
- **Priority**: Faster startup times

### Enterprise Tier
- **Execution Time**: Unlimited
- **Custom Resources**: Configurable limits
- **SLA**: 99.9% uptime
- **Support**: 24/7 support
- **Dedicated**: Isolated infrastructure

## Integration Examples

### With Test Automation
```typescript
// Automated testing in E2B
import { e2b } from '@e2b/sdk';

test('solana program test', async () => {
  const result = await e2b.execute({
    template: 'solana-anchor',
    code: anchorTestCode
  });

  expect(result.exitCode).toBe(0);
});
```

### With CI/CD Pipeline
```yaml
# GitHub Actions example
- name: Test in E2B
  run: |
    npx @e2b/cli execute --template rust --file program.rs
  env:
    E2B_API_KEY: ${{ secrets.E2B_API_KEY }}
```

### With Development Agents
```typescript
// ICM Anchor Architect uses E2B for testing
const architect = new ICMAnchorArchitect({
  e2b: {
    enabled: true,
    template: 'solana-anchor'
  }
});
```

## Security Considerations

### Sandbox Isolation
- Each execution runs in isolated container
- No access to host system
- Network isolation options available
- Resource limits enforced

### Data Privacy
- Code execution is ephemeral
- Files deleted after session ends
- Logs retained for 30 days (configurable)
- GDPR compliant

## Additional Resources

- [E2B Website](https://e2b.dev)
- [E2B Documentation](https://docs.e2b.dev)
- [API Reference](https://docs.e2b.dev/api)
- [GitHub Repository](https://github.com/e2b-dev)
- [Discord Community](https://discord.gg/e2b)
- [Template Gallery](https://e2b.dev/templates)

## Version Information
- **Package**: `@e2b/mcp-server`
- **Compatibility**: Claude Desktop 0.5.0+
- **Node.js**: v16.0.0 or higher
- **Current Version**: 2.1.0
