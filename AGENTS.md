# Fanfou Enhancer / 饭否增强器

## 项目概述

这是一个用于[饭否网 (Fanfou.com)](https://fanfou.com) 的用户脚本（Userscript），通过浏览器扩展（如 Tampermonkey、Greasemonkey）安装使用。该项目使用 TypeScript 和 Vite 构建，利用 `vite-plugin-monkey` 插件生成符合 userscript 规范的脚本文件。

### 主要功能

1. **自动加载更多 (Auto-load)**：当页面滚动到底部附近时，自动点击"更多"按钮加载下一页内容
2. **展开用户信息 (Expand User Info)**：自动点击用户资料页的"点击展开"按钮，显示完整用户信息
3. **消息增强 (Message Enhance)**：在消息列表中直接展开显示回复链，支持递归展开最多 3 层回复，包括头像、用户名、时间戳、消息内容和图片

## 技术栈

- **语言**: TypeScript 5.9.2 (ESNext 目标)
- **构建工具**: Vite 7.1.3
- **Userscript 插件**: vite-plugin-monkey 7.1.1
- **代码规范**: ESLint 9 + @antfu/eslint-config
- **包管理器**: pnpm

## 项目结构

```
.
├── src/                      # 源代码目录
│   ├── main.ts              # 入口文件，初始化所有功能
│   ├── auto-load.ts         # 自动加载更多功能
│   ├── expand-user-info.ts  # 自动展开用户信息
│   ├── message-enhance.ts   # 消息增强（核心功能）
│   ├── settings.ts          # 设置菜单（待实现）
│   └── vite-env.d.ts        # Vite 类型声明
├── dist/                    # 构建输出目录
│   └── fanfou-monkey.user.js  # 生成的 userscript 文件
├── package.json             # 项目配置和依赖
├── tsconfig.json           # TypeScript 配置
├── vite.config.ts          # Vite 和 userscript 配置
├── eslint.config.mjs       # ESLint 配置
└── AGENTS.md               # 本文件
```

## 构建命令

```bash
# 安装依赖
pnpm install

# 开发模式（带热更新）
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview

# 代码检查
pnpm lint

# 自动修复代码风格问题
pnpm lint:fix
```

## Userscript 配置

构建后的 userscript 配置位于 `vite.config.ts`：

- **名称**: Fanfou Enhancer
- **匹配网址**: `https://fanfou.com/*`
- **权限**: `unsafeWindow`（用于调用页面原生的图片缩放功能）
- **图标**: 饭否网 favicon

## 代码风格指南

### ESLint 配置

- 使用 @antfu/eslint-config 作为基础配置
- 允许使用 `console`（`no-console: off`）

### 编码约定

1. **模块类型**: ES Modules (`"type": "module"`)
2. **严格模式**: TypeScript 启用严格类型检查
3. **导入风格**: 使用命名导出/导入
4. **注释语言**: 中文注释为主
5. **DOM 操作**: 
   - 使用类型断言（`as HTMLButtonElement`）确保元素类型安全
   - 优先使用 `querySelector` 和 `querySelectorAll`

### 命名规范

- 函数名: camelCase（如 `setupAutoLoad`, `messageEnhance`）
- 常量: 大写下划线（如 `MORE_ID`, `MAX_FETCH_COUNT`）
- 接口名: PascalCase（如 `FetchStatusOptions`, `User`）

## 开发注意事项

### 重要实现细节

1. **防抖处理**: `auto-load.ts` 使用 `requestAnimationFrame` 和 `ticking` 标志防止滚动事件重复触发

2. **递归限制**: `message-enhance.ts` 中 `MAX_FETCH_COUNT = 3` 限制回复链递归深度，防止无限循环

3. **DOM 变化监听**: 使用 `MutationObserver` 监听动态加载的内容（瀑布流）

4. **页面判断逻辑**:
   - `/browse` 页面不启用自动加载
   - `/home` 和 `/q/*` 路径启用 MutationObserver
   - `/statuses/*` 为单条消息页面，特殊处理

5. **错误处理**: 
   - 网络请求失败时（如 404），将链接添加删除线样式
   - 消息不可见时（被删除或权限限制），同样添加删除线

### 样式类名约定

项目使用 `ff-` 前缀的自定义 CSS 类名：
- `.ff-reply-list` - 回复列表容器
- `.ff-reply` - 单条回复
- `.ff-reply-title` - 回复标题（头像、用户名、时间）
- `.ff-reply-body` - 回复内容
- `.ff-expand` - 继续展开按钮

### unsafeWindow 使用

脚本通过 `$` 导入 `unsafeWindow`，用于调用页面原生的 `FF.app.Zoom.init()` 方法实现图片点击放大功能。

## 待实现功能

- `settings.ts`: 计划实现设置菜单，在鼠标悬停"设置"导航项时显示下拉菜单，包含"自动加载更多"等选项开关

## 部署

构建后的 `dist/fanfou-monkey.user.js` 可直接复制到 userscript 管理器中安装，或托管到 CDN/ GreasyFork 等平台分发。
