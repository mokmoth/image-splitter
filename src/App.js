import React, { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * 图片切分工具主组件
 * @version 1.0.0
 * @author Rice_LIN
 * 
 * 主要功能：
 * 1. 图片上传和预览
 * 2. 多种切分模式支持
 * 3. 实时预览
 * 4. 自定义切分
 */

function App() {
  // ===== 状态管理 =====
  // 图片相关状态
  const [imageInfo, setImageInfo] = useState(null);        // 存储图片信息（尺寸、格式等）
  const [showFullImage, setShowFullImage] = useState(false); // 控制全屏预览模态框

  // 切分设置相关状态
  const [splitDirection, setSplitDirection] = useState('vertical');  // 切分方向：vertical/horizontal
  const [splitMode, setSplitMode] = useState('count');     // 切分模式：count/fixed/custom
  const [splitSize, setSplitSize] = useState(100);         // 固定尺寸模式下的切分尺寸
  const [splitCount, setSplitCount] = useState(2);         // 均分数量模式下的切分数量
  const [customSlices, setCustomSlices] = useState([]);    // 自定义模式下的切分位置

  // 输出设置相关状态
  const [outputFormat, setOutputFormat] = useState('jpeg'); // 输出格式
  const [namePattern, setNamePattern] = useState('slice'); // 文件名前缀
  const [numberDigits, setNumberDigits] = useState(2);     // 序号位数
  const [separator, setSeparator] = useState('_');         // 连接符号

  // UI 交互相关状态
  const [splitAreaWidth, setSplitAreaWidth] = useState(40);    // 预览区域宽度百分比
  const [draggingSliceIndex, setDraggingSliceIndex] = useState(null); // 当前拖动的分割线索引
  const [showSliceSizes, setShowSliceSizes] = useState(true);  // 是否显示尺寸标注
  const [justFinishedDragging, setJustFinishedDragging] = useState(false); // 防止拖动结束时触发预览
  const [copySuccess, setCopySuccess] = useState(false);    // 复制成功提示状态

  // ===== Refs =====
  const previewCanvasRef = useRef(null);  // 预览画布的引用
  const isDraggingRef = useRef(false);    // 跟踪拖动状态
  const containerRef = useRef(null);       // 容器元素的引用

  // ===== 文件上传处理 =====
  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      // 获取文件名（不包含扩展名）
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      
      img.onload = () => {
        setImageInfo({
          file: file,
          name: file.name,
          width: img.width,
          height: img.height,
          format: file.type,
          size: file.size,
          image: img
        });
        // 设置默认文件名前缀为原文件名
        setNamePattern(fileName);
      };
    }
  };

  // 配置文件拖放区域
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    onDrop
  });

  // ===== 图片切分核心功能 =====
  const splitImage = async () => {
    if (!imageInfo) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const zip = new JSZip();
    
    // 根据不同模式计算切分位置
    let slicePositions;
    if (splitMode === 'custom') {
      // 自定义模式：使用用户定义的切分位置
      slicePositions = [0, ...customSlices.map(pos => pos / 100), 1];
    } else if (splitMode === 'fixed') {
      // 固定尺寸模式：根据指定像素大小计算切分位置
      const totalSize = splitDirection === 'horizontal' ? imageInfo.width : imageInfo.height;
      const sliceSize = splitSize;
      const count = Math.ceil(totalSize / sliceSize);
      slicePositions = Array.from({ length: count + 1 }, (_, i) => 
        Math.min(1, (i * sliceSize) / totalSize)
      );
    } else {
      // 均分模式：平均分配切分位置
      slicePositions = Array.from({ length: splitCount + 1 }, (_, i) => i / splitCount);
    }

    // 执行切分并生成图片
    for (let i = 0; i < slicePositions.length - 1; i++) {
      const start = slicePositions[i];
      const end = slicePositions[i + 1];
      const sliceSize = end - start;

      if (splitDirection === 'horizontal') {
        // 横向切分：调整画布宽度，保持高度不变
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
        // 纵向切分：调整画布高度，保持宽度不变
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

      // 生成文件名并保存切片
      const number = String(i + 1).padStart(numberDigits, '0');
      const fileName = `${namePattern}${separator}${number}.${outputFormat}`;
      const blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${outputFormat}`));
      zip.file(fileName, blob);
    }

    // 打包并下载所有切片
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'sliced_images.zip');
  };

  // ===== 辅助函数 =====
  // 计算实际图片中的位置
  const getActualPosition = (previewPos, previewSize, actualSize) => {
    return Math.round((previewPos * actualSize) / previewSize);
  };

  // 计算预览图中的位置
  const getPreviewPosition = (actualPos, actualSize, previewSize) => {
    return (actualPos * previewSize) / actualSize;
  };

  // 初始化自定义切分位置
  const initializeCustomSlices = (count) => {
    const slices = [];
    const interval = 100 / count;
    
    // 生成均匀分布的切分位置（百分比）
    for (let i = 1; i < count; i++) {
      slices.push(i * interval);
    }
    
    setCustomSlices(slices);
  };

  // ===== 预览图相关功能 =====
  useEffect(() => {
    if (!imageInfo || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const maxPreviewSize = 400; // 预览图最大尺寸
    
    // 计算预览图尺寸，保持宽高比
    let previewWidth = imageInfo.width;
    let previewHeight = imageInfo.height;
    if (previewWidth > maxPreviewSize || previewHeight > maxPreviewSize) {
      const ratio = Math.min(maxPreviewSize / previewWidth, maxPreviewSize / previewHeight);
      previewWidth *= ratio;
      previewHeight *= ratio;
    }
    
    // 设置画布尺寸并绘制图片
    canvas.width = previewWidth;
    canvas.height = previewHeight;
    ctx.drawImage(imageInfo.image, 0, 0, previewWidth, previewHeight);
    
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
      slicePositions = customSlices;
    } else if (splitMode === 'fixed') {
      const totalSize = splitDirection === 'horizontal' ? imageInfo.width : imageInfo.height;
      const sliceSize = splitSize;
      const count = Math.ceil(totalSize / sliceSize);
      slicePositions = Array.from({ length: count - 1 }, (_, i) => 
        Math.min(100, ((i + 1) * sliceSize * 100) / totalSize)
      );
    } else { // count mode
      slicePositions = Array.from({ length: splitCount - 1 }, (_, i) => 
        ((i + 1) * 100) / splitCount
      );
    }

    // 创建分割线
    slicePositions.forEach((slice, index) => {
      const line = document.createElement('div');
      
      if (splitMode === 'custom') {
        // 自定义模式下的分割线样式：可交互
        line.className = `absolute pointer-events-auto bg-red-500/50 hover:bg-blue-500 
          transition-colors group`;
        
        if (splitDirection === 'horizontal') {
          line.className += ' w-[3px] h-full -ml-[1.5px]';
          line.style.left = `${slice}%`;
          
          // 添加拖动手柄
          const handle = document.createElement('div');
          handle.className = `absolute bottom-0 left-1/2 -translate-x-1/2 
            w-4 h-4 bg-white border-2 border-red-500 rounded-full 
            group-hover:border-blue-500 group-hover:scale-110 
            transition-transform cursor-move`;
          line.appendChild(handle);
        } else {
          // 恢复纵向分割线代码
          line.className += ' h-[3px] w-full -mt-[1.5px]';
          line.style.top = `${slice}%`;
          
          // 添加拖动手柄
          const handle = document.createElement('div');
          handle.className = `absolute right-0 top-1/2 -translate-y-1/2 
            w-4 h-4 bg-white border-2 border-red-500 rounded-full 
            group-hover:border-blue-500 group-hover:scale-110 
            transition-transform cursor-move`;
          line.appendChild(handle);
        }

        // 添加拖动事件监听
        line.addEventListener('mousedown', (e) => {
          setDraggingSliceIndex(index);
          document.body.style.cursor = splitDirection === 'horizontal' ? 'col-resize' : 'row-resize';
          e.preventDefault();
        });
      } else {
        // 非自定义模式下的分割线样式：纯展示
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

    // 清理函数
    return () => {
      const overlayContainer = canvas.parentElement?.querySelector('.overlay-container');
      if (overlayContainer) {
        overlayContainer.remove();
      }
    };
  }, [imageInfo, splitDirection, splitMode, splitSize, splitCount, customSlices]);

  // ===== 拖动相关事件处理 =====
  // 处理预览区域和设置区域的分隔条拖动
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
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  // ===== 分割线拖动处理 =====
  const handlePreviewMouseMove = (e) => {
    if (splitMode !== 'custom' || draggingSliceIndex === null) return;

    const canvas = previewCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const isHorizontal = splitDirection === 'horizontal';
    
    let position;
    if (isHorizontal) {
      position = ((e.clientX - rect.left) / rect.width) * 100;
    } else {
      position = ((e.clientY - rect.top) / rect.height) * 100;
    }

    // 限制拖动范围
    const minPos = draggingSliceIndex > 0 ? customSlices[draggingSliceIndex - 1] + 1 : 1;
    const maxPos = draggingSliceIndex < customSlices.length - 1 
      ? customSlices[draggingSliceIndex + 1] - 1 
      : 99;
    
    position = Math.max(minPos, Math.min(maxPos, position));

    const newSlices = [...customSlices];
    newSlices[draggingSliceIndex] = position;
    setCustomSlices(newSlices);
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

  // ===== 全局鼠标事件监听 =====
  // 监听预览区域和设置区域分隔条的拖动
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
  }, [splitMode, draggingSliceIndex, customSlices]);

  // ===== 其他功能处理 =====
  // 复制图片信息功能
  const copyImageInfo = async () => {
    if (!imageInfo) return;

    const info = `文件名: ${imageInfo.name}
尺寸: ${imageInfo.width} x ${imageInfo.height}px
格式: ${imageInfo.format}
文件大小: ${(imageInfo.size / 1024).toFixed(2)}KB`;

    try {
      await navigator.clipboard.writeText(info);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // 2秒后隐藏成功提示
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 切分模式变更处理
  const handleSplitModeChange = (e) => {
    const newMode = e.target.value;
    setSplitMode(newMode);
    if (newMode === 'custom') {
      initializeCustomSlices(splitCount);
    }
  };

  // 计算切片尺寸信息
  const calculateSliceSizes = () => {
    if (!imageInfo) return [];
    
    const slices = [0, ...customSlices, 100];
    const sizes = [];
    
    for (let i = 0; i < slices.length - 1; i++) {
      const start = slices[i];
      const end = slices[i + 1];
      const percentage = end - start;
      
      if (splitDirection === 'horizontal') {
        const width = Math.round((percentage / 100) * imageInfo.width);
        sizes.push({
          index: i + 1,
          width,
          height: imageInfo.height
        });
      } else {
        const height = Math.round((percentage / 100) * imageInfo.height);
        sizes.push({
          index: i + 1,
          width: imageInfo.width,
          height
        });
      }
    }
    
    return sizes;
  };

  // 添加切分数量变更处理函数
  const handleSplitCountChange = (e) => {
    const newCount = Number(e.target.value);
    setSplitCount(newCount);
    
    // 如果是自定义模式，则重新初始化分割线
    if (splitMode === 'custom') {
      initializeCustomSlices(newCount);
    }
  };

  // ===== 渲染界面 =====
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-6">
        {/* 标题 */}
        <h1 className="text-2xl font-bold mb-6 text-black">Image Splitter</h1>
        
        {/* 文件上传区域 */}
        <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400">
          <input {...getInputProps()} />
          <p className="text-gray-600">拖放图片到此处，或点击选择图片</p>
        </div>

        {/* 主要功能区域 */}
        {imageInfo && (
          <div ref={containerRef} className="mt-6 flex flex-col md:flex-row gap-0 relative">
            {/* 预览区域 */}
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
                          setShowFullImage(true);
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
                      
                      {/* 复制成功提示 */}
                      {copySuccess && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          复制成功
                        </span>
                      )}
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-gray-700 text-sm">文件名: {imageInfo.name}</p>
                    <p className="text-gray-700 text-sm">尺寸: {imageInfo.width} x {imageInfo.height}px</p>
                    <p className="text-gray-700 text-sm">格式: {imageInfo.format}</p>
                    <p className="text-gray-700 text-sm">文件大小: {(imageInfo.size / 1024).toFixed(2)}KB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 分隔条 */}
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

            {/* 设置区域 */}
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
                  
                  {/* 文件名前缀设置 */}
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

                {/* 自定义模式下的切片尺寸信息 */}
                {splitMode === 'custom' && imageInfo && (
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

                <button
                  onClick={splitImage}
                  className="w-full bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 transition-colors text-sm"
                >
                  切分并下载
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 全屏预览模态框 */}
        {showFullImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={() => setShowFullImage(false)}
          >
            <div className="relative max-w-[90vw] max-h-[90vh]">
              <img
                src={URL.createObjectURL(imageInfo.file)}
                alt="Original"
                className="max-w-full max-h-[90vh] object-contain"
              />
              <button
                className="absolute top-4 right-4 bg-white rounded-full p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullImage(false);
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