'use client';

import { useEffect, useState } from 'react';
import { ResourceTable } from './components/resource-table';
import { CCRPageWrapper } from '../components/ccr-page-wrapper';

interface Resource {
  id: string;
  resourceNumber: number;
  fiscalYear: number;
  status: string;
  totalValue: number | null;
  isActive: boolean;
  protocol: {
    id: string;
    number: string;
    subject: string;
    protocolParts: Array<{
      part: {
        id: string;
        name: string;
      };
    }>;
  };
  subjects: Array<{
    subject: {
      id: string;
      name: string;
    };
  }>;
  currentTramitation?: {
    toSector: {
      id: string;
      name: string;
      abbreviation: string | null;
    };
  } | null;
  _count?: {
    tramitations: number;
    documents: number;
    sessionResources: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export default function RecursosPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ccr/resources');
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CCRPageWrapper title="Recursos">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Recursos</h2>
        </div>

        <ResourceTable data={resources} loading={loading} onRefresh={fetchResources} />
      </div>
    </CCRPageWrapper>
  );
}
