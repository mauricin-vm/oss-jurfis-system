'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRightLeft } from 'lucide-react';
import { CCRPageWrapper } from '../components/ccr-page-wrapper';

export default function TramitacoesPage() {
  return (
    <CCRPageWrapper title="Tramitações">
      <div className="space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Tramitações</h2>
        </div>

        <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="h-5 w-5" />
            <CardTitle>Gestão de Tramitações</CardTitle>
          </div>
          <CardDescription>
            Controle de tramitações de protocolos e recursos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Módulo em desenvolvimento
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                FASE 5 do roadmap de implementação
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </CCRPageWrapper>
  );
}
