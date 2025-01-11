# Image Splitter 开发文档

## 项目结构
```
src/
├── App.js          # 主应用组件
├── index.css       # 全局样式
└── index.js        # 应用入口
```

## 技术栈
- React 18
- Tailwind CSS
- react-dropzone：处理文件拖放
- jszip：处理 ZIP 文件
- file-saver：处理文件下载

## 核心功能实现

### 图片上传
使用 react-dropzone 处理文件上传，支持拖放和点击选择。

### 预览实现
使用 Canvas 绘制预览图，支持：
- 自适应缩放
- 实时预览切分效果
- 分割线交互

### 自定义切分
- 使用 imageCustomSlices 存储每张图片的切分位置
- 支持拖动调整分割线位置
- 自动保存每张图片的切分设置

### 批量处理
- 支持多图片上传和处理
- 使用 ZIP 打包输出
- 保持每张图片的独立设置

## 开发指南

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm start
```

### 构建生产版本
```bash
npm run build
```

### 部署
```bash
npm run deploy
``` 