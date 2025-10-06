# Contributing to Zoho Desk MCP Server

Thank you for your interest in contributing to the Zoho Desk MCP Server! This document provides guidelines and instructions for contributing.

## 🎯 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- TypeScript 5.3+
- Git
- Zoho Desk account with API access (for testing)
- Claude Desktop (optional, for testing)

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/zoho-desk-mcp-server.git
cd zoho-desk-mcp-server

# Install dependencies
npm install

# Create your config file
cp config.example.json config.json
# Add your Zoho Desk credentials

# Build the project
npm run build

# Start development mode (auto-rebuild)
npm run dev
```

## 📝 How to Contribute

### Reporting Bugs

Before creating a bug report, please:
1. Check existing issues to avoid duplicates
2. Collect relevant information (OS, Node version, error messages)
3. Create a minimal reproduction if possible

**Bug Report Template:**
```markdown
**Description:**
Clear description of the bug

**Steps to Reproduce:**
1. Step one
2. Step two
3. ...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- OS:
- Node.js version:
- MCP SDK version:
- Server version:

**Additional Context:**
Logs, screenshots, etc.
```

### Suggesting Features

Feature requests are welcome! Please:
1. Check if the feature already exists or is planned
2. Clearly describe the use case
3. Explain how it benefits users
4. Consider implementation complexity

**Feature Request Template:**
```markdown
**Feature Description:**
Clear description of the feature

**Use Case:**
Who needs this and why?

**Proposed Solution:**
How should it work?

**Alternatives:**
Other approaches considered

**Additional Context:**
Any relevant information
```

### Pull Requests

#### Before Submitting

- [ ] Code follows project style and conventions
- [ ] All tests pass (when available)
- [ ] Build completes without errors: `npm run build`
- [ ] Documentation updated if needed
- [ ] Commit messages are clear and descriptive

#### PR Process

1. **Fork & Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make Changes**
   - Write clean, readable code
   - Add comments for complex logic
   - Follow TypeScript best practices
   - Maintain type safety (strict mode)

3. **Test Your Changes**
   ```bash
   npm run build
   npm start
   ```
   Test with Claude Desktop if applicable

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve issue with tickets"
   ```

5. **Push & Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a PR on GitHub

#### PR Guidelines

- **Title**: Clear, concise description
- **Description**: Explain what and why, not just how
- **Link Issues**: Reference related issues
- **Screenshots**: Include if UI/UX changes
- **Breaking Changes**: Clearly document any

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Testing
How were these changes tested?

## Checklist
- [ ] Code follows project style
- [ ] Build passes
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## 📐 Code Style

### TypeScript Guidelines

- Use TypeScript strict mode
- Define types for all function parameters and returns
- Avoid `any` type when possible
- Use interfaces for object shapes
- Export types that may be reused

**Example:**
```typescript
interface TicketData {
  subject: string;
  description: string;
  priority?: 'Low' | 'Medium' | 'High';
}

async function createTicket(data: TicketData): Promise<ApiResponse> {
  // Implementation
}
```

### Formatting

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Always use
- **Line Length**: Max 100 characters
- **Naming**:
  - camelCase for variables and functions
  - PascalCase for classes and interfaces
  - UPPER_CASE for constants

### File Organization

```typescript
// 1. Imports (external, then internal)
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ZohoAPI } from './zoho-api.js';

// 2. Type definitions
interface Config {
  // ...
}

// 3. Constants
const API_BASE = 'https://desk.zoho.com/api/v1';

// 4. Class/Function implementations
export class ZohoDeskServer {
  // ...
}
```

### Comments

- Use JSDoc for public APIs
- Add inline comments for complex logic
- Keep comments up-to-date with code changes

**Example:**
```typescript
/**
 * Creates a new support ticket in Zoho Desk
 *
 * @param data - Ticket information
 * @returns API response with ticket details
 * @throws Error if API request fails
 */
async function createTicket(data: TicketData): Promise<ApiResponse> {
  // Validate required fields
  if (!data.subject || !data.description) {
    throw new Error('Subject and description are required');
  }

  // Make API request
  return await this.api.post('/tickets', data);
}
```

## 🧪 Testing

Currently, the project doesn't have automated tests. Contributions to add testing are welcome!

**Manual Testing:**
1. Build the project: `npm run build`
2. Start the server: `npm start`
3. Test with Claude Desktop
4. Verify all tools work as expected

**Future: Automated Testing**
We plan to add:
- Unit tests (Jest/Vitest)
- Integration tests
- API mock testing

## 📚 Documentation

### Code Documentation

- Add JSDoc comments to all public functions
- Document complex algorithms
- Update README.md for new features
- Create examples for new functionality

### README Updates

When adding features, update:
- Features list
- Available tools section
- Usage examples
- Configuration if needed

## 🔐 Security

### Reporting Security Issues

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead:
- Email: **varun@wbcomdesigns.com**
- Include detailed description
- Provide steps to reproduce
- Suggest a fix if possible

We'll respond within 48 hours.

### Security Best Practices

- Never commit credentials or tokens
- Use environment variables for secrets
- Validate all user inputs
- Sanitize data before API calls
- Use HTTPS for all external requests
- Keep dependencies updated

## 🎨 Adding New Features

### New Zoho Desk API Endpoint

1. **Add to API Client** (`src/zoho-api.ts`):
   ```typescript
   async getTicketActivities(ticketId: string) {
     return this.get(`/tickets/${ticketId}/activities`);
   }
   ```

2. **Define MCP Tool** (`src/tools.ts`):
   ```typescript
   {
     name: 'zoho_get_ticket_activities',
     description: 'Get activity log for a ticket',
     inputSchema: {
       type: 'object',
       properties: {
         ticket_id: {
           type: 'string',
           description: 'Ticket ID'
         }
       },
       required: ['ticket_id']
     }
   }
   ```

3. **Implement Handler** (`src/server.ts`):
   ```typescript
   case 'zoho_get_ticket_activities':
     return await this.handleGetTicketActivities(toolArgs);
   ```

4. **Update Documentation**:
   - Add to README.md tools list
   - Add usage example
   - Update feature count

## 🌍 Internationalization

Currently English-only. Contributions for i18n are welcome!

## 📦 Release Process

Maintainers will:
1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create GitHub release
4. Tag version
5. Publish to npm (future)

## 💬 Communication

- **GitHub Issues**: Bug reports, feature requests
- **Pull Requests**: Code contributions
- **Email**: Security issues, private matters

## 🙏 Recognition

Contributors will be:
- Listed in CHANGELOG.md
- Mentioned in release notes
- Credited in documentation

## 📄 License

By contributing, you agree that your contributions will be licensed under the GPL-2.0-or-later license.

---

## ✨ Thank You!

Every contribution, no matter how small, is valuable and appreciated!

**Questions?** Feel free to open an issue or contact:
- **Varun Dubey**: varun@wbcomdesigns.com
- **GitHub**: [@vapvarun](https://github.com/vapvarun)

---

**Made with ❤️ by the community and [Wbcom Designs](https://wbcomdesigns.com)**
