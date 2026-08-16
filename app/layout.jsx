import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ServiceWorkerRegistration from '../components/ServiceWorkerRegistration';

export const metadata = {
  /* Without this, Next.js resolves the relative image paths below
     against whatever host the build ran on -- which for a build not
     running on Vercel's own servers means og:image ships as an
     absolute http://localhost:3000/... URL. No outside crawler
     (iMessage, Twitter, Slack, ...) can ever reach that, so every
     shared link silently loses its preview image. Setting an
     explicit, real base is what makes the image actually resolve. */
  metadataBase: new URL('https://orbit-trivia.vercel.app'),
  title: 'Orbit Trivia',
  description:
    'Space and science trivia — NASA, deep space, Tesla, SpaceX and Elon deep cuts. Daily challenges, endless Escape Velocity runs, and pass-and-play Road Trip mode.',
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
    description: 'Space and science trivia — NASA, deep space, Tesla, SpaceX and Elon deep cuts. How far can you get?',
    /* 1200x630 -- the standard share-card size. A square icon reused
       here gets letterboxed or cropped oddly on most platforms; this
       is a dedicated wide crop of the same artwork instead. */
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    /* Without an explicit card type, Twitter/X falls back to a small
       thumbnail alongside the text instead of the full-width image
       every other platform shows. */
    card: 'summary_large_image',
    title: 'Orbit Trivia',
    description: 'Space and science trivia — NASA, deep space, Tesla, SpaceX and Elon deep cuts. How far can you get?',
    images: ['/og-image.png'],
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
      <head>
        {/* Real <link> tags, not a CSS @import inside a JS-rendered <style>.
            <style> is a browser "raw text" element, so entities in an
            @import URL (the ' and & in the Google Fonts query string) get
            HTML-escaped by React on the server but never decoded by the
            browser, and the mismatch fails hydration on every load. A
            <link> has no text content to escape, and it also starts the
            font fetch immediately instead of after hydration. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500&display=swap"
        />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
        <ServiceWorkerRegistration />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
