# OpenCode Knowledge Management Workspace

## Overview

This workspace is an Obsidian-based knowledge management system for AI-assisted research, analysis, and task management. It provides a comprehensive environment for development, documentation, and collaboration with OpenCode integration.

## What Makes This Workspace Special

- **AI-Powered Development**: Built with OpenCode for intelligent code assistance
- **Knowledge Management**: Obsidian-based system for organizing research and tasks
- **Multilingual Support**: Both Chinese and English documentation
- **Comprehensive Tooling**: Python, Node.js, and DocuSign integration
- **Professional Standards**: Follows industry best practices for code quality and documentation

## Quick Start

### 1. Initial Setup

```bash
# Navigate to workspace
cd /home/wang/wk

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r Script/requirements.txt

# Install Node.js dependencies (if needed)
cd code/docusign-keys/DEV
npm install
```

### 2. Configure Environment

Create a `.env` file:

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

### 3. Get Started Quickly

```bash
# View quick start guide
cat QUICK_START.md

# View setup instructions
cat SETUP.md

# View troubleshooting guide
cat TROUBLESHOOTING.md
```

## Key Features

### 🚀 AI Development

- **OpenCode Integration**: Intelligent code assistance with multiple AI providers
- **Smart Completion**: Context-aware code suggestions
- **Automated Testing**: Built-in test generation and validation

### 📚 Knowledge Management

- **Obsidian Vault**: Organized research tasks and documentation
- **Multilingual Support**: Chinese and English content
- **Task Management**: Sisyphus work plans for structured workflows

### 🛠️ Development Tools

- **Python Utilities**: OPC1 report generation and validation
- **Node.js Tools**: DocuSign integration and automation
- **Documentation**: Comprehensive guides and troubleshooting

### 📊 Analysis & Reporting

- **Automated Reports**: OPC1 report generation
- **Citation Validation**: Ensure accuracy in all reports
- **Monitoring Tools**: Track report generation progress

## Directory Structure

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
├── templates/              # Templates (to be created)
├── SETUP.md               # Detailed setup instructions
├── QUICK_START.md          # Quick start guide
├── TROUBLESHOOTING.md       # Troubleshooting guide
└── README.md               # This file
```

## Getting Help

### Quick Commands

```bash
# View documentation
ls -la *.md

# Get help with specific topics
# Refer to AGENTS.md for detailed information
# Refer to SETUP.md for setup instructions
# Refer to TROUBLESHOOTING.md for common issues
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Setup problems | Refer to SETUP.md |
| Usage questions | Refer to QUICK_START.md |
| Common errors | Refer to TROUBLESHOOTING.md |
| Advanced help | Contact system administrator |

## Best Practices

### 1. Development
- Follow the existing code style and conventions
- Use type hints and docstrings
- Write comprehensive tests
- Use version control for all changes

### 2. Documentation
- Keep documentation up to date
- Use markdown for all documentation
- Include examples and usage instructions
- Document your thought process

### 3. Collaboration
- Use Git for version control
- Create clear commit messages
- Review code changes before merging
- Document your workflow

### 4. Maintenance
- Regularly update dependencies
- Monitor system performance
- Back up important data
- Keep the environment clean

## Next Steps

1. **Complete initial setup** by configuring your `.env` file
2. **Generate a sample report** to test the OPC1 tools
3. **Explore the AITasks directory** to understand research task structure
4. **Set up DocuSign integration** if you need bulk operations
5. **Customize the environment** for your specific needs

## Support Resources

- **Documentation**: AGENTS.md, SETUP.md, QUICK_START.md, TROUBLESHOOTING.md
- **Community**: OpenCode forums and documentation
- **Troubleshooting**: Check the troubleshooting section in TROUBLESHOOTING.md
- **Contact**: System administrator for advanced support

---

**Welcome to the OpenCode Knowledge Management Workspace!**

This workspace is designed to help you efficiently manage AI-assisted research, analysis, and task management. If you need help, refer to the documentation or contact your system administrator.

**Key Files for Getting Started:**
- `SETUP.md` - Detailed setup instructions
- `QUICK_START.md` - Quick start guide
- `TROUBLESHOOTING.md` - Troubleshooting guide
- `AGENTS.md` - Agent guidelines and configuration

**Happy working!** 🚀