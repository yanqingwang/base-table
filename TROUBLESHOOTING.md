# Troubleshooting Guide

## Overview

This troubleshooting guide covers common issues and solutions for the OpenCode Knowledge Management Workspace. It provides step-by-step instructions for resolving problems related to setup, configuration, and usage.

## Table of Contents

1. [Setup Issues](#setup-issues)
2. [Python Issues](#python-issues)
3. [Node.js Issues](#nodejs-issues)
4. [OpenCode Issues](#opencode-issues)
5. [DocuSign Issues](#docusign-issues)
6. [Report Generation Issues](#report-generation-issues)
7. [File System Issues](#file-system-issues)
8. [Performance Issues](#performance-issues)
9. [Getting Additional Help](#getting-additional-help)

## Setup Issues

### Issue: Environment not properly set up

**Symptoms**:
- Python commands fail with "Python not found"
- Node.js commands fail with "Node not found"
- Git commands fail with "Git not found"

**Solution**:

```bash
# Install Python (if not installed)
# Ubuntu/Debian:
apt-get update
apt-get install python3 python3-pip

# macOS:
brew install python3

# Windows:
# Download from https://www.python.org/downloads/

# Install Node.js (if not installed)
# Ubuntu/Debian:
apt-get install nodejs npm

# macOS:
brew install node

# Windows:
# Download from https://nodejs.org/

# Install Git (if not installed)
# Ubuntu/Debian:
apt-get install git

# macOS:
brew install git

# Windows:
# Download from https://git-scm.com/download/win
```

**Verification**:
```bash
python --version
node --version
git --version
```

### Issue: Virtual environment not working

**Symptoms**:
- Python packages not found
- Module import errors

**Solution**:

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Ubuntu/Debian/macOS:
source .venv/bin/activate

# Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r Script/requirements.txt
```

### Issue: Environment variables not set

**Symptoms**:
- OpenCode not responding
- DocuSign authentication fails
- Database connection issues

**Solution**:

Create or update the `.env` file:

```bash
cat > .env << EOF
# OpenCode Configuration
OPENCODE_API_KEY=your_api_key_here
OPENCODE_PROVIDER=deepseek

# DocuSign Configuration (if using)
DOCUSIGN_CLIENT_ID=your_client_id
DOCUSIGN_CLIENT_SECRET=your_client_secret
DOCUSIGN_OAUTH_BASE_URL=https://account-d.docusign.com

# Database Configuration
DATABASE_URL=sqlite:///dl_hire.db
EOF
```

## Python Issues

### Issue: Python dependencies not installed

**Symptoms**:
- "ModuleNotFoundError: No module named 'package'"
- Import errors in Python scripts

**Solution**:

```bash
# Install requirements
pip install -r Script/requirements.txt

# Or install specific packages
pip install package_name
```

### Issue: Python script execution fails

**Symptoms**:
- Script exits with error code
- "SyntaxError" or other Python errors

**Solution**:

```bash
# Check Python syntax
python -m py_compile Script/your_script.py

# Run script with debug output
python -u Script/your_script.py

# Check for common issues
python Script/your_script.py --help
```

### Issue: OPC1 tools not working

**Symptoms**:
- "ModuleNotFoundError: No module named 'opc1'"
- Report generation fails

**Solution**:

```bash
# Check if opc1_generate.py exists
ls -la Script/opc1_generate.py

# Try running with absolute path
python /home/wang/wk/Script/opc1_generate.py

# Check for missing dependencies
pip list | grep -i opc1
```

## Node.js Issues

### Issue: Node.js dependencies not installed

**Symptoms**:
- "npm: command not found"
- "Module not found" in Node.js scripts

**Solution**:

```bash
# Install npm dependencies
cd code/docusign-keys/DEV
npm install

# Check if node_modules exists
ls -la node_modules
```

### Issue: Node.js script execution fails

**Symptoms**:
- "SyntaxError" in JavaScript files
- "Module not found" errors

**Solution**:

```bash
# Check Node.js syntax
node -c code/docusign-keys/DEV/your_script.js

# Run script with debug output
node --inspect code/docusign-keys/DEV/your_script.js

# Check package.json scripts
cat code/docusign-keys/DEV/package.json
```

## OpenCode Issues

### Issue: OpenCode not responding

**Symptoms**:
- OpenCode startup fails
- API calls timeout
- Authentication errors

**Solution**:

```bash
# Check OpenCode configuration
# Verify API key in .env file
cat .env | grep OPENCODE_API_KEY

# Try restarting OpenCode
# (Depending on your OpenCode setup)

# Check network connectivity
ping opencode.io
```

### Issue: Provider configuration incorrect

**Symptoms**:
- "Invalid provider" errors
- "API key not valid" messages

**Solution**:

```bash
# Check available providers
# Refer to AGENTS.md for provider list

# Update .env file with correct provider
cat > .env << EOF
OPENCODE_API_KEY=your_api_key_here
OPENCODE_PROVIDER=deepseek  # or siliconflow, opencode-free
EOF
```

## DocuSign Issues

### Issue: DocuSign authentication fails

**Symptoms**:
- "Authentication failed" errors
- "Invalid credentials" messages
- "Account not found" errors

**Solution**:

```bash
# Check DocuSign configuration
# Verify client ID and secret in .env file
cat .env | grep DOCUSIGN

# Test authentication
python code/docusign-keys/DEV/docusign_auth.py

# Check if account has necessary permissions
# Contact DocuSign administrator if needed
```

### Issue: Bulk envelope sending fails

**Symptoms**:
- "Template not found" errors
- "Envelope creation failed"
- "Recipient validation failed"

**Solution**:

```bash
# Check template ID
# Verify template exists in DocuSign

# Check CSV file format
# Ensure it has required columns

# Try with dry-run first
python code/docusign-keys/DEV/docusign_bulk_send.py \
    --template-id <TEMPLATE_GUID> \
    --csv /path/to/employees.csv \
    --role-name "Candidate" \
    --dry-run
```

## Report Generation Issues

### Issue: Report generation fails

**Symptoms**:
- "File not found" errors
- "Citation validation failed"
- "Report generation timeout"

**Solution**:

```bash
# Check if source files exist
ls -la Reports/
ls -la AIReports/

# Try generating reports again
python Script/opc1_generate.py

# Check for citation errors
python Script/validate_citations.py --help
```

### Issue: Citation validation fails

**Symptoms**:
- "Citation not found" errors
- "Invalid citation format"
- "Source file missing"

**Solution**:

```bash
# Check if source file exists
ls -la Reports/Iran-Analyze-Sources-Inventory-2026-04-03.md

# Try validation again
python Script/validate_citations.py \
    --sources Reports/Iran-Analyze-Sources-Inventory-2026-04-03.md \
    Reports/伊朗冲突全球媒体态度分析报告-2026-04-03.md
```

## File System Issues

### Issue: File permissions

**Symptoms**:
- "Permission denied" errors
- "Access denied" messages
- Unable to write to directories

**Solution**:

```bash
# Check file permissions
ls -la /home/wang/wk

# Fix permissions if needed
chmod -R 755 /home/wang/wk
chmod -R 775 /home/wang/wk/AITasks
chmod -R 775 /home/wang/wk/AIReports
```

### Issue: Disk space full

**Symptoms**:
- "No space left on device"
- "Disk full" errors
- Slow performance

**Solution**:

```bash
# Check disk usage
df -h

# Clean up temporary files
rm -rf ~/.cache
rm -rf /tmp/*

# Check for large files
find /home/wang/wk -type f -size +100M -ls
```

## Performance Issues

### Issue: Slow performance

**Symptoms**:
- Scripts take a long time to run
- OpenCode is slow to respond
- Report generation is slow

**Solution**:

```bash
# Check system resources
free -h
df -h

# Close unnecessary applications
# Clear browser cache
# Close unused tabs

# Optimize Python
# Use PyPy if available
# Optimize code if possible

# Optimize Node.js
# Use Node.js with --max-old-space-size
node --max-old-space-size=4096 code/docusign-keys/DEV/your_script.js
```

## Getting Additional Help

### If the above solutions don't work:

1. **Check the logs**: Look for error messages in the terminal output
2. **Review the documentation**: Refer to AGENTS.md for detailed information
3. **Check the examples**: Look in the `examples/` directory for usage examples
4. **Contact support**: If issues persist, contact your system administrator

### Common error patterns to look for:

- **ModuleNotFoundError**: Install missing Python packages
- **ImportError**: Check Python path or install missing modules
- **SyntaxError**: Check Python syntax
- **PermissionError**: Check file permissions
- **TimeoutError**: Check network connectivity or increase timeout
- **MemoryError**: Close other applications or optimize code

### Emergency troubleshooting:

```bash
# Emergency: Reset environment
rm -rf .venv
rm -rf node_modules
cd code/docusign-keys/DEV
rm -rf node_modules

# Emergency: Clean up
rm -rf ~/.cache
rm -rf /tmp/*

# Emergency: Check system
uname -a
python --version
node --version
git --version
```

## Support Resources

- **Documentation**: AGENTS.md, SETUP.md, QUICK_START.md, TROUBLESHOOTING.md
- **Community**: OpenCode forums and documentation
- **Troubleshooting**: Check this guide for common issues
- **Contact**: System administrator for advanced support

---

**Remember**: Always check the error messages carefully and follow the specific solutions provided for your issue. If problems persist, don't hesitate to seek additional help.**