
### 3.1 获取代码

```bash
cd /home/wang/wk/code/easy-hire
```

### 3.2 一键启动

```bash
# 启动（自动限制 CPU + 内存不超过系统 30%）
bash start.sh
```

脚本会自动：
1. 启动后端 API 服务（端口 3201）
2. 启动前端开发服务器（端口 5174）
3. 设置 CPU 和内存限制

**停止服务**：
```bash
bash stop.sh
```
