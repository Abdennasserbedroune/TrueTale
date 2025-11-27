import { TrendingBooks } from '@/components';

export default function TrendingPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <TrendingBooks limit={20} days={7} />
    </div>
  );
}
