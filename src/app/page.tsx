// pages/gif-creator.js
"use client";
import { useState, useCallback } from 'react';
import Head from 'next/head';

export default function GifCreator() {
  const [gifUrl, setGifUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateGif = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // 清除之前的 URL
      if (gifUrl) {
        URL.revokeObjectURL(gifUrl);
        setGifUrl('');
      }

      const response = await fetch('http://localhost:56218/api/create-gif', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        // 尝试读取错误信息
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create GIF');
        } catch (e) {
          console.log('e',(e as Error));
          throw new Error(`Failed to create GIF: ${response.statusText}`);
        }
      }

      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('image/gif')) {
        throw new Error('Invalid response type from server');
      }

      // 创建 Blob URL
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setGifUrl(url);

    } catch (err) {
      setError((err as Error).message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [gifUrl]);

  const handleDownload = useCallback(() => {
    if (gifUrl) {
      const link = document.createElement('a');
      link.href = gifUrl;
      link.download = 'animation.gif';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [gifUrl]);

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>GIF Creator</title>
      </Head>

      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">GIF Creator</h1>
        
        <div className="space-y-6">
          <div className="flex gap-4">
            <button
              onClick={handleCreateGif}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating GIF...1111
                </span>
              ) : (
                'Create GIF'
              )}
            </button>

            {gifUrl && (
              <button
                onClick={handleDownload}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Download GIF
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {gifUrl && (
            <div className="border rounded-lg p-4">
              <img 
                src={gifUrl} 
                alt="Generated GIF" 
                className="max-w-full rounded"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}