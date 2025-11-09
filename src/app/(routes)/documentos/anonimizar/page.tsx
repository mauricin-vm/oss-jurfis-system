'use client'

export default function AnonimizarPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mx-auto max-w-7xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Anonimizar</h1>
          <p className="text-sm text-muted-foreground">
            Extraia páginas, mescle com acórdãos e anonimize informações sensíveis
          </p>
        </div>

        {/* Conteúdo */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center p-8 border rounded-lg">
            <p className="text-muted-foreground">Funcionalidade de anonimizar em desenvolvimento</p>
          </div>
        </div>
      </div>
    </div>
  );
}
