import './globals.css';

export const metadata = {
  title: 'Orbit Trivia',
  description: 'Tesla, SpaceX, and Elon deep-cut trivia. Daily challenges and pass-and-play road trip mode.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
