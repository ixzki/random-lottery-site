# 🎲 Random Lottery Site (随机抽奖系统)

一个基于 React + TypeScript + Vite + Tailwind CSS 构建的现代化随机抽奖网站。支持多奖池管理、自定义名单导入、实时抽奖记录以及炫酷的赛博/清新双主题切换（默认为清新亮色）。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-6-purple)

## ✨ 功能特性

*   **多奖池支持**：内置 "90分以上"、"80-89.5分" 及 "全体名单" 三个独立奖池。
*   **灵活抽奖**：支持一次抽取 1人、3人 或 5人。
*   **不重复机制**：已中奖人员自动移出池子，避免重复中奖。
*   **数据持久化**：所有进度（剩余名单、中奖记录、当前奖池）均保存在本地浏览器，刷新不丢失。
*   **自定义名单**：支持 Excel 列复制粘贴导入名单，自动去重。
*   **响应式设计**：完美适配 16:9 横屏投影及移动端设备。

## 🚀 快速开始

### 本地运行

1.  **克隆项目**
    ```bash
    git clone https://github.com/YOUR_USERNAME/random-lottery-site.git
    cd random-lottery-site
    ```

2.  **安装依赖**
    ```bash
    pnpm install
    # 或者 npm install
    ```

3.  **启动开发服务器**
    ```bash
    pnpm dev
    ```
    访问 `http://localhost:5173` 即可看到网站。

4.  **构建生产版本**
    ```bash
    pnpm build
    ```
    构建产物位于 `dist` 目录。

## ☁️ 部署到 Vercel

本项目适配 Vercel 一键部署。

### 步骤 1：上传到 GitHub

1.  在 GitHub 上创建一个新的仓库（例如 `random-lottery-site`）。
2.  在本地项目根目录下执行：
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/random-lottery-site.git
    git push -u origin main
    ```

### 步骤 2：一键部署

点击下方按钮，将自动克隆您的 GitHub 仓库并部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Frandom-lottery-site)

**注意：** 点击按钮后，Vercel 会要求您授权 GitHub 访问权限，然后自动识别 Vite 项目配置，无需手动修改任何设置即可完成部署。

## 🛠️ 技术栈

*   **框架**: [React 19](https://react.dev/)
*   **构建工具**: [Vite](https://vitejs.dev/)
*   **样式**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **UI 组件**: [shadcn/ui](https://ui.shadcn.com/)
*   **图标**: [Lucide React](https://lucide.dev/)
*   **路由**: [wouter](https://github.com/molefrog/wouter) (使用 Hash 路由，适配静态部署)
*   **特效**: [canvas-confetti](https://github.com/catdad/canvas-confetti)

## 📄 License

MIT
