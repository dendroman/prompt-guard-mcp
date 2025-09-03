# Contributing to Vibe Guard

Thank you for your interest in contributing to Vibe Guard! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Ollama installed locally
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/vibe-guard.git
   cd vibe-guard
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```

## Development Workflow

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Test your changes:
   ```bash
   npm run build
   npm start  # Test the MCP server
   ```
4. Commit your changes:
   ```bash
   git commit -m "Add: description of your change"
   ```

### Commit Message Guidelines

Use conventional commit format:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic

## Testing

### Running Tests

```bash
npm test
```

### Writing Tests

- Add tests for new features
- Update tests when modifying existing functionality
- Test both success and failure cases
- Mock external dependencies (Ollama)

## Security Considerations

Vibe Guard is a security-focused project. When contributing:

- **Security First**: All changes should maintain or improve security
- **Input Validation**: Validate all user inputs
- **Fail Closed**: When in doubt, block operations rather than allow them
- **No Secrets**: Never commit API keys, passwords, or sensitive data
- **Local Only**: All processing should remain local (no external API calls)

### Security Review Process

All contributions undergo security review:

1. Automated security checks
2. Manual code review for security implications
3. Testing against OWASP LLM01 guidelines
4. Verification of fail-closed behavior

## Pull Request Process

1. Ensure your code builds without errors
2. Add tests for new functionality
3. Update documentation if needed
4. Create a pull request with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots/examples if applicable

### Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tests pass
- [ ] Manual testing completed
- [ ] Security implications considered

## Checklist

- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
```

## Reporting Issues

### Bug Reports

Use the bug report template and include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, Ollama version, OS)
- Error logs/screenshots

### Security Issues

**Do not open public issues for security vulnerabilities.**

Report security issues privately to the maintainers:

- Email: security@vibe-guard.dev (if available)
- Private GitHub issue
- Direct message to maintainers

## Feature Requests

1. Check if the feature already exists or is planned
2. Open a feature request issue with:
   - Clear description of the feature
   - Use case/motivation
   - Proposed implementation (if any)
   - Security considerations

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a professional environment

### Communication

- Use clear, descriptive language
- Provide context for your contributions
- Ask questions if you need clarification
- Share knowledge and help others

## Development Tips

### Local Testing

Test the MCP server locally:

```bash
# Build and start the server
npm run build
node dist/index.js

# In another terminal, test with echo
echo '{"operation": "test operation"}' | node dist/index.js
```

### Debugging

Enable debug mode:

```bash
DEBUG=vibe-guard* npm start
```

### Performance Testing

Monitor performance:

- Startup time should be < 2 seconds
- Risk analysis should complete < 5 seconds
- Memory usage should stay < 100MB base

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release tag
4. Publish to npm
5. Create GitHub release

## Getting Help

- Check existing issues and documentation
- Ask questions in GitHub Discussions
- Join community channels (if available)
- Reach out to maintainers

Thank you for contributing to Vibe Guard! 🛡️
