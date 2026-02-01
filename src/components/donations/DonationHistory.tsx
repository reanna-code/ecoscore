import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface Pledge {
  id: string;
  ngo: {
    name: string;
    logoUrl: string;
  };
  points: number;
  estimatedUsd: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  txSignature?: string;
  explorerUrl?: string;
}

interface DonationHistoryProps {
  pledges: Pledge[];
  onPledgeClick?: (pledge: Pledge) => void;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
};

export function DonationHistory({ pledges, onPledgeClick }: DonationHistoryProps) {
  if (pledges.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <p className="text-4xl mb-2">🌱</p>
          <p>No donations yet</p>
          <p className="text-sm">Make your first pledge to support a climate NGO!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Donations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pledges.map((pledge) => (
          <div
            key={pledge.id}
            className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${
              pledge.status === 'completed' && onPledgeClick ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
            }`}
            onClick={() => pledge.status === 'completed' && onPledgeClick?.(pledge)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden">
                {pledge.ngo?.logoUrl ? (
                  <img src={pledge.ngo.logoUrl} alt={pledge.ngo.name} className="w-full h-full object-cover" />
                ) : (
                  '🌍'
                )}
              </div>
              <div>
                <p className="font-medium">{pledge.ngo?.name || 'Unknown NGO'}</p>
                <p className="text-sm text-gray-500">
                  {new Date(pledge.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-600">
                ${pledge.estimatedUsd?.toFixed(2) || '0.00'}
              </p>
              <div className="flex items-center gap-1 justify-end">
                {pledge.explorerUrl ? (
                  <a
                    href={pledge.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge className={statusColors[pledge.status]}>
                      {pledge.status}
                    </Badge>
                    <ExternalLink className="w-3 h-3 text-purple-600" />
                  </a>
                ) : (
                  <Badge className={statusColors[pledge.status]}>
                    {pledge.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
        {pledges.some(p => p.status === 'completed') && (
          <p className="text-xs text-center text-gray-500 pt-2">
            Tap a completed donation to share your impact certificate
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default DonationHistory;
