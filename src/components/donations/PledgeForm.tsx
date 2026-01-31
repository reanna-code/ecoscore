import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface PledgeFormProps {
  ngoName: string;
  ngoId: string;
  userBalance: number;
  onSubmit: (points: number) => Promise<void>;
  onCancel: () => void;
}

export function PledgeForm({ ngoName, ngoId, userBalance, onSubmit, onCancel }: PledgeFormProps) {
  const [points, setPoints] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minPoints = 500;
  const maxPoints = Math.max(minPoints, userBalance);
  const dollarValue = points / 100;

  const handleSubmit = async () => {
    if (points < minPoints) {
      setError(`Minimum pledge is ${minPoints} points ($${minPoints / 100})`);
      return;
    }
    if (points > userBalance) {
      setError(`You only have ${userBalance} points`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(points);
    } catch (err: any) {
      setError(err.message || 'Failed to create pledge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Pledge to {ngoName}</CardTitle>
        <CardDescription>
          Your points will be converted to a real donation on the Solana blockchain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Your Balance</Label>
          <p className="text-2xl font-bold text-green-600">
            {userBalance.toLocaleString()} points
            <span className="text-sm text-gray-500 ml-2">(${(userBalance / 100).toFixed(2)})</span>
          </p>
        </div>

        <div className="space-y-4">
          <Label>Pledge Amount</Label>
          <Slider
            value={[points]}
            onValueChange={(v) => setPoints(v[0])}
            min={minPoints}
            max={maxPoints}
            step={100}
            className="w-full"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={points}
              onChange={(e) => setPoints(Math.max(minPoints, parseInt(e.target.value) || 0))}
              min={minPoints}
              max={maxPoints}
              className="w-32"
            />
            <span className="text-gray-500">points</span>
            <span className="text-green-600 font-semibold ml-auto">
              = ${dollarValue.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg text-sm">
          <p className="font-medium text-blue-800 mb-1">How it works:</p>
          <ul className="text-blue-700 space-y-1">
            <li>• Your pledge is queued for the weekly batch</li>
            <li>• Every week, all pledges are sent on-chain</li>
            <li>• You'll receive a Solana transaction receipt</li>
            <li>• 100% of funds go to the NGO</li>
          </ul>
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || points > userBalance}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Processing...' : `Pledge ${points} points`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default PledgeForm;
