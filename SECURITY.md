# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in Language.fi, please report it responsibly.

### How to Report

Send an email to: security@language.fi

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if known)

### What to Expect

- Acknowledgment within 48 hours
- Estimated timeline for fix
- Coordination on disclosure timing
- Credit in security advisories (if desired)

### Disclosure Policy

We follow responsible disclosure:
- Fix vulnerabilities before public disclosure
- Coordinate with reporters on timing
- Public disclosure after fix is deployed
- 90-day maximum disclosure window

## Secret Management

### Environment Variables

All secrets must be stored as environment variables, never in code:

```bash
# Required
DATABASE_URL=postgresql://...
COINGECKO_API_KEY=...

# Optional
COINMARKETCAP_API_KEY=...
GATE_API_KEY=...
ORACLE_PRIVATE_KEY=...
```

### Secret Rotation

Rotate secrets regularly:
- **API Keys**: Every 90 days
- **Database Credentials**: Every 180 days
- **Private Keys**: Every 365 days or if compromised
- **GitHub PATs**: Every 90 days or if compromised

### Secret Storage

- **Development**: Use `.env.local` (never committed)
- **Production**: Use platform secret management (Vercel, Railway, GitHub Actions)
- **Never**: Commit secrets to git, hardcode in code, or include in docs

## API Key Management

### CoinGecko API Key

- Required for production use
- Free tier available with rate limits
- Pro tier recommended for high-volume usage
- Store as `COINGECKO_API_KEY` environment variable

### Gate.io API Key

- Optional, for additional data sources
- Store as `GATE_API_KEY` environment variable
- Not required for basic functionality

### Oracle Private Key

- Required for oracle attestations (future)
- Store as `ORACLE_PRIVATE_KEY` environment variable
- Never commit to git
- Use hardware wallet for production (recommended)

## Database Security

### PostgreSQL

- Use strong passwords (minimum 32 characters)
- Enable SSL connections in production
- Restrict access by IP
- Regular backups
- Encrypt at rest (if supported by provider)

### Connection Strings

- Never commit connection strings
- Use environment variables
- Rotate credentials regularly
- Use connection pooling

## Git Security

### Remote URLs

Never include authentication in git remote URLs:
```bash
# ❌ BAD - includes token
git remote add origin https://ghp_TOKEN@github.com/user/repo.git

# ✅ GOOD - no authentication
git remote add origin https://github.com/user/repo.git
```

### Commit History

- Never commit secrets
- Use `git filter-repo` to remove committed secrets
- Force push after secret removal (with caution)
- Rotate exposed secrets immediately

### Branch Protection

- Enable branch protection on main
- Require PR reviews
- Require status checks
- Block force pushes

## CI/CD Security

### GitHub Actions

- Use GitHub Secrets for sensitive data
- Never log secrets in workflows
- Use `::add-mask::` for sensitive outputs
- Limit token permissions

### Vercel

- Use Vercel environment variables
- Enable Vercel protection rules
- Restrict deployment access
- Monitor deployment logs

### Railway

- Use Railway environment variables
- Enable Railway protection
- Restrict access to projects
- Monitor deployment logs

## Pre-commit Hooks

### Secret Scanning

Install pre-commit hooks for secret scanning:

```bash
# Install pre-commit
pip install pre-commit

# Add pre-commit configuration
cat > .pre-commit-config.yaml << EOF
repos:
  - repo: https://github.com/TruffleSecurity/trufflehog3
    hooks:
      - id: trufflehog3
        args: [--regex --entropy=False]
EOF

# Install hooks
pre-commit install
```

### Linting

```bash
# Install eslint
npm install -D eslint

# Run pre-commit
pre-commit run --all-files
```

## GitHub Actions Secret Scanning

### Gitleaks

Add `.github/workflows/secret-scan.yml`:

```yaml
name: Secret Scanning
on: [push, pull_request]
jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Dependabot

Enable Dependabot for dependency security:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
```

## Dependency Security

### npm

```bash
npm audit
npm audit fix
```

### Python

```bash
pip install safety
safety check
```

### Regular Updates

- Update dependencies weekly
- Review security advisories
- Apply security patches promptly
- Test updates in staging first

## Deployment Security

### Environment Separation

- **Development**: Local development only
- **Staging**: Pre-production testing
- **Production**: Live deployment

### Access Control

- Limit deployment access to authorized team members
- Use MFA for all accounts
- Regular access reviews
- Revoke access immediately on team departure

### Monitoring

- Monitor deployment logs for anomalies
- Set up alerts for suspicious activity
- Regular security audits
- Incident response plan

## Incident Response

### Security Incident

If a security incident occurs:

1. **Contain**: Isolate affected systems
2. **Assess**: Determine impact and scope
3. **Communicate**: Notify stakeholders
4. **Remediate**: Apply fixes
5. **Review**: Post-incident analysis
6. **Document**: Update security policies

### Incident Timeline

- **0-1 hour**: Initial containment
- **1-4 hours**: Assessment and communication
- **4-24 hours**: Remediation
- **24-48 hours**: Review and documentation

## Compliance

### Data Protection

- GDPR compliance for EU users
- CCPA compliance for California residents
- Regular compliance audits
- Data retention policies

### Financial Regulations

- Not a financial product
- No investment advice
- Clear disclaimers
- Legal review of terms

## Security Best Practices

### Code Review

- All code must be reviewed
- Security-focused review for sensitive changes
- At least one approval required
- Automated security scanning

### Authentication

- Use strong passwords (minimum 16 characters)
- Enable 2FA where available
- Regular password rotation
- Never share credentials

### Network Security

- Use HTTPS everywhere
- Enable HSTS headers
- Implement rate limiting
- Use WAF if applicable

## Contact

### Security Team

Email: security@language.fi

### Emergency

For critical security issues, contact:
- Email: security@language.fi (mark as URGENT)
- GitHub Security Advisory: https://github.com/overandor/language-fi/security/advisories

## Acknowledgments

We use and recommend:
- [TruffleHog](https://trufflesecurity.com/) for secret scanning
- [Gitleaks](https://github.com/gitleaks/gitleaks) for git secret scanning
- [Dependabot](https://dependabot.com/) for dependency security
- [Pre-commit](https://pre-commit.com/) for pre-commit hooks

## Version

Security Policy v1.0
Last Updated: May 1, 2026
