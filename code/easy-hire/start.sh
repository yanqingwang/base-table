#!/bin/bash
# ============================================================
# Easy Hire 一键启动脚本
# 自动启动 backend + frontend，限制总资源不超过系统 30%
# ============================================================
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# ── 颜色 ──
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ── 系统资源计算 (30% 上限) ──
TOTAL_CPU=$(nproc)
TOTAL_MEM_MB=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo)

# 总资源配额的 30% 分配给两个服务
# Backend: 40% of 30% | Frontend: 60% of 30%
BE_CPU_PCT=$(printf "%.0f" "$(echo "$TOTAL_CPU * 0.30 * 0.40 * 100" | bc -l)")
FE_CPU_PCT=$(printf "%.0f" "$(echo "$TOTAL_CPU * 0.30 * 0.60 * 100" | bc -l)")
BE_MEM_MB=$(printf "%.0f" "$(echo "$TOTAL_MEM_MB * 0.30 * 0.40" | bc -l)")
FE_MEM_MB=$(printf "%.0f" "$(echo "$TOTAL_MEM_MB * 0.30 * 0.60" | bc -l)")

# 保底最小值
[ "$BE_CPU_PCT" -lt 50 ] && BE_CPU_PCT=50
[ "$FE_CPU_PCT" -lt 100 ] && FE_CPU_PCT=100
[ "$BE_MEM_MB" -lt 256 ] && BE_MEM_MB=256
[ "$FE_MEM_MB" -lt 512 ] && FE_MEM_MB=512

BE_MEM=$((BE_MEM_MB * 1024 * 1024))
FE_MEM=$((FE_MEM_MB * 1024 * 1024))

echo -e "${YELLOW}System: ${TOTAL_CPU} cores | ${TOTAL_MEM_MB} MB RAM${NC}"
echo -e "${YELLOW}Backend limits: ${BE_CPU_PCT}% CPU | ${BE_MEM_MB} MB RAM${NC}"
echo -e "${YELLOW}Frontend limits: ${FE_CPU_PCT}% CPU | ${FE_MEM_MB} MB RAM${NC}"
echo ""

# ── 先关闭已有进程 ──
systemctl --user stop easyhire-backend.service 2>/dev/null || true
systemctl --user stop easyhire-frontend.service 2>/dev/null || true
systemctl --user reset-failed easyhire-backend.service 2>/dev/null || true
systemctl --user reset-failed easyhire-frontend.service 2>/dev/null || true

# ── 清理旧 DB (可选，注释掉则保留数据) ──
# rm -f "$BACKEND_DIR/easy_hire.db"

# ── 启动 Backend ──
echo -e "${GREEN}[1/2] Starting backend (port 3201)...${NC}"
systemd-run --user --unit easyhire-backend \
  --working-directory "$BACKEND_DIR" \
  -p CPUQuota="${BE_CPU_PCT}%" \
  -p MemoryMax="$BE_MEM" \
  -p MemorySwapMax=0 \
  --collect \
  cargo run

echo -e "${GREEN}[2/2] Starting frontend (port 5174)...${NC}"
systemd-run --user --unit easyhire-frontend \
  --working-directory "$FRONTEND_DIR" \
  -p CPUQuota="${FE_CPU_PCT}%" \
  -p MemoryMax="$FE_MEM" \
  -p MemorySwapMax=0 \
  --collect \
  npm run dev

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Easy Hire 启动中...${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  前端:  http://localhost:5174"
echo "  后端:  http://localhost:3201"
echo ""
echo "  公开页面 (无需登录):"
echo "    http://localhost:5174/jobs         职位广场"
echo "    http://localhost:5174/jobs/:id     职位详情"
echo "    http://localhost:5174/apply/:jobId  简历填写"
echo ""
echo "  管理后台 (需登录):"
echo "    http://localhost:5174/login          登录/注册"
echo "    http://localhost:5174/admin/jobs     职位管理"
echo "    http://localhost:5174/admin/docusign 电子合同"
echo "    http://localhost:5174/admin/export   数据导出"
echo ""
echo -e "${YELLOW}停止服务:  bash stop.sh${NC}"
echo -e "${YELLOW}查看日志:  journalctl --user -u easyhire-backend -f${NC}"
echo -e "${YELLOW}          journalctl --user -u easyhire-frontend -f${NC}"
echo ""
