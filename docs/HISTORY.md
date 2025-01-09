# 开发历史记录

## 2024-03-xx：项目初始化和文档完善

### 主要更改
1. 初始化项目结构和基础功能
2. 完善项目文档
3. 建立版本控制

### 版本历史
- v1.0.0: 初始功能实现
  - 完整的图片切分功能
  - 多种切分模式支持
  - 实时预览功能
  - 文件命名功能

- v1.0.1: 基础文档完善
  - 添加项目开发记录到 README.md
  - 创建 docs 目录
  - 添加详细的代码注释

- v1.0.2: API 文档完善
  - 添加详细的 API 文档
  - 完善函数说明和使用示例
  - 添加类型定义

- v1.0.3: 开发文档完善
  - 完善项目架构说明
  - 添加开发规范
  - 记录常见问题和解决方案

- v1.0.4: 多图片处理支持
  - 支持批量上传图片
  - 自定义模式下支持图片切换
  - 智能文件夹命名系统
  - 优化批量处理流程

- v1.0.5: 多图片处理增强和问题修复
  - 新增功能：
    - 支持同时处理多张图片
    - 优化多图片的批量命名系统
    - 添加多图片处理进度显示
    - 改进多图片切换和预览体验
  - 问题修复：
    - 修复图片选择工具显示区域重置问题
    - 改进滚动行为和图片居中功能
    - 修复下载文件夹命名问题
  - 代码优化：
    - 重构多图片处理逻辑
    - 优化代码结构和注释
    - 完善项目文档

### 核心功能实现
1. 图片切分功能
   - 均分数量模式
   - 固定尺寸模式
   - 自定义模式

2. 预览功能
   - 实时预览
   - 全屏查看
   - 自定义分割线

3. 文件处理
   - 自动提取文件信息
   - 默认使用原文件名
   - ZIP 打包下载

### 项目文件结构
\`\`\`
image-splitter/
├── src/
│   ├── App.js          # 主应用组件
│   ├── index.js        # 应用入口
│   └── index.css       # 全局样式
├── docs/
│   ├── DEVELOPMENT.md  # 开发文档
│   ├── API.md          # API文档
│   └── HISTORY.md      # 开发历史
├── public/
│   └── index.html      # HTML 模板
├── package.json        # 项目配置
├── tailwind.config.js  # Tailwind 配置
└── postcss.config.js   # PostCSS 配置
\`\`\`

### 技术栈
- React 18.x
- Tailwind CSS 3.x
- react-dropzone 14.x
- JSZip 3.x
- file-saver 2.x

### 待开发功能
- [ ] 批量图片处理
- [ ] 更多输出格式支持
- [ ] 图片压缩选项
- [ ] 切分预设方案保存
- [ ] 暗色主题支持

### 技术债务
- [ ] 添加单元测试
- [ ] 优化大图片处理性能
- [ ] 重构状态管理

### GitHub 仓库
- URL: https://github.com/mokmoth/image-splitter
- 最新版本: v1.0.5
- 主要分支: main

### 开发环境
- Node.js >= 14.0.0
- npm >= 6.0.0

### 如何继续开发
1. 克隆仓库：
\`\`\`bash
git clone https://github.com/mokmoth/image-splitter.git
cd image-splitter
\`\`\`

2. 安装依赖：
\`\`\`bash
npm install
\`\`\`

3. 启动开发服务器：
\`\`\`bash
npm start
\`\`\`

### 注意事项
1. 遵循 Git 提交规范
2. 保持文档同步更新
3. 新功能需要添加到 README.md
4. 重要更新创建新的版本标签

### 如何与composer继续沟通
你可以这样请求帮助：
"我需要继续开发 image-splitter 项目（https://github.com/mokmoth/image-splitter）。这是一个图片切分工具，目前实现了版本 v1.0.3，包含了[你想要开发的功能]功能。"
这样我就能快速了解：
项目的位置和当前状态
2. 项目的核心功能和架构
之前的开发历史
你想要添加的新功能

### GitHub Pages 部署步骤
1. 配置 package.json：
   ```json
   {
     "homepage": "https://mokmoth.github.io/image-splitter",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d build"
     }
   }
   ```

2. 安装部署工具：
   ```bash
   npm install --save-dev gh-pages
   ```

3. 执行部署命令：
   ```bash
   npm run deploy
   ```

4. 配置 GitHub 仓库：
   - 访问 Settings > Pages
   - Source: 选择 "Deploy from a branch"
   - Branch: 选择 "gh-pages" / "/ (root)"
   - 点击 Save

5. 访问部署后的网站：
   - URL: https://mokmoth.github.io/image-splitter
   - 部署可能需要几分钟生效

注意事项：
- 确保 package.json 中的 homepage 字段正确设置
- 部署前先提交所有本地更改
- 部署后检查 gh-pages 分支是否更新
- 如果部署后无法访问，检查仓库设置中的 Pages 配置
