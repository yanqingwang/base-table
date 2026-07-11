# Quick Start Guide

## Welcome to the OpenCode Knowledge Management Workspace!

This workspace is designed to help you efficiently manage AI-assisted research, analysis, and task management. Here's how to get started quickly.

## What This Workspace Provides

- **Obsidian-based knowledge management** for research tasks
- **AI-assisted analysis** with comprehensive reporting tools
- **Development environment** with Python and Node.js support
- **DocuSign integration** for bulk operations
- **OpenCode integration** for AI coding assistance

## Getting Started

### 1. Basic Setup

```bash
# Navigate to your workspace
cd /home/wang/wk

# Check if Python environment is set up
python --version

# Check if Node.js is available
node --version

# Check if Git is available
git --version
```

### 2. Install Dependencies

```bash
# Install Python dependencies
pip install -r Script/requirements.txt

# Install Node.js dependencies (if needed)
cd code/docusign-keys/DEV
npm install
```

### 3. Configure Environment

Create a `.env` file in the workspace root:

```bash
# Copy this template
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

## Core Features

### 1. Research Tasks (AITasks/)

- **Obsidian vault** for organizing research tasks
- **Chinese and English support** for international teams
- **Task management** with Sisyphus work plans

**How to use:**
```bash
# Browse research tasks
cd AITasks
# Open in Obsidian or your preferred editor
```

### 2. Analysis Reports (AIReports/)

- **Automated report generation** with OPC1 tools
- **Citation validation** to ensure accuracy
- **Multilingual support** for global teams

**Quick report generation:**
```bash
# Generate reports
python Script/opc1_generate.py

# Monitor report generation
python Script/opc1_monitor.py
```

### 3. Development Tools (Script/)

- **Python utilities** for data processing and analysis
- **Citation validation** tools
- **Report monitoring** tools

**Common commands:**
```bash
# Validate citations in reports
python Script/validate_citations.py \
    --sources Reports/Iran-Analyze-Sources-Inventory-2026-04-03.md \
    Reports/伊朗冲突全球媒体态度分析报告-2026-04-03.md
```

### 4. DocuSign Integration (code/docusign-keys/DEV/)

- **Bulk envelope sending** from CSV or XLSX files
- **Completed envelope export** with PDF and data extraction
- **Webhook support** for real-time updates

**Quick DocuSign operations:**
```bash
# Get JWT access token
python code/docusign-keys/DEV/docusign_auth.py

# Send bulk envelopes (dry run first)
python code/docusign-keys/DEV/docusign_bulk_send.py \
    --template-id <TEMPLATE_GUID> \
    --csv /path/to/employees.csv \
    --role-name "Candidate" \
    --dry-run
```

## Getting Help

### Quick Commands

```bash
# View setup instructions
cat SETUP.md | head -50

# View this quick start guide
cat QUICK_START.md

# View detailed documentation
cat AGENTS.md | head -100
```

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Python dependencies missing | `pip install -r Script/requirements.txt` |
| Node.js dependencies missing | `cd code/docusign-keys/DEV && npm install` |
| OpenCode not responding | Check API key in .env file |
| DocuSign auth failed | Verify client ID/secret in .env file |

## Next Steps

1. **Complete initial setup** by configuring your `.env` file
2. **Generate a sample report** to test the OPC1 tools
3. **Explore the AITasks directory** to understand research task structure
4. **Set up DocuSign integration** if you need bulk operations
5. **Customize the environment** for your specific needs

## Tips for Efficiency

- **Use shortcuts**: Many commands can be abbreviated
- **Save frequently used commands**: Create shell aliases for common operations
- **Monitor progress**: Use the OPC1 monitor to track report generation
- **Validate citations**: Always validate citations before sharing reports
- **Backup important data**: Regularly backup your AITasks and AIReports

## Support Resources

- **Documentation**: AGENTS.md, SETUP.md, QUICK_START.md
- **Community**: OpenCode forums and documentation
- **Troubleshooting**: Check the troubleshooting section in SETUP.md
- **Contact**: System administrator for advanced support

---

**Happy working! If you need help, refer to the documentation or contact your system administrator.**