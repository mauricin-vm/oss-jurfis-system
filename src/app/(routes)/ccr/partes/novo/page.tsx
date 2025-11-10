import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PartForm } from '../components/part-form';

export default function NovaPartePage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Nova Parte</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Parte</CardTitle>
          <CardDescription>
            Cadastre uma pessoa física ou jurídica que participa dos processos do CCR
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PartForm />
        </CardContent>
      </Card>
    </div>
  );
}
