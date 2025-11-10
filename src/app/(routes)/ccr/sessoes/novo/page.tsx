import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionForm } from '../components/session-form';

export default function NovaSessaoPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Nova Sessão</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agendar Sessão</CardTitle>
          <CardDescription>
            Agende uma nova sessão de julgamento do CCR
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionForm />
        </CardContent>
      </Card>
    </div>
  );
}
