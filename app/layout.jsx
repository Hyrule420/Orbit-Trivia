import './globals.css';

export const metadata = {
  title: 'Orbit Trivia',
  description:
    'Tesla, SpaceX and Elon deep-cut trivia. Daily challenges, endless Escape Velocity runs, and pass-and-play Road Trip mode.',
  manifest: '/manifest.json',
  applicationName: 'Orbit Trivia',
  /* Without this block Safari will not offer Add to Home Screen,
     and if it does the app opens in a browser tab instead of
     fullscreen. The title here is what appears under the icon. */
  appleWebApp: {
    capable: true,
    title: 'Orbit Trivia',
    statusBarStyle: 'black',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Orbit Trivia',
    description: 'Tesla, SpaceX and Elon deep-cut trivia. How far can you get?',
    images: ['/icon-512.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#05070F',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
