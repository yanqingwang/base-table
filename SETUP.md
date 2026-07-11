# Setup Guide

## Overview

This workspace is an Obsidian-based knowledge management system for AI-assisted research, analysis, and task management. It provides a comprehensive environment for development, documentation, and collaboration.

## Prerequisites

### System Requirements
- Python 3.8 or higher
- Node.js 16 or higher
- Git 2.0 or higher
- Docker (optional, for some services)

### Installed Tools
- OpenCode v1.15.5 (primary AI coding agent)
- GitHub CLI (gh)
- Node.js with npm/yarn
- Python with pip

## Initial Setup

### 1. Clone the Repository

```bash
# Clone the repository
cd /path/to/your/workspace
git clone <repository-url> .

# Navigate to the workspace
cd /home/wang/wk
```

### 2. Environment Setup

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r Script/requirements.txt

# Install Node.js dependencies (if needed)
cd code/docusign-keys/DEV
npm install
```

### 3. Configuration

#### OpenCode Configuration

OpenCode is pre-configured with the following providers:

- **DeepSeek**: `deepseek-chat`, `deepseek-reasoner`, `deepseek-v4-flash`, `deepseek-v4-pro`
- **SiliconFlow (CN)**: `DeepSeek-V3`, `DeepSeek-R1`, `Kimi-K2`, etc.
- **OpenCode (Free)**: `qwen3.6-plus-free`, `nemotron-3-super-free`

#### Environment Variables

Create a `.env` file in the workspace root:

```bash
# OpenCode Configuration
OPENCODE_API_KEY=your_api_key_here
OPENCODE_PROVIDER=deepseek

# DocuSign Configuration (if using)
DOCUSIGN_CLIENT_ID=your_client_id
DOCUSIGN_CLIENT_SECRET=your_client_secret
DOCUSIGN_OAUTH_BASE_URL=https://account-d.docusign.com

# Database Configuration
DATABASE_URL=sqlite:///dl_hire.db
```

### 4. Directory Structure

The workspace has the following structure:

```
/home/wang/wk/
├── AGENTS.md              # Agent guidelines and configuration
├── AITasks/               # Obsidian vault with research tasks
│   ├── .obsidian/         # Obsidian configuration
│   ├── .sisyphus/         # Sisyphus work plans
│   │   ├── drafts/        # Draft plans
│   │   └── plans/         # Reviewed/approved plans
│   └── *.md               # Task files (Chinese/English)
├── AIReports/               # Generated analysis reports
├── Reports/Charts          # Generated analysis attached images
├── Script/                 # Python scripts and utilities
│   ├── opc1_generate.py    # OPC1 report generator
│   ├── opc1_monitor.py     # OPC1 monitor
│   ├── validate_citations.py # Citation validation
│   └── requirements.txt    # Python dependencies
├── code/                   # Program code and tools
│   ├── docusign-keys/      # DocuSign tools and configurations
│   ├── easy-hire/          # Easy hire tools
│   ├── hris_tools/         # HR information system tools
│   └── ...                # Other tools
├── memory/                 # Work memory and logs
├── docs/                   # Documentation (to be created)
├── examples/               # Usage examples (to be created)
└── templates/              # Templates (to be created)
```

## Usage Examples

### 1. Running OPC1 Reports

```bash
# Generate OPC1 reports
python Script/opc1_generate.py

# Monitor OPC1 reports
python Script/opc1_monitor.py

# Validate citations in reports
python Script/validate_citations.py \
    --sources Reports/Iran-Analyze-Sources-Inventory-2026-04-03.md \
    Reports/伊朗冲突全球媒体态度分析报告-2026-04-03.md
```

### 2. Using DocuSign Tools

```bash
# Get JWT access token
python code/docusign-keys/DEV/docusign_auth.py

# Bulk send envelopes from CSV
python code/docusign-keys/DEV/docusign_bulk_send.py \
    --template-id <TEMPLATE_GUID> \
    --csv /path/to/employees.csv \
    --role-name "Candidate" \
    --dry-run

# Bulk export completed envelopes
python code/docusign-keys/DEV/docusign_bulk_export.py \
    --status sent \
    --out-dir /path/to/exports
```

### 3. Working with Reports

```bash
# Create a new markdown report
mkdir -p AIReports
# Use the template from AGENTS.md or create your own
```

## Troubleshooting

### Common Issues

#### Issue: Python dependencies not found
**Solution**:
```bash
pip install -r Script/requirements.txt
```

#### Issue: Node.js dependencies not found
**Solution**:
```bash
cd code/docusign-keys/DEV
npm install
```

#### Issue: OpenCode not responding
**Solution**:
1. Check your API key in `.env` file
2. Verify network connectivity
3. Restart OpenCode if needed

#### Issue: DocuSign authentication failed
**Solution**:
1. Verify your client ID and secret in `.env` file
2. Check if your account has the necessary permissions
3. Ensure you're using the correct base URL

### Getting Help

1. **Check the logs**: Look for error messages in the terminal output
2. **Review the documentation**: Refer to AGENTS.md for detailed information
3. **Check the examples**: Look in the `examples/` directory for usage examples
4. **Contact support**: If issues persist, contact your system administrator

## Best Practices

### 1. Code Quality
- Follow the existing code style and conventions
- Use type hints and docstrings for Python code
- Write comprehensive tests for your code
- Use version control for all changes

### 2. Documentation
- Keep documentation up to date
- Use markdown for all documentation
- Include examples and usage instructions
- Document your thought process and decisions

### 3. Collaboration
- Use Git for version control
- Create clear commit messages
- Review code changes before merging
- Document your workflow and processes

### 4. Maintenance
- Regularly update dependencies
- Monitor system performance
- Back up important data
- Keep the environment clean

## Next Steps

After completing the initial setup:

1. **Explore the AITasks directory** to understand the research tasks
2. **Generate some reports** using the OPC1 tools
3. **Set up your DocuSign configuration** if needed
4. **Customize the environment variables** for your specific needs
5. **Create your own scripts** or modify existing ones

## Support

For additional help:
- Refer to the AGENTS.md file for detailed information
- Check the OpenCode documentation
- Visit the OpenCode community forums
- Contact your system administrator

---

*This setup guide was generated based on the workspace structure and configuration in AGENTS.md.*
