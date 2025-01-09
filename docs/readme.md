# Image Splitter (图片切分工具)

一个基于 React 和 Tailwind CSS 的在线图片切分工具，支持多种切分模式和自定义选项。

## 功能特点

### 1. 多样化的切分模式
- **均分数量模式**：将图片均等分成指定数量的部分
- **固定尺寸模式**：按照指定的像素大小进行切分
- **自定义模式**：通过拖动分割线自定义每个切片的大小，并实时预览切片尺寸

### 2. 多图片批量处理
- 支持同时上传和处理多张图片
- 智能的批量文件命名系统
- 多图片处理进度显示
- 便捷的图片切换和预览功能
- 批量导出时自动分类整理

### 3. 优化的图片显示
- 智能图片居中显示
- 优化的滚动行为，防止意外重置
- 响应式窗口大小调整
- 流畅的图片选择和切换体验

### 4. 灵活的切分方向
- 支持横向切分和纵向切分
- 可随时切换切分方向，实时预览效果

### 5. 实时预览功能
- 直观的预览界面，实时显示切分效果
- 支持查看原图（点击预览图）
- 自定义模式下显示每个切片的具体尺寸
- 可调整预览区域与设置区域的宽度比例

### 6. 文件命名选项
- 自定义文件名前缀
- 自定义序号位数（1-10位）
- 自定义连接符号
- 实时预览文件命名效果

### 7. 输出选项
- 支持多种输出格式：JPEG、PNG、WebP
- 自动打包为 ZIP 压缩包下载

### 8. 其他功能
- 支持拖放上传图片
- 显示详细的图片信息（尺寸、格式、文件大小等）
- 支持一键复制图片信息
- 响应式设计，适配不同屏幕尺寸

## 安装和使用

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装步骤

1. 克隆项目
```bash
git clone [repository-url]
cd image-splitter
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm start
```

4. 构建生产版本
```bash
npm run build
```

## 技术栈

- **React**: 用于构建用户界面
- **Tailwind CSS**: 用于样式设计
- **react-dropzone**: 处理文件拖放上传
- **JSZip**: 处理 ZIP 文件打包
- **file-saver**: 处理文件下载

## 项目结构

```
image-splitter/
├── src/
│   ├── App.js          # 主应用组件
│   ├── index.js        # 应用入口
│   └── index.css       # 全局样式
├── public/
│   └── index.html      # HTML 模板
├── package.json        # 项目配置和依赖
├── tailwind.config.js  # Tailwind CSS 配置
└── postcss.config.js   # PostCSS 配置
```

## 使用指南

1. **上传图片**
   - 点击上传区域选择图片
   - 或直接将图片拖放到上传区域

2. **选择切分模式**
   - 均分数量：输入想要切分的数量
   - 固定尺寸：输入每个切片的像素大小
   - 自定义：拖动分割线调整每个切片的大小

3. **调整设置**
   - 选择切分方向（横向/纵向）
   - 选择输出格式（JPEG/PNG/WebP）
   - 配置文件命名规则
   - 调整预览区域和设置区域的宽度比例

4. **预览和导出**
   - 在预览区实时查看切分效果
   - 自定义模式下可查看每个切片的具体尺寸
   - 点击"切分并下载"获取打包后的切片

## 注意事项

- 支持的图片格式：JPEG、PNG、WebP
- 建议上传分辨率适中的图片以获得最佳性能
- 自定义模式下，拖动分割线时会自动限制最小间距，确保切分合理
- 预览图会自动缩放以适应显示区域，但不影响输出图片的实际尺寸

## 开发相关

### 开发环境设置
```bash
npm install    # 安装依赖
npm start     # 启动开发服务器
npm test      # 运行测试
npm run build # 构建生产版本
```

### 主要依赖版本
- React: ^18.x.x
- Tailwind CSS: ^3.x.x
- react-dropzone: ^14.x.x
- JSZip: ^3.x.x
- file-saver: ^2.x.x

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 作者

[Rice_LIN] - [rice_lin@outlook.com]

## 致谢

- 感谢所有为本项目提供帮助和建议的贡献者
- 特别感谢用到的所有开源项目的作者和维护者

## 项目开发记录

### 版本 1.0.5 (2024-03-xx)
- 多图片处理增强
  - 支持同时处理多张图片
  - 优化多图片的批量命名系统
  - 添加多图片处理进度显示
  - 改进多图片切换和预览体验
- 界面优化
  - 修复图片选择工具显示区域重置问题
  - 改进滚动行为和图片居中功能
  - 修复下载文件夹命名问题
- 代码优化
  - 重构多图片处理逻辑
  - 优化代码结构和注释
  - 完善项目文档

### 版本 1.0.0 (2024-03-xx)
- 实现基础图片切分功能
- 支持三种切分模式：均分数量、固定尺寸、自定义
- 实现实时预览和全屏查看
- 添加文件命名功能，支持使用原文件名作为默认前缀

### 代码结构说明

#### 核心功能模块
- 图片上传处理 (`onDrop`)
- 切分逻辑实现 (`splitImage`)
- 预览功能 (`useEffect` 预览相关)
- 自定义切分处理 (`handlePreviewMouseMove`, `handlePreviewMouseUp`)

#### 状态管理
```javascript
// 图片相关状态
const [imageInfo, setImageInfo] = useState(null);
const [showFullImage, setShowFullImage] = useState(false);

// 切分设置相关状态
const [splitDirection, setSplitDirection] = useState('vertical');
const [splitMode, setSplitMode] = useState('count');
const [splitSize, setSplitSize] = useState(100);
const [splitCount, setSplitCount] = useState(2);
const [customSlices, setCustomSlices] = useState([]);

// 输出设置相关状态
const [outputFormat, setOutputFormat] = useState('jpeg');
const [namePattern, setNamePattern] = useState('slice');
const [numberDigits, setNumberDigits] = useState(2);
const [separator, setSeparator] = useState('_');
```

### 待开发功能
- [ ] 批量图片处理
- [ ] 更多输出格式支持
- [ ] 图片压缩选项
- [ ] 切分预设方案保存
- [ ] 暗色主题支持

### 技术债务
- [ ] 添加单元测试
- [ ] 优化大图片处理性能
- [ ] 重构状态管理（考虑使用 Context 或 Redux）