// /lib/fonts.ts
import localFont from 'next/font/local';

export const geist = localFont({
  src: [
    {
      path: '../public/fonts/geist/Geist-Thin.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../public/fonts/geist/Geist-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/geist/Geist-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/geist/Geist-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/geist/Geist-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-geist',
  display: 'swap',
});


export const geistMono = localFont({
    src: [
      { path: '../public/fonts/geist-mono/GeistMono-Thin.woff2', weight: '100', style: 'normal' },
      { path: '../public/fonts/geist-mono/GeistMono-ThinItalic.woff2', weight: '100', style: 'italic' },
      { path: '../public/fonts/geist-mono/GeistMono-Light.woff2', weight: '300', style: 'normal' },
      { path: '../public/fonts/geist-mono/GeistMono-LightItalic.woff2', weight: '300', style: 'italic' },
      { path: '../public/fonts/geist-mono/GeistMono-Regular.woff2', weight: '400', style: 'normal' },
      { path: '../public/fonts/geist-mono/GeistMono-Italic.woff2', weight: '400', style: 'italic' },
      { path: '../public/fonts/geist-mono/GeistMono-Medium.woff2', weight: '500', style: 'normal' },
      { path: '../public/fonts/geist-mono/GeistMono-MediumItalic.woff2', weight: '500', style: 'italic' },
      { path: '../public/fonts/geist-mono/GeistMono-SemiBold.woff2', weight: '600', style: 'normal' },
      { path: '../public/fonts/geist-mono/GeistMono-SemiBoldItalic.woff2', weight: '600', style: 'italic' },
      { path: '../public/fonts/geist-mono/GeistMono-Bold.woff2', weight: '700', style: 'normal' },
      { path: '../public/fonts/geist-mono/GeistMono-BoldItalic.woff2', weight: '700', style: 'italic' },
      { path: '../public/fonts/geist-mono/GeistMono-Black.woff2', weight: '900', style: 'normal' },
      { path: '../public/fonts/geist-mono/GeistMono-BlackItalic.woff2', weight: '900', style: 'italic' },
    ],
    variable: '--font-geist-mono',
    display: 'swap',
  });