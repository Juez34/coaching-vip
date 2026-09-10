import "./globals.css";

export const metadata = {
  title: "Coaching VIP - Entraînement & Suivi Haut de Gamme",
  description: "Application de coaching sportif personnalisé",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}