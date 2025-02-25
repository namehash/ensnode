import { IndexingStatus } from '@/components/indexing-status/components';
import { Provider as QueryProvider } from '@/components/query-client/provider';

export default function Status() {
  return (
    <QueryProvider>
      <IndexingStatus />
    </QueryProvider>
  );
}
