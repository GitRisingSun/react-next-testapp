// utils/gifGenerator.js
import GIFEncoder from 'gif-encoder-2';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
export async function createGifFromLocalPngs(options = {}) {
  try {
    // 默认配置
    const defaultOptions = {
      inputDir: path.join(process.cwd(), 'public', 'images'), // 默认图片目录
      outputPath: path.join(process.cwd(), 'public', 'output.gif'), // 默认输出路径
      pattern: /\.png$/, // 默认只处理png文件
      delay: 500, // 每帧延迟时间（毫秒）
      repeat: 0,  // 0 表示循环播放
      quality: 10,// 图片质量
      width: 0,   // 自动计算
      height: 0   // 自动计算
    };
    
    const config = { ...defaultOptions, ...options };
    
    // 读取图片目录
    const files = await fs.readdir(config.inputDir);
    const pngFiles = files
      .filter(file => config.pattern.test(file))
      .sort() // 确保顺序一致
      .map(file => path.join(config.inputDir, file));
    
    if (pngFiles.length === 0) {
      throw new Error('No PNG files found in the specified directory');
    }

    // 读取第一张图片获取尺寸
    if (!config.width || !config.height) {
      const firstImage = await sharp(pngFiles[0]).metadata();
      config.width = firstImage.width;
      config.height = firstImage.height;
    }

    // 创建GIF编码器
    const encoder = new GIFEncoder(config.width, config.height);
    
    // 开始编码
    encoder.start();
    encoder.setDelay(config.delay);
    encoder.setRepeat(config.repeat);
    encoder.setQuality(config.quality);

    console.log(`Processing ${pngFiles.length} images...`);

    // 处理每张PNG图片
    for (const [index, pngFile] of pngFiles.entries()) {
      console.log(`Processing image ${index + 1}/${pngFiles.length}: ${path.basename(pngFile)}`);
      
      // 使用sharp调整图片大小并转换为raw格式
      const rawData = await sharp(pngFile)
        .resize(config.width, config.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .raw()
        .toBuffer();

      // 添加帧到GIF
      encoder.addFrame(rawData);
    }

    // 完成编码
    encoder.finish();

    // 获取生成的buffer
    const buffer = encoder.out.getData();
    
    // 保存文件
    await fs.writeFile(config.outputPath, buffer);
    
    console.log(`GIF created successfully at: ${config.outputPath}`);
    
    // 返回相对于public目录的路径，用于在前端显示
    return path.relative(path.join(process.cwd(), 'public'), config.outputPath);
  } catch (error) {
    console.error('Error creating GIF:', error);
    throw error;
  }
}