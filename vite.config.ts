import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig(({mode}) => ({
  plugins: [
    react(),
    mode !== 'android-offline' && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['avatar.png'],
      manifest: {
        name: 'Dieting',
        short_name: 'Dieting',
        description: '个人健康与财务记录',
        theme_color: '#f7f5f2',
        background_color: '#f7f5f2',
        display: 'standalone',
        icons: [{src: '/avatar.png?v=11', sizes: 'any', type: 'image/png', purpose: 'any maskable'}]
      }
    })
  ]
}));
