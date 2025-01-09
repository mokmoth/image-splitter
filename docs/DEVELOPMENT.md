# 开发文档

## 项目架构

### 组件结构
- App.js: 主组件，包含所有功能实现
  - 文件上传区域（使用 react-dropzone）
  - 预览区域（使用 Canvas 实现）
    - 图片居中显示
    - 滚动行为优化
    - 自适应缩放
  - 设置区域（切分配置和输出设置）

### 状态管理
目前使用 React Hooks 管理状态，主要包括：
- 图片相关状态 (imageInfo, showFullImage)
- 切分设置状态 (splitDirection, splitMode, splitSize, splitCount, customSlices)
- 输出设置状态 (outputFormat, namePattern, numberDigits, separator)
- UI 交互状态 (splitAreaWidth, draggingSliceIndex, showSliceSizes, justFinishedDragging)
- 预览控制状态 (scrollPosition, imageCenter)

## 核心功能实现

### 图片上传处理
- 使用 react-dropzone 处理文件拖放
- 支持 JPEG、PNG、WebP 格式
- 自动提取文件信息并设置默认文件名

### 图片切分功能
- 支持三种切分模式：均分数量、固定尺寸、自定义
- 使用 Canvas API 进行图片切分
- 使用 JSZip 打包输出文件

### 预览功能
- 使用 Canvas 实现实时预览
- 支持自适应缩放
- 支持全屏预览原图
- 自定义模式下支持拖动分割线

### 图片显示优化
- 实现图片居中显示功能
- 优化滚动行为，防止意外重置
- 添加窗口大小变化响应
- 优化图片选择后的显示效果

## 开发规范

### 代码风格
- 使用 ESLint 和 Prettier 进行代码格式化
- 遵循 React Hooks 的使用规范
- 使用 Tailwind CSS 进行样式管理

### Git 提交规范
提交信息格式：`<type>: <description>`

类型（type）：
- feat: 新功能
- fix: 修复问题
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具的变动

### 版本管理
- 使用语义化版本号（Semantic Versioning）
- 主版本号：不兼容的 API 修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

## 常见问题

### 性能相关
1. 大图片处理
   - 问题：处理大尺寸图片时可能出现性能问题
   - 解决：考虑添加图片压缩选项，或分批处理大文件

2. 预览卡顿
   - 问题：自定义模式下拖动分割线可能出现卡顿
   - 解决：使用防抖和节流优化拖动事件处理

### 浏览器兼容性
1. Canvas 相关
   - 问题：部分旧版浏览器可能不支持某些 Canvas 特性
   - 解决：添加兼容性检查和降级处理

2. 文件处理
   - 问题：不同浏览器对文件类型的支持可能不同
   - 解决：添加文件类型和大小检查，提供清晰的错误提示 