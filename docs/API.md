# API 文档

## 核心函数

### 图片上传处理

#### onDrop
处理图片文件上传
\`\`\`typescript
const onDrop = async (acceptedFiles: File[]) => void
\`\`\`
参数：
- acceptedFiles: 用户选择或拖放的文件数组

返回：void

使用示例：
\`\`\`typescript
const { getRootProps, getInputProps } = useDropzone({
  accept: {
    'image/*': ['.jpeg', '.jpg', '.png', '.webp']
  },
  multiple: false,
  onDrop
});
\`\`\`

### 图片切分功能

#### splitImage
执行图片切分操作
\`\`\`typescript
const splitImage = async () => void
\`\`\`
功能：
- 根据当前设置对图片进行切分
- 生成多个图片切片
- 打包为 ZIP 文件并下载

使用示例：
\`\`\`jsx
<button onClick={splitImage}>切分并下载</button>
\`\`\`

### 预览相关

#### initializeCustomSlices
初始化自定义切分位置
\`\`\`typescript
const initializeCustomSlices = (count: number) => void
\`\`\`
参数：
- count: 切分数量

使用示例：
\`\`\`typescript
if (splitMode === 'custom') {
  initializeCustomSlices(splitCount);
}
\`\`\`

#### calculateSliceSizes
计算切片尺寸信息
\`\`\`typescript
const calculateSliceSizes = () => Array<{
  index: number;
  width: number;
  height: number;
}>
\`\`\`
返回：包含每个切片尺寸信息的数组

使用示例：
\`\`\`typescript
const sizes = calculateSliceSizes();
sizes.map(size => console.log(\`\${size.width} x \${size.height}px\`));
\`\`\`

### 工具函数

#### getActualPosition
计算实际图片中的位置
\`\`\`typescript
const getActualPosition = (
  previewPos: number,
  previewSize: number,
  actualSize: number
) => number
\`\`\`

#### getPreviewPosition
计算预览图中的位置
\`\`\`typescript
const getPreviewPosition = (
  actualPos: number,
  actualSize: number,
  previewSize: number
) => number
\`\`\`

### 事件处理

#### handleDragStart
开始拖动分隔条
\`\`\`typescript
const handleDragStart = () => void
\`\`\`

#### handlePreviewMouseMove
处理预览区域鼠标移动
\`\`\`typescript
const handlePreviewMouseMove = (e: MouseEvent) => void
\`\`\`

#### handlePreviewMouseUp
处理预览区域鼠标释放
\`\`\`typescript
const handlePreviewMouseUp = () => void
\`\`\`

### 图片显示控制

#### handleImageScroll
处理图片预览区域的滚动行为
\`\`\`typescript
const handleImageScroll = (e: WheelEvent) => void
\`\`\`
功能：
- 控制图片预览区域的滚动行为
- 防止滚动事件冒泡
- 维持图片居中显示

#### centerImage
居中显示图片
\`\`\`typescript
const centerImage = () => void
\`\`\`
功能：
- 计算并设置图片在预览区域的居中位置
- 在图片选择或窗口大小改变时自动调用
- 优化用户体验

## 状态定义

### 图片信息
\`\`\`typescript
interface ImageInfo {
  file: File;
  name: string;
  width: number;
  height: number;
  format: string;
  size: number;
  image: HTMLImageElement;
}
\`\`\`

### 切片尺寸信息
\`\`\`typescript
interface SliceSize {
  index: number;
  width: number;
  height: number;
}
\`\`\`

## 事件流程

### 图片上传流程
1. 用户拖放或选择图片
2. onDrop 函数处理文件
3. 创建图片对象并加载
4. 设置 imageInfo 状态
5. 设置默认文件名前缀

### 切分流程
1. 用户配置切分参数
2. 点击切分按钮
3. splitImage 函数执行切分
4. 生成切片图片
5. 打包并下载

### 预览交互流程
1. 图片加载后自动生成预览
2. 用户可调整预览区域大小
3. 自定义模式下可拖动分割线
4. 实时更新预览效果
