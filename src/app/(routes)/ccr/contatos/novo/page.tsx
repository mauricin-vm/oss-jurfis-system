import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from '../components/contact-form';

export default function NovoContatoPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Novo Contato</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Contato</CardTitle>
          <CardDescription>
            Adicione informações de contato para uma parte cadastrada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </div>
  );
}
