//importar bibliotecas e funções
import '@/app/globals.css';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import { SidebarConfigProvider } from '@/contexts/sidebar-context';
import { SidebarLayout } from '@/components/layout/sidebar-layout';

//definir metadados
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
export const metadata: Metadata = { title: 'JURFIS | SEFAZ', description: 'Sistema de processamento de PDFs' };

//função principal
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={`pt-BR`}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <SidebarConfigProvider>
            <SidebarLayout>
              {children}
            </SidebarLayout>
          </SidebarConfigProvider>
        </Providers>
      </body>
    </html>
  );
};