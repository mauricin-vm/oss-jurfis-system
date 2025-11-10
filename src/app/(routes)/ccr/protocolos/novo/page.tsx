import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtocolForm } from '../components/protocol-form';

export default function NovoProtocoloPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Novo Protocolo</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Protocolo</CardTitle>
          <CardDescription>
            Registre um novo protocolo no sistema. O número será gerado automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProtocolForm />
        </CardContent>
      </Card>
    </div>
  );
}
