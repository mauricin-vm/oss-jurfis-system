'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { getResourceStatusLabel, getResourceStatusColor, type ResourceStatusKey } from '@/app/(routes)/ccr/hooks/resource-status';

interface ResourceSearchCardProps {
  resource: {
    id: string;
    resourceNumber: string;
    processNumber: string;
    processName: string | null;
    status: ResourceStatusKey;
    distributionInfo: {
      relator: {
        id: string;
        name: string;
        role: string;
      } | null;
      relatorSessionDate: Date | null;
      revisores: Array<{
        id: string;
        name: string;
        role: string;
        distributionDate: Date | null;
      }>;
    } | null;
  };
  index: number;
  onSelect: () => void;
}

export function ResourceSearchCard({ resource, index, onSelect }: ResourceSearchCardProps) {
  const formatReviewers = (reviewers: Array<{ name: string }>) => {
    if (reviewers.length === 0) return '-';
    if (reviewers.length === 1) return reviewers[0].name;
    if (reviewers.length === 2) return `${reviewers[0].name} e ${reviewers[1].name}`;
    const lastReviewer = reviewers[reviewers.length - 1];
    const otherReviewers = reviewers.slice(0, -1);
    return `${otherReviewers.map((r) => r.name).join(', ')} e ${lastReviewer.name}`;
  };

  return (
    <div className="rounded-lg border p-6 bg-white hover:bg-gray-50 transition-colors cursor-pointer" onClick={onSelect}>
      {/* Cabeçalho do Card */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm flex-shrink-0 transition-colors',
              'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {index}
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/ccr/recursos/${resource.id}`}
                  target="_blank"
                  className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {resource.resourceNumber}
                </Link>
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border w-fit',
                    getResourceStatusColor(resource.status)
                  )}
                >
                  {getResourceStatusLabel(resource.status)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {resource.processNumber}
              </div>
              {resource.processName && (
                <div className="text-sm text-muted-foreground mt-0.5">
                  {resource.processName}
                </div>
              )}
            </div>

            <div className="space-y-0.5 text-sm">
              {resource.distributionInfo?.relator && (
                <div>
                  <span className="font-medium">Relator: </span>
                  <span className="text-muted-foreground">
                    {resource.distributionInfo.relator.name}
                  </span>
                </div>
              )}
              {resource.distributionInfo &&
                resource.distributionInfo.revisores &&
                resource.distributionInfo.revisores.length > 0 && (
                  <div>
                    <span className="font-medium">
                      {resource.distributionInfo.revisores.length === 1
                        ? 'Revisor: '
                        : 'Revisores: '}
                    </span>
                    <span className="text-muted-foreground">
                      {formatReviewers(resource.distributionInfo.revisores)}
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer h-9"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            Selecionar
          </Button>
        </div>
      </div>
    </div>
  );
}
