import React from 'react';
import { Play, FileText, Image as ImageIcon } from 'lucide-react';

const MediaRenderer = ({ url, alt, className, style, thumbnail = false }) => {
  if (!url) return null;

  const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video/upload/');

  if (thumbnail) {
    if (isVideo) {
      // Cloudinary trick: change extension to .jpg for video thumbnail
      const thumbUrl = url.replace(/\/video\/upload\//, '/video/upload/so_auto,w_400,c_limit/').replace(/\.(mp4|webm|ogg|mov)$/, '.jpg');
      return (
        <div style={{ ...style, position: 'relative' }} className={className}>
          <img src={thumbUrl} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Play size={12} fill="currentColor" />
          </div>
        </div>
      );
    }
    return <img src={url} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} className={className} />;
  }

  if (isVideo) {
    // If it's Cloudinary, we force .mp4 extension for maximum compatibility
    // and add auto-transcoding/optimization parameters
    const isCloudinary = url.includes('/video/upload/');
    const videoUrl = isCloudinary 
      ? url.replace(/\/video\/upload\//, '/video/upload/f_auto,q_auto/').replace(/\.(mp4|webm|ogg|mov)$/i, '.mp4') 
      : url;
      
    const posterUrl = isCloudinary 
      ? url.replace(/\/video\/upload\//, '/video/upload/so_auto,f_jpg/').replace(/\.(mp4|webm|ogg|mov)$/i, '.jpg')
      : null;

    return (
      <video 
        src={videoUrl} 
        poster={posterUrl}
        controls 
        playsInline
        preload="metadata"
        className={className}
        style={{ 
          width: '100%', 
          maxHeight: '500px', 
          borderRadius: '0.75rem', 
          background: '#000',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          ...style 
        }}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <img 
      src={url} 
      alt={alt} 
      className={className}
      style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '0.75rem', ...style }}
    />
  );
};

export default MediaRenderer;
