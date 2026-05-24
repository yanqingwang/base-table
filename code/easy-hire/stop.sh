#!/bin/bash
set -e

GREEN='\033[0;32m'
NC='\033[0m'

echo "Stopping Easy Hire services..."

systemctl --user stop easyhire-backend.service 2>/dev/null && echo -e "${GREEN}  ✓ Backend stopped${NC}" || echo "  Backend not running"
systemctl --user stop easyhire-frontend.service 2>/dev/null && echo -e "${GREEN}  ✓ Frontend stopped${NC}" || echo "  Frontend not running"
systemctl --user reset-failed easyhire-backend.service 2>/dev/null || true
systemctl --user reset-failed easyhire-frontend.service 2>/dev/null || true

echo ""
echo -e "${GREEN}All services stopped.${NC}"
