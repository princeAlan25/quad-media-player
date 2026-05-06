# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please **do not** create a public GitHub issue. Instead, please report it responsibly by emailing us at **[your-security-email@example.com]** with the following information:

- Description of the vulnerability
- Affected component(s)
- Steps to reproduce (if applicable)
- Potential impact
- Suggested fix (if you have one)

We will investigate the issue and provide a fix as soon as possible. Please allow us 48-72 hours to respond before disclosing the vulnerability publicly.

## Security Best Practices

This project follows security best practices including:

### 1. **Environment Variables**
- Never commit `.env` files to version control
- Use `.env.example` to document required variables
- Keep sensitive data like API keys out of the codebase

### 2. **CORS Configuration**
- CORS is restricted to allowed origins specified in `ALLOWED_ORIGINS`
- Development mode allows localhost origins
- Production requires explicit origin configuration

### 3. **Authentication**
- API endpoints use API key authentication via `X-API-Key` header
- API keys should be rotated regularly
- Never expose API keys in client-side code

### 4. **Rate Limiting**
- All API endpoints are rate-limited to prevent abuse
- Limits are configurable via `RATE_LIMIT_MAX_REQUESTS`
- For production, consider using Redis-based rate limiting

### 5. **Docker Security**
- Containers run as non-root users
- Specific node version used (node:20.10-alpine)
- Production dependencies only in final image
- Health checks configured for all services

### 6. **Error Handling**
- Error details are hidden in production mode
- Generic error messages are returned to clients
- Detailed errors are only shown in development

### 7. **Input Validation**
- Request body size is limited to 20MB
- All user inputs should be validated before processing
- Use TypeScript for type safety

## Dependency Security

### Regular Audits
Run `npm audit` regularly to check for known vulnerabilities:

```bash
npm audit
npm audit fix
```

### Keeping Dependencies Updated

```bash
npm update
npm outdated  # Check for packages with newer versions
```

## API Security Headers

The following headers are recommended for production:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

Consider using helmet.js middleware to set these automatically:

```bash
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

## Production Deployment Checklist

- [ ] Enable HTTPS/TLS
- [ ] Set up proper firewall rules
- [ ] Configure rate limiting (preferably with Redis)
- [ ] Enable API authentication
- [ ] Set up security headers (using helmet.js)
- [ ] Configure proper CORS origins
- [ ] Enable request logging and monitoring
- [ ] Set up alerting for suspicious activity
- [ ] Regular backups of data
- [ ] Security updates applied promptly
- [ ] Conduct security testing/penetration testing
- [ ] Review and rotate API keys regularly

## GitHub Secret Scanning

This repository has GitHub Secret Scanning enabled. GitHub will automatically scan for common secret patterns. If a secret is accidentally committed:

1. Rotate the secret immediately
2. Remove it from git history: `git filter-branch --tree-filter 'rm -f .env' -- --all`
3. Force push the cleaned history: `git push origin main --force-with-lease`

## Version Information

- **Node.js**: 20.10 LTS or later
- **npm**: 10.x or later
- **TypeScript**: 5.9.x

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)

## License

This project is licensed under the MIT License - see LICENSE file for details.
