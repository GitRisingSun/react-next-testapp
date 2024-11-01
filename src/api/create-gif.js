import { join } from 'path';
import { readdir } from 'fs/promises';
import GIFEncoder from 'gif-encoder-2';
import sharp from 'sharp';
import Cors from 'cors';

// CORS 中间件初始化
const cors = Cors({
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: '*', // 在生产环境中建议设置具体的域名
  credentials: true,
  optionsSuccessStatus: 200
});

// CORS 中间件包装函数
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export const config = {
  api: {
    responseLimit: '12mb',
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  // 运行 CORS 中间件
  await runMiddleware(req, res, cors);

  // 预检请求处理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 配置参数
    const config = {
      inputDir: join(process.cwd(), 'public', 'images'),
      delay: 500,
      quality: 10,
      width: 0,
      height: 0
    };

    // 读取图片文件
    const files = await readdir(config.inputDir);
    const pngFiles = files
      .filter(file => file.toLowerCase().endsWith('.png'))
      .sort()
      .map(file => join(config.inputDir, file));

    if (pngFiles.length === 0) {
      return res.status(400).json({ error: 'No PNG files found in images directory' });
    }

    // 获取第一张图片的尺寸
    if (!config.width || !config.height) {
      const firstImage = await sharp(pngFiles[0]).metadata();
      config.width = firstImage.width;
      config.height = firstImage.height;
    }

    // 创建GIF编码器
    const encoder = new GIFEncoder(config.width, config.height);
    encoder.start();
    encoder.setDelay(config.delay);
    encoder.setRepeat(0);
    encoder.setQuality(config.quality);

    // 处理每张图片
    for (const pngFile of pngFiles) {
      const rawData = await sharp(pngFile)
        .resize(config.width, config.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .raw()
        .toBuffer();

      encoder.addFrame(rawData);
    }

    encoder.finish();

    // 获取生成的GIF数据
    const gifBuffer = encoder.out.getData();

    // 设置响应头
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Content-Length', gifBuffer.length);
    res.setHeader('Cache-Control', 'no-store');
    
    // 发送GIF数据
    return res.status(200).send(gifBuffer);

  } catch (error) {
    console.error('Error creating GIF:', error);
    return res.status(500).json({ error: 'Failed to create GIF: ' + error.message });
  }
}