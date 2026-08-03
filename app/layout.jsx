import './globals.css';

export const metadata = {
  title: 'Orbit Trivia',
  description: 'Tesla, SpaceX, and Elon deep-cut trivia. Daily challenges and pass-and-play road trip mode.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
