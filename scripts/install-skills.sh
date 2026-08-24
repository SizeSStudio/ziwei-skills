#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# ziwei-skills 一键安装脚本
# 自动将 ziwei-chart, ziwei-natal, ziwei-zhanbu 挂载至 Claude Code / Codex / Agents
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILLS_SRC="$REPO_ROOT/skills"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${BLUE}=== 🔮 安装 Ziwei Skills 到本地 AI 环境 ===${NC}\n"

# 1. 确保排盘引擎依赖并编译
echo -e "${BLUE}[1/3] 检查并构建 TypeScript 排盘引擎...${NC}"
cd "$REPO_ROOT/engine"
if [ ! -d "node_modules" ]; then
    echo "  正在安装 engine 依赖 (npm install)..."
    npm install --silent
fi
echo "  正在构建 engine (npm run build)..."
npm run build --silent
echo -e "${GREEN}  ✓ 排盘引擎构建完成。${NC}\n"

# 2. 检测本地 Skill 目录
echo -e "${BLUE}[2/3] 检测本地 Skills 目标环境...${NC}"
TARGET_DIRS=()

# 常用 AI 工具的 Skills 目录
CANDIDATES=(
    "$HOME/.claude/skills"
    "$HOME/.codex/skills"
    "$HOME/.cc-switch/skills"
    "$HOME/.agents/skills"
)

for dir in "${CANDIDATES[@]}"; do
    parent="$(dirname "$dir")"
    if [ -d "$parent" ] || [ -d "$dir" ]; then
        mkdir -p "$dir"
        TARGET_DIRS+=("$dir")
        echo -e "  ${GREEN}✓ 发现环境:${NC} $dir"
    fi
done

if [ ${#TARGET_DIRS[@]} -eq 0 ]; then
    # 默认创建 ~/.claude/skills
    DEFAULT_DIR="$HOME/.claude/skills"
    mkdir -p "$DEFAULT_DIR"
    TARGET_DIRS+=("$DEFAULT_DIR")
    echo -e "  ${YELLOW}! 未检测到已有环境，默认创建: $DEFAULT_DIR${NC}"
fi

echo ""

# 3. 建立软链接
echo -e "${BLUE}[3/3] 创建 Skill 软链接...${NC}"
SKILL_NAMES=("ziwei-chart" "ziwei-natal" "ziwei-zhanbu")

for target_dir in "${TARGET_DIRS[@]}"; do
    echo -e "  挂载至: ${BOLD}$target_dir${NC}"
    for skill in "${SKILL_NAMES[@]}"; do
        src_path="$SKILLS_SRC/$skill"
        dest_path="$target_dir/$skill"

        if [ -L "$dest_path" ] || [ -e "$dest_path" ]; then
            rm -rf "$dest_path"
        fi

        ln -s "$src_path" "$dest_path"
        echo -e "    - 链接 ${GREEN}$skill${NC} -> $src_path"
    done
done

echo -e "\n${BOLD}${GREEN}======================================================${NC}"
echo -e "${BOLD}${GREEN}🎉 Ziwei Skills 安装成功！${NC}"
echo -e "${BOLD}${GREEN}======================================================${NC}\n"
echo -e "现在可以在 Claude Code 或 Codex 中直接使用以下 Skills："
echo -e "  1. ${BOLD}/ziwei-chart${NC}  - 事实层排盘（真太阳时、三层卦、历法对齐）"
echo -e "  2. ${BOLD}/ziwei-natal${NC}  - 终生命盘系统深度推演（三锚、君臣佐使、正向应卦）"
echo -e "  3. ${BOLD}/ziwei-zhanbu${NC} - 紫微紫占具体事件短期推演（起卦心念、三层卦）\n"
echo -e "本地命令行排盘测试示例："
echo -e "  ${BLUE}npm run cli -- build --datetime \"1998-02-20 09:40\" --place \"杭州\" --gender male --out-dir /tmp/test-chart${NC}\n"
