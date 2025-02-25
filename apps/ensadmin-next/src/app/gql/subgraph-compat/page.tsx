'use client';

import { GraphiQLWrapper } from '@/components/graphiql/graphiql-wrapper';
import { selectedEnsNodeUrl } from '@/lib/env';
import { useSearchParams } from 'next/navigation';

export default function PonderGraphQLPage() {
  const searchParams = useSearchParams();
  const endpointUrl = new URL('/subgraph', selectedEnsNodeUrl(searchParams)).toString();

  return <GraphiQLWrapper endpointUrl={endpointUrl} />;
}
