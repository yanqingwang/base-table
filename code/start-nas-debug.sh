#!/bin/bash
# 启动Chromium CDP调试模式，使用持久化profile
# Playwright可通过 connectOverCDP('http://localhost:9222') 连接同一实例

CHROMIUM="/usr/bin/chromium"
PROFILE_DIR="/home/wang/.config/chromium"
CDP_PORT=9222
NAS_URL="http://172.22.22.239:5000/"

echo "=== 启动Chromium CDP调试模式 ==="
echo "Profile: $PROFILE_DIR"
echo "CDP端口: $CDP_PORT"
echo "NAS地址: $NAS_URL"
echo ""
echo "Playwright连接方式:"
echo "  const browser = await playwright.chromium.connectOverCDP('http://localhost:$CDP_PORT');"
echo ""

# 关闭已有实例
pkill -f "chromium.*remote-debugging-port=$CDP_PORT" 2>/dev/null
sleep 1

# 启动Chromium
nohup "$CHROMIUM" \
    --remote-debugging-port=$CDP_PORT \
    --user-data-dir="$PROFILE_DIR" \
    --no-first-run \
    --no-default-browser-check \
    "$NAS_URL" \
    > /tmp/chromium-cdp.log 2>&1 &

CHROMIUM_PID=$!
echo "Chromium已启动 (PID: $CHROMIUM_PID)"

# 等待就绪
for i in $(seq 1 10); do
    if curl -s http://localhost:$CDP_PORT/json/version > /dev/null 2>&1; then
        echo "CDP端口就绪 (${i}s)"
        break
    fi
    sleep 1
done

echo ""
echo "DevTools前端URL:"
echo "  https://chrome-devtools-frontend.appspot.com/serve_rev/@.../inspector.html?ws=localhost:$CDP_PORT/devtools/page/..."
echo ""
echo "可用命令:"
echo "  列出页面:    curl -s http://localhost:$CDP_PORT/json"
echo "  打开新页面:  curl -s -X PUT 'http://localhost:$CDP_PORT/json/new?URL'"
