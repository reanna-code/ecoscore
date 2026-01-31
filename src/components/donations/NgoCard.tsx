import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Ngo {
  _id: string;
  name: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  walletAddress: string;
  categories: string[];
  totalReceivedUsd: number;
  donationCount: number;
}

interface NgoCardProps {
  ngo: Ngo;
  onSelect: (ngo: Ngo) => void;
  selected?: boolean;
}

export function NgoCard({ ngo, onSelect, selected }: NgoCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        selected ? 'ring-2 ring-green-500 bg-green-50' : ''
      }`}
      onClick={() => onSelect(ngo)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">
            🌱
          </div>
          <div>
            <CardTitle className="text-lg">{ngo.name}</CardTitle>
            <CardDescription className="text-sm">
              {ngo.donationCount} donations · ${ngo.totalReceivedUsd.toFixed(2)} raised
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ngo.description}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {ngo.categories.map((cat) => (
            <Badge key={cat} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <a
            href={ngo.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Visit website →
          </a>
          <Button
            size="sm"
            variant={selected ? "default" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(ngo);
            }}
          >
            {selected ? '✓ Selected' : 'Select'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default NgoCard;
