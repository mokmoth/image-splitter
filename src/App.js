import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * 图片切分工具主组件
 * @version 1.0.0
 * @author Rice_LIN
 * 
 * 主要功能：
 * 1. 图片上传和预览：支持多图片上传，提供实时预览
 * 2. 多种切分模式：
 *    - 均分模式：按指定数量平均切分
 *    - 固定尺寸模式：按指定像素大小切分
 *    - 自定义模式：手动调整切分位置
 * 3. 实时预览：切分效果实时可见
 * 4. 自定义切分：支持拖拽调整切分位置
 * 5. 批量处理：支持多图片批量切分
 * 6. 灵活配置：支持设置输出格式、文件名等
 */

function App() {
  // ===== 状态管理 =====
  /**
   * 图片相关状态
   * imageInfoList: 存储所有上传图片的信息数组
   * currentImageIndex: 当前选中的图片索引
   * showImageList: 控制全屏预览模态框的显示状态
   */
  const [imageInfoList, setImageInfoList] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageList, setShowImageList] = useState(false);

  /**
   * 切分设置相关状态
   * splitDirection: 切分方向，'vertical'(纵向)或'horizontal'(横向)
   * splitMode: 切分模式，'count'(均分)、'fixed'(固定尺寸)或'custom'(自定义)
   * splitSize: 固定尺寸模式下的切分尺寸（像素）
   * splitCount: 均分模式下的切分数量
   * customSlices: 自定义模式下的切分位置数组（百分比）
   */
  const [splitDirection, setSplitDirection] = useState('vertical');
  const [splitMode, setSplitMode] = useState('count');
  const [splitSize, setSplitSize] = useState(100);
  const [splitCount, setSplitCount] = useState(2);
  const [customSlices, setCustomSlices] = useState([]);

  /**
   * 输出设置相关状态
   * outputFormat: 输出图片格式，支持'jpeg'、'png'、'webp'
   * namePattern: 输出文件名前缀
   * numberDigits: 序号位数
   * separator: 文件名与序号之间的连接符
   */
  const [outputFormat, setOutputFormat] = useState('jpeg');
  const [namePattern, setNamePattern] = useState('slice');
  const [numberDigits, setNumberDigits] = useState(2);
  const [separator, setSeparator] = useState('_');

  /**
   * UI 交互相关状态
   * splitAreaWidth: 预览区域宽度百分比
   * draggingSliceIndex: 当前正在拖动的分割线索引
   * showSliceSizes: 是否显示切片尺寸信息
   * justFinishedDragging: 防止拖动结束时触发预览
   * copySuccess: 复制成功提示状态
   */
  const [splitAreaWidth, setSplitAreaWidth] = useState(40);
  const [draggingSliceIndex, setDraggingSliceIndex] = useState(null);
  const [showSliceSizes, setShowSliceSizes] = useState(true);
  const [justFinishedDragging, setJustFinishedDragging] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  /**
   * 存储每张图片的切分位置
   */
  const [imageCustomSlices, setImageCustomSlices] = useState({});

  // ===== Refs =====
  /**
   * previewCanvasRef: 预览画布的引用，用于绘制预览图
   * isDraggingRef: 跟踪拖动状态的引用
   * containerRef: 主容器元素的引用
   */
  const previewCanvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const containerRef = useRef(null);

  // ===== 添加新的状态来跟踪已编辑的图片 =====
  const [editedImages, setEditedImages] = useState(new Set());

  /**
   * 文件上传处理函数
   * 处理用户拖放或选择的图片文件
   * 1. 为每个文件创建Image对象并加载
   * 2. 收集每个图片的详细信息（尺寸、格式等）
   * 3. 更新状态并初始化相关设置
   */
  const onDrop = async (acceptedFiles) => {
    const imagePromises = acceptedFiles.map(file => new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      
      img.onload = () => {
        resolve({
          file: file,
          name: file.name,
          width: img.width,
          height: img.height,
          format: file.type,
          size: file.size,
          image: img
        });
      };
    }));

    const imageInfos = await Promise.all(imagePromises);
    setImageInfoList(imageInfos);
    setCurrentImageIndex(0);
    
    // 在非自定义模式下，使用原文件名作为前缀
    if (splitMode !== 'custom') {
      setNamePattern('');
    } else {
      setNamePattern(imageInfos[0].name.replace(/\.[^/.]+$/, ""));
    }
  };

  /**
   * 切分单张图片
   * @param {Object} imageInfo - 要切分的图片信息对象
   * 
   * 处理流程：
   * 1. 创建画布和压缩包
   * 2. 根据切分模式计算切分位置
   * 3. 逐个生成切片并添加到压缩包
   * 4. 生成并下载压缩包
   */
  const splitSingleImage = async (imageInfo) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const zip = new JSZip();
    
    // 使用 namePattern 作为文件夹名，如果为空则使用原文件名
    const folderName = namePattern.trim() || imageInfo.name.replace(/\.[^/.]+$/, "");
    const folder = zip.folder(folderName);
    
    // 计算切分位置（转换百分比为小数）
    const slicePositions = [0, ...customSlices.map(pos => pos / 100), 1];

    // 生成切片
    for (let i = 0; i < slicePositions.length - 1; i++) {
      const start = slicePositions[i];
      const end = slicePositions[i + 1];
      const sliceSize = end - start;

      // 根据切分方向设置画布尺寸并绘制切片
      if (splitDirection === 'horizontal') {
        const width = Math.round(sliceSize * imageInfo.width);
        canvas.width = width;
        canvas.height = imageInfo.height;
        ctx.drawImage(
          imageInfo.image,
          Math.round(start * imageInfo.width), 0,
          width, imageInfo.height,
          0, 0,
          width, imageInfo.height
        );
      } else {
        const height = Math.round(sliceSize * imageInfo.height);
        canvas.width = imageInfo.width;
        canvas.height = height;
        ctx.drawImage(
          imageInfo.image,
          0, Math.round(start * imageInfo.height),
          imageInfo.width, height,
          0, 0,
          imageInfo.width, height
        );
      }

      // 生成切片文件并添加到压缩包
      const fileName = `${folderName}${separator}${String(i + 1).padStart(numberDigits, '0')}.${outputFormat}`;
      const blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${outputFormat}`));
      folder.file(fileName, blob);
    }

    // 生成并下载压缩包
    const content = await zip.generateAsync({type: 'blob'});
    saveAs(content, `${folderName}.zip`);
  };

  /**
   * 辅助函数：计算实际图片中的位置
   * 将预览图中的位置转换为实际图片中的位置
   */
  const getActualPosition = (previewPos, previewSize, actualSize) => {
    return Math.round((previewPos * actualSize) / previewSize);
  };

  /**
   * 辅助函数：计算预览图中的位置
   * 将实际图片中的位置转换为预览图中的位置
   */
  const getPreviewPosition = (actualPos, actualSize, previewSize) => {
    return (actualPos * previewSize) / actualSize;
  };

  /**
   * 初始化自定义切分位置
   * 根据指定的切分数量生成均匀分布的切分位置
   */
  const initializeCustomSlices = (count, imageId) => {
    const slices = [];
    const interval = 100 / count;
    
    for (let i = 1; i < count; i++) {
      slices.push(i * interval);
    }
    
    setImageCustomSlices(prev => ({
      ...prev,
      [imageId]: slices
    }));
  };

  /**
   * 图片列表组件
   * 显示所有上传的图片，支持选择和预览
   */
  const ImageList = ({ images, currentIndex, onSelect }) => {
    const listRef = useRef(null);

    return (
      <div className="mt-4 mb-6 bg-gray-50 rounded-lg p-4 w-full">
        <h3 className="text-sm font-semibold mb-2">图片列表</h3>
        <div 
          ref={listRef}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-1"
        >
          {images.map((img, index) => (
            <div
              key={`${img.name}-${index}`}
              className={`p-2 rounded cursor-pointer transition-colors relative
                ${index === currentIndex
                  ? 'bg-blue-100 border-blue-500'
                  : 'bg-white hover:bg-gray-100'
                }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(index);
              }}
            >
              <div className="relative aspect-square">
                <img
                  src={URL.createObjectURL(img.file)}
                  alt={img.name}
                  className="absolute inset-0 w-full h-full object-cover rounded"
                  loading="lazy"
                />
                {editedImages.has(img.file.name) && (
                  <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full" 
                       title="已编辑">
                  </div>
                )}
              </div>
              <p className="text-xs mt-1 truncate">{img.name}</p>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          提示：使用左右键或鼠标滚轮浏览图片列表
          {splitMode === 'custom' && (
            <span className="ml-2">
              • <span className="inline-block w-2 h-2 bg-green-500 rounded-full align-middle mr-1"></span>
              表示已编辑
            </span>
          )}
        </div>
      </div>
    );
  };

  /**
   * 键盘导航事件处理
   * 支持使用方向键在图片列表中导航
   * - 左右键：在同一行内导航
   * - 上下键：在不同行之间导航
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (imageInfoList.length <= 1 || splitMode !== 'custom') return;
      
      // 根据视口宽度确定每行的列数
      const viewportWidth = window.innerWidth;
      let columnsPerRow;
      if (viewportWidth >= 1024) {  // lg
        columnsPerRow = 5;
      } else if (viewportWidth >= 768) {  // md
        columnsPerRow = 4;
      } else if (viewportWidth >= 640) {  // sm
        columnsPerRow = 3;
      } else {  // default
        columnsPerRow = 2;
      }

      let nextIndex = currentImageIndex;
      
      // 处理方向键导航
      switch (e.key) {
        case 'ArrowLeft':
          nextIndex = currentImageIndex > 0 ? currentImageIndex - 1 : currentImageIndex;
          break;
        case 'ArrowRight':
          nextIndex = currentImageIndex < imageInfoList.length - 1 ? currentImageIndex + 1 : currentImageIndex;
          break;
        case 'ArrowUp':
          nextIndex = currentImageIndex - columnsPerRow;
          if (nextIndex < 0) nextIndex = currentImageIndex;
          break;
        case 'ArrowDown':
          nextIndex = currentImageIndex + columnsPerRow;
          if (nextIndex >= imageInfoList.length) nextIndex = currentImageIndex;
          break;
        default:
          return;
      }

      // 只在索引发生变化时更新状态
      if (nextIndex !== currentImageIndex) {
        setCurrentImageIndex(nextIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageInfoList.length, splitMode, currentImageIndex]);

  // ===== 文件上传配置 =====
  /**
   * 配置文件拖放区域
   * 使用 react-dropzone 处理文件上传
   * - accept: 限制只接受图片文件
   * - multiple: 允许多文件上传
   * - onDrop: 文件上传后的处理函数
   */
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    onDrop
  });

  /**
   * 批量切分图片
   * 处理所有上传的图片，生成切片并打包下载
   * 
   * 处理流程：
   * 1. 创建画布和压缩包
   * 2. 遍历处理每张图片
   * 3. 根据不同模式计算切分位置
   * 4. 生成切片并添加到压缩包
   * 5. 最终打包下载
   */
  const splitImage = async () => {
    if (imageInfoList.length === 0) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const zip = new JSZip();
    
    // 处理所有图片
    for (const imageInfo of imageInfoList) {
      // 确定文件夹名称
      let folderName;
      if (splitMode === 'custom' && imageInfo.file.name === imageInfoList[currentImageIndex].file.name) {
        // 自定义模式下当前图片使用设置的文件名前缀
        folderName = namePattern.trim() || imageInfo.name.replace(/\.[^/.]+$/, "");
      } else {
        // 其他情况使用原文件名
        folderName = imageInfo.name.replace(/\.[^/.]+$/, "");
      }
      
      const folder = zip.folder(folderName);
    
      // 根据不同模式计算切分位置
      let slicePositions;
      if (splitMode === 'custom') {
        const imageSlices = imageCustomSlices[imageInfo.file.name] || [];
        slicePositions = [0, ...imageSlices.map(pos => pos / 100), 1];
      } else if (splitMode === 'fixed') {
        // 固定尺寸模式：根据指定像素计算位置
        const totalSize = splitDirection === 'horizontal' ? imageInfo.width : imageInfo.height;
        const sliceSize = splitSize;
        const count = Math.ceil(totalSize / sliceSize);
        slicePositions = Array.from({ length: count + 1 }, (_, i) => 
          Math.min(1, (i * sliceSize) / totalSize)
        );
      } else {
        // 均分模式：平均分配位置
        slicePositions = Array.from({ length: splitCount + 1 }, (_, i) => i / splitCount);
      }

      // 生成切片
      for (let i = 0; i < slicePositions.length - 1; i++) {
        const start = slicePositions[i];
        const end = slicePositions[i + 1];
        const sliceSize = end - start;

        // 根据切分方向设置画布尺寸并绘制
        if (splitDirection === 'horizontal') {
          const width = Math.round(sliceSize * imageInfo.width);
          canvas.width = width;
          canvas.height = imageInfo.height;
          ctx.drawImage(
            imageInfo.image,
            Math.round(start * imageInfo.width), 0,
            width, imageInfo.height,
            0, 0,
            width, imageInfo.height
          );
        } else {
          const height = Math.round(sliceSize * imageInfo.height);
          canvas.width = imageInfo.width;
          canvas.height = height;
          ctx.drawImage(
            imageInfo.image,
            0, Math.round(start * imageInfo.height),
            imageInfo.width, height,
            0, 0,
            imageInfo.width, height
          );
        }

        // 生成切片文件并添加到压缩包
        const prefix = folderName;
        const fileName = `${prefix}${separator}${String(i + 1).padStart(numberDigits, '0')}.${outputFormat}`;
        const blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${outputFormat}`));
        folder.file(fileName, blob);
      }
    }

    // 生成并下载 ZIP 文件
    const content = await zip.generateAsync({type: 'blob'});
    const zipFileName = splitMode === 'custom' 
      ? (imageInfoList.length > 1 ? `split_images_${new Date().getTime()}.zip` : `${namePattern}.zip`)
      : `split_images_${new Date().getTime()}.zip`;
    saveAs(content, zipFileName);
  };

  // 在 useEffect 外部定义渲染函数
  const renderPreview = () => {
    if (!imageInfoList[currentImageIndex] || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const maxPreviewSize = 400; // 预览图最大尺寸
    
    // 计算预览图尺寸，保持宽高比
    let previewWidth = imageInfoList[currentImageIndex].width;
    let previewHeight = imageInfoList[currentImageIndex].height;
    if (previewWidth > maxPreviewSize || previewHeight > maxPreviewSize) {
      const ratio = Math.min(maxPreviewSize / previewWidth, maxPreviewSize / previewHeight);
      previewWidth *= ratio;
      previewHeight *= ratio;
    }
    
    // 设置画布尺寸并绘制图片
    canvas.width = previewWidth;
    canvas.height = previewHeight;
    ctx.drawImage(imageInfoList[currentImageIndex].image, 0, 0, previewWidth, previewHeight);

    // 清理或创建覆盖层容器
    let overlayContainer = canvas.parentElement.querySelector('.overlay-container');
    if (overlayContainer) {
      overlayContainer.innerHTML = '';
    } else {
      overlayContainer = document.createElement('div');
      overlayContainer.className = 'overlay-container absolute inset-0 pointer-events-none';
      canvas.parentElement.appendChild(overlayContainer);
    }

    // 计算分割线位置
    let slicePositions = [];
    if (splitMode === 'custom') {
      const currentImage = imageInfoList[currentImageIndex];
      const customSlices = imageCustomSlices[currentImage.file.name];
      if (customSlices) {
        slicePositions = customSlices;
      } else {
        slicePositions = Array.from({ length: splitCount - 1 }, (_, i) => 
          ((i + 1) * 100) / splitCount
        );
      }
    } else if (splitMode === 'fixed') {
      const totalSize = splitDirection === 'horizontal' ? imageInfoList[currentImageIndex].width : imageInfoList[currentImageIndex].height;
      const sliceSize = splitSize;
      const count = Math.ceil(totalSize / sliceSize);
      slicePositions = Array.from({ length: count - 1 }, (_, i) => 
        Math.min(100, ((i + 1) * sliceSize * 100) / totalSize)
      );
    } else {
      slicePositions = Array.from({ length: splitCount - 1 }, (_, i) => 
        ((i + 1) * 100) / splitCount
      );
    }

    // 创建分割线
    slicePositions.forEach((slice, index) => {
      const line = document.createElement('div');
      
      if (splitMode === 'custom') {
        line.className = `absolute pointer-events-auto bg-red-500/50 hover:bg-blue-500 
          transition-colors group`;
        
        if (splitDirection === 'horizontal') {
          line.className += ' w-[3px] h-full -ml-[1.5px]';
          line.style.left = `${slice}%`;
          
          const handle = document.createElement('div');
          handle.className = `absolute bottom-0 left-1/2 -translate-x-1/2 
            w-4 h-4 bg-white border-2 border-red-500 rounded-full 
            group-hover:border-blue-500 group-hover:scale-110 
            transition-transform cursor-move`;
          line.appendChild(handle);
        } else {
          line.className += ' h-[3px] w-full -mt-[1.5px]';
          line.style.top = `${slice}%`;
          
          const handle = document.createElement('div');
          handle.className = `absolute right-0 top-1/2 -translate-y-1/2 
            w-4 h-4 bg-white border-2 border-red-500 rounded-full 
            group-hover:border-blue-500 group-hover:scale-110 
            transition-transform cursor-move`;
          line.appendChild(handle);
        }

        line.addEventListener('mousedown', (e) => {
          setDraggingSliceIndex(index);
          document.body.style.cursor = splitDirection === 'horizontal' ? 'col-resize' : 'row-resize';
          e.preventDefault();
        });
      } else {
        line.className = 'absolute pointer-events-none';
        
        if (splitDirection === 'horizontal') {
          line.className += ' w-px h-full bg-red-500/50';
          line.style.left = `${slice}%`;
        } else {
          line.className += ' h-px w-full bg-red-500/50';
          line.style.top = `${slice}%`;
        }
      }

      overlayContainer.appendChild(line);
    });
  };

  /**
   * 拖动相关事件处理
   * 处理预览区域和设置区域的分隔条拖动
   */
  const handleDragStart = () => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // 防止拖动时选中文本
  };

  const handleDrag = (e) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    // 计算宽度百分比（限制在20-80%之间）
    const newWidth = Math.min(80, Math.max(20, (mouseX / containerWidth) * 100));
    setSplitAreaWidth(newWidth);
    
    // 立即重新渲染预览图
    requestAnimationFrame(renderPreview);
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  /**
   * 分割线拖动处理
   * 处理自定义模式下分割线的拖动
   */
  const handlePreviewMouseMove = (e) => {
    if (splitMode !== 'custom' || draggingSliceIndex === null) return;

    const currentImage = imageInfoList[currentImageIndex];
    const currentImageId = currentImage.file.name;
    const currentSlices = imageCustomSlices[currentImageId] || [];

    const canvas = previewCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const isHorizontal = splitDirection === 'horizontal';
    
    // 计算拖动位置（百分比）
    let position;
    if (isHorizontal) {
      position = ((e.clientX - rect.left) / rect.width) * 100;
    } else {
      position = ((e.clientY - rect.top) / rect.height) * 100;
    }

    // 限制拖动范围
    const minPos = draggingSliceIndex > 0 ? currentSlices[draggingSliceIndex - 1] + 1 : 1;
    const maxPos = draggingSliceIndex < currentSlices.length - 1 
      ? currentSlices[draggingSliceIndex + 1] - 1 
      : 99;
    
    position = Math.max(minPos, Math.min(maxPos, position));

    // 更新特定图片的切分位置
    const newSlices = [...currentSlices];
    newSlices[draggingSliceIndex] = position;
    setImageCustomSlices(prev => ({
      ...prev,
      [currentImageId]: newSlices
    }));
    
    // 标记图片已编辑
    setEditedImages(prev => new Set([...prev, currentImageId]));
  };

  const handlePreviewMouseUp = () => {
    if (draggingSliceIndex !== null) {
      setDraggingSliceIndex(null);
      document.body.style.cursor = 'default';
      setJustFinishedDragging(true);
      // 短暂延时后重置拖动状态，防止触发预览
      setTimeout(() => {
        setJustFinishedDragging(false);
      }, 100);
    }
  };

  /**
   * 全局鼠标事件监听
   * 处理拖动相关的全局事件
   */
  useEffect(() => {
    const handleMouseMove = (e) => handleDrag(e);
    const handleMouseUp = () => handleDragEnd();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 监听分割线的拖动
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      handlePreviewMouseMove(e);
    };

    const handleGlobalMouseUp = () => {
      handlePreviewMouseUp();
    };

    if (splitMode === 'custom') {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [splitMode, draggingSliceIndex, imageCustomSlices]);

  /**
   * 复制图片信息功能
   * 将当前选中图片的信息复制到剪贴板
   */
  const copyImageInfo = async () => {
    if (!imageInfoList[currentImageIndex]) return;

    const info = `文件名: ${imageInfoList[currentImageIndex].name}
尺寸: ${imageInfoList[currentImageIndex].width} x ${imageInfoList[currentImageIndex].height}px
格式: ${imageInfoList[currentImageIndex].format}
文件大小: ${(imageInfoList[currentImageIndex].size / 1024).toFixed(2)}KB`;

    try {
      await navigator.clipboard.writeText(info);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // 2秒后隐藏成功提示
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  /**
   * 切分模式变更处理
   * 处理切分模式切换时的状态更新
   */
  const handleSplitModeChange = (e) => {
    const newMode = e.target.value;
    setSplitMode(newMode);
    if (newMode === 'custom') {
      // 为所有图片初始化切分位置，使用默认值 4
      setSplitCount(4);
      const newImageCustomSlices = {};
      imageInfoList.forEach(img => {
        const slices = [];
        const interval = 100 / 4;
        for (let i = 1; i < 4; i++) {
          slices.push(i * interval);
        }
        newImageCustomSlices[img.file.name] = slices;
      });
      setImageCustomSlices(newImageCustomSlices);
    }
  };

  /**
   * 计算切片尺寸信息
   * 计算每个切片的实际像素尺寸
   */
  const calculateSliceSizes = () => {
    if (!imageInfoList[currentImageIndex]) return [];
    
    const currentImage = imageInfoList[currentImageIndex];
    const currentSlices = imageCustomSlices[currentImage.file.name] || [];
    const slices = [0, ...currentSlices, 100];
    const sizes = [];
    
    for (let i = 0; i < slices.length - 1; i++) {
      const start = slices[i];
      const end = slices[i + 1];
      const percentage = end - start;
      
      if (splitDirection === 'horizontal') {
        const width = Math.round((percentage / 100) * currentImage.width);
        sizes.push({
          index: i + 1,
          width,
          height: currentImage.height
        });
      } else {
        const height = Math.round((percentage / 100) * currentImage.height);
        sizes.push({
          index: i + 1,
          width: currentImage.width,
          height
        });
      }
    }
    
    return sizes;
  };

  /**
   * 切分数量变更处理
   * 更新切分数量并在自定义模式下重新初始化分割线
   */
  const handleSplitCountChange = (e) => {
    const newCount = Number(e.target.value);
    setSplitCount(newCount);
    
    // 如果是自定义模式，则重新初始化分割线
    if (splitMode === 'custom') {
      initializeCustomSlices(newCount, imageInfoList[currentImageIndex].file.name);
    }
  };

  /**
   * 修改 setCurrentImageIndex 的调用方式，确保切换图片时初始化切分线
   * @param {number} index - 要选择的图片索引
   */
  const handleImageSelect = (index) => {
    setCurrentImageIndex(index);
    
    // 如果是自定义模式
    if (splitMode === 'custom') {
      const currentImage = imageInfoList[index];
      const currentImageSlices = imageCustomSlices[currentImage.file.name];
      
      if (currentImageSlices) {
        // 如果该图片已有切分设置，更新 splitCount 以匹配现有的切分线数量
        setSplitCount(currentImageSlices.length + 1);
      } else {
        // 如果该图片没有切分设置，使用默认值 4 初始化
        setSplitCount(4);
        initializeCustomSlices(4, currentImage.file.name);
      }
    }
  };

  // 修改预览图相关的 useEffect
  useEffect(() => {
    renderPreview();
  }, [imageInfoList, currentImageIndex, splitDirection, splitMode, splitSize, splitCount, imageCustomSlices, splitAreaWidth]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-black">Image Splitter</h1>
        
        <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400">
          <input {...getInputProps()} />
          <p className="text-gray-600">拖放图片到此处，或点击选择图片</p>
        </div>

        {imageInfoList.length > 1 && splitMode === 'custom' && (
          <ImageList
            images={imageInfoList}
            currentIndex={currentImageIndex}
            onSelect={handleImageSelect}
          />
        )}

        {imageInfoList.length > 0 && (
          <div ref={containerRef} className="mt-6 flex flex-col md:flex-row gap-0 relative">
            <div className="md:relative md:pr-4" style={{ width: `${splitAreaWidth}%` }}>
              <div className="sticky top-8">
                <h2 className="text-lg font-semibold mb-2 text-black">预览</h2>
                <div className="relative">
                  <div className="relative group">
                    <canvas
                      ref={previewCanvasRef}
                      className="border rounded w-full cursor-pointer hover:brightness-95 transition-all"
                      onClick={() => {
                        if (!draggingSliceIndex && !justFinishedDragging) {
                          setShowImageList(true);
                        }
                      }}
                      style={{ cursor: splitMode === 'custom' ? 'default' : 'pointer' }}
                    />
                    <p className="text-sm text-gray-500 mt-1">点击预览图可查看原图</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-semibold text-black">图片信息</h2>
                    <button
                      onClick={copyImageInfo}
                      className="flex items-center gap-1 text-sm px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors relative"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      {copySuccess ? '已复制' : '复制信息'}
                      
                      {copySuccess && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          复制成功
                        </span>
                      )}
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-gray-700 text-sm">文件名: {imageInfoList[currentImageIndex].name}</p>
                    <p className="text-gray-700 text-sm">尺寸: {imageInfoList[currentImageIndex].width} x {imageInfoList[currentImageIndex].height}px</p>
                    <p className="text-gray-700 text-sm">格式: {imageInfoList[currentImageIndex].format}</p>
                    <p className="text-gray-700 text-sm">文件大小: {(imageInfoList[currentImageIndex].size / 1024).toFixed(2)}KB</p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="hidden md:flex items-center justify-center w-4 cursor-col-resize group"
              onMouseDown={handleDragStart}
            >
              <div className="w-px h-full bg-gray-200 group-hover:bg-blue-400 relative">
                <div className="absolute inset-y-0 -left-2 -right-2 group-hover:bg-blue-400/20"></div>
                <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
                  <div className="w-1.5 h-8 bg-gray-400 group-hover:bg-blue-400 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="md:relative md:pl-4 min-w-[280px]"
                 style={{ width: `${100 - splitAreaWidth}%` }}>
              <div className="space-y-3">
                <h2 className="text-lg font-semibold mb-2 text-black">切分设置</h2>
                
                <div>
                  <label className="block mb-1 text-gray-700 text-sm">切分方向</label>
                  <select 
                    value={splitDirection}
                    onChange={(e) => setSplitDirection(e.target.value)}
                    className="border rounded p-1.5 w-full text-sm"
                  >
                    <option value="vertical">纵向切分</option>
                    <option value="horizontal">横向切分</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-gray-700 text-sm">切分模式</label>
                  <select 
                    value={splitMode}
                    onChange={handleSplitModeChange}
                    className="border rounded p-1.5 w-full text-sm"
                  >
                    <option value="count">均分数量</option>
                    <option value="fixed">固定尺寸</option>
                    <option value="custom">自定义</option>
                  </select>
                </div>

                {splitMode === 'fixed' ? (
                  <div>
                    <label className="block mb-1 text-gray-700 text-sm">切分尺寸 (像素)</label>
                    <input
                      type="number"
                      value={splitSize}
                      onChange={(e) => setSplitSize(Number(e.target.value))}
                      className="border rounded p-1.5 w-full text-sm"
                      min="1"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block mb-1 text-gray-700 text-sm">切分数量</label>
                    <input
                      type="number"
                      value={splitCount}
                      onChange={handleSplitCountChange}
                      className="border rounded p-1.5 w-full text-sm"
                      min="2"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">文件命名设置</h3>
                  
                  {(splitMode === 'custom' || imageInfoList.length === 1) ? (
                    <div>
                      <label className="block mb-1 text-gray-700 text-sm">文件名前缀</label>
                      <input
                        type="text"
                        value={namePattern}
                        onChange={(e) => setNamePattern(e.target.value)}
                        className="border rounded p-1.5 w-full text-sm"
                        placeholder="输入文件名前缀（默认使用原文件名）"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        默认使用原文件名作为前缀，可以根据需要修改
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-sm text-gray-600">
                        批量处理模式下将使用原文件名作为前缀
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block mb-1 text-gray-700 text-sm">序号位数</label>
                    <input
                      type="number"
                      value={numberDigits}
                      onChange={(e) => setNumberDigits(Math.max(1, Math.min(10, Number(e.target.value))))}
                      className="border rounded p-1.5 w-full text-sm"
                      min="1"
                      max="10"
                      placeholder="设置序号位数（1-10）"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-gray-700 text-sm">连接符号</label>
                    <input
                      type="text"
                      value={separator}
                      onChange={(e) => setSeparator(e.target.value)}
                      className="border rounded p-1.5 w-full text-sm"
                      placeholder="输入连接符号"
                      maxLength={5}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      示例: {namePattern}{separator}{String(1).padStart(numberDigits, '0')}.{outputFormat}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-gray-700 text-sm">输出格式</label>
                  <select 
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="border rounded p-1.5 w-full text-sm"
                  >
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>

                {splitMode === 'custom' && imageInfoList[currentImageIndex] && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 text-sm">切分后图片尺寸</h3>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-[200px] overflow-y-auto">
                      {calculateSliceSizes().map((size, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-100"
                        >
                          <span className="text-gray-500">第 {index + 1} 张：</span>
                          <span className="text-gray-700 font-medium">
                            {size.width} × {size.height}px
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {splitMode === 'custom' && imageInfoList.length > 1 ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => splitSingleImage(imageInfoList[currentImageIndex])}
                      className="w-full bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 transition-colors text-sm"
                    >
                      切分并下载当前图片
                    </button>
                    <button
                      onClick={splitImage}
                      className="w-full bg-green-500 text-white px-3 py-1.5 rounded hover:bg-green-600 transition-colors text-sm"
                    >
                      切分并下载所有图片
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      提示：下载所有图片时将使用每张图片的原文件名作为前缀
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={splitImage}
                    className="w-full bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 transition-colors text-sm"
                  >
                    切分并下载
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showImageList && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={() => setShowImageList(false)}
          >
            <div className="relative max-w-[90vw] max-h-[90vh]">
              <img
                src={URL.createObjectURL(imageInfoList[currentImageIndex].file)}
                alt="Original"
                className="max-w-full max-h-[90vh] object-contain"
              />
              <button
                className="absolute top-4 right-4 bg-white rounded-full p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageList(false);
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 