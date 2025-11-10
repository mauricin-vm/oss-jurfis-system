import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileStack } from 'lucide-react';

export default function AtasPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Atas</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileStack className="h-5 w-5" />
            <CardTitle>Gestão de Atas</CardTitle>
          </div>
          <CardDescription>
            Geração e consulta de atas das sessões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Módulo em desenvolvimento
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                FASE 7 do roadmap de implementação
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
